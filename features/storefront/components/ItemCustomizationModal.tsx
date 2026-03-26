"use client"

import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { MenuItem } from "@/features/storefront/lib/store-data"
import { formatCurrency } from "@/features/storefront/lib/currency"
import {
  getMenuItemDescriptionText,
  getMenuItemHref,
  getMenuItemImageUrl,
} from "@/features/storefront/lib/menu-item-utils"
import { MenuItemPurchaseForm } from "@/features/storefront/components/MenuItemPurchaseForm"

interface ItemCustomizationModalProps {
  item: MenuItem | null
  isOpen: boolean
  onClose: () => void
  currencyCode?: string
  locale?: string
  orderType?: "pickup" | "delivery"
  onAdded?: () => void
}

export function ItemCustomizationModal({ item, isOpen, onClose, currencyCode = "USD", locale = "en-US", orderType = "pickup", onAdded }: ItemCustomizationModalProps) {
  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-background flex flex-col">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>
        <div className="relative h-56 sm:h-72 bg-muted shrink-0">
          <Image src={getMenuItemImageUrl(item)} alt={item.name} fill className="object-cover" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-border px-6 pt-6 pb-4">
            <h2 className="font-serif text-2xl md:text-3xl mb-2">{item.name}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {getMenuItemDescriptionText(item.description)}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="font-medium">{formatCurrency(item.price, { currencyCode, locale })}</span>
              {item.calories && <span className="text-muted-foreground">{item.calories} cal</span>}
              <Link
                href={getMenuItemHref(item.id)}
                onClick={onClose}
                className="ml-auto text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
              >
                View Full Page
              </Link>
            </div>
          </div>

          <MenuItemPurchaseForm
            item={item}
            currencyCode={currencyCode}
            locale={locale}
            orderType={orderType}
            onAdded={() => {
              onAdded?.()
            }}
            className="border-t border-border"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

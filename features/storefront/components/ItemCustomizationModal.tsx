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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-background rounded-2xl border border-border/60 flex flex-col">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>

        {/* Hero image */}
        <div className="relative h-52 sm:h-64 bg-muted shrink-0">
          <Image src={getMenuItemImageUrl(item)} alt={item.name} fill className="object-cover" />
          {item.featured && (
            <span className="absolute left-4 top-4 rounded-full bg-warm-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]">
              Featured
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-4">
            <h2 className="font-serif font-bold text-2xl md:text-3xl tracking-tight mb-2">{item.name}</h2>
            <p className="text-muted-foreground text-[14px] leading-relaxed line-clamp-3">
              {getMenuItemDescriptionText(item.description)}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-lg font-semibold tabular-nums">{formatCurrency(item.price, { currencyCode, locale })}</span>
              {item.calories && (
                <span className="text-[12px] font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                  {item.calories} cal
                </span>
              )}
              <Link
                href={getMenuItemHref(item.id)}
                onClick={onClose}
                className="ml-auto text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Full Details →
              </Link>
            </div>
          </div>

          <div className="border-t border-border/50">
            <MenuItemPurchaseForm
              item={item}
              currencyCode={currencyCode}
              locale={locale}
              orderType={orderType}
              onAdded={() => {
                onAdded?.()
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

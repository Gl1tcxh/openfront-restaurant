"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { MenuItem } from "@/features/storefront/lib/store-data"
import { formatCurrency } from "@/features/storefront/lib/currency"
import {
  getMenuItemDescriptionText,
  getMenuItemHref,
  getMenuItemImageUrl,
} from "@/features/storefront/lib/menu-item-utils"

interface MenuItemCardProps {
  item: MenuItem
  onQuickView: (item: MenuItem) => void
  currencyCode?: string
  locale?: string
}

export function MenuItemCard({ item, onQuickView, currencyCode = "USD", locale = "en-US" }: MenuItemCardProps) {
  const badgeLabel = item.featured ? "Featured" : item.popular ? "Popular" : null

  return (
    <article className="group flex h-full flex-col rounded-2xl bg-card p-3 ring-1 ring-border shadow-md shadow-foreground/5 transition-all duration-200 hover:-translate-y-0.5">
      <Link href={getMenuItemHref(item.id)} className="block">
        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          <Image
            src={getMenuItemImageUrl(item)}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {badgeLabel && (
            <span className="absolute right-3 top-3 rounded-full border bg-background/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground">
              {badgeLabel}
            </span>
          )}
        </div>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[1.8rem] leading-none tracking-tight text-foreground transition-colors group-hover:text-primary">
              {item.name}
            </h3>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {getMenuItemDescriptionText(item.description)}
            </p>
          </div>
          <span className="shrink-0 pt-0.5 text-xl font-semibold tracking-tight text-foreground">
            {formatCurrency(item.price, { currencyCode, locale })}
          </span>
        </div>
      </Link>

      <div className="mt-5 flex items-center gap-2">
        <Button
          type="button"
          className="h-11 flex-[1.3] rounded-xl px-4 text-sm font-semibold"
          onClick={() => onQuickView(item)}
        >
          Quick View
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 flex-1 rounded-xl px-4 text-sm font-semibold"
        >
          <Link href={getMenuItemHref(item.id)}>
            Details
          </Link>
        </Button>
      </div>
    </article>
  )
}

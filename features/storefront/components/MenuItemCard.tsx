"use client"

import Image from "next/image"
import Link from "next/link"
import { Plus } from "lucide-react"
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
  const description = getMenuItemDescriptionText(item.description)

  return (
    <article className="group relative flex flex-col sm:flex-row rounded-2xl bg-card border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 hover:border-border">
      {/* Image — links to detail page */}
      <Link href={getMenuItemHref(item.id)} className="relative sm:w-44 sm:min-h-[160px] aspect-[16/10] sm:aspect-auto overflow-hidden bg-muted shrink-0">
        <Image
          src={getMenuItemImageUrl(item)}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {badgeLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-warm-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]">
            {badgeLabel}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <Link href={getMenuItemHref(item.id)} className="hover:text-warm-700 transition-colors">
              <h3 className="font-serif font-semibold text-xl leading-tight tracking-tight text-foreground group-hover:text-warm-700 transition-colors">
                {item.name}
              </h3>
            </Link>
            <span className="shrink-0 text-lg font-semibold text-foreground tabular-nums">
              {formatCurrency(item.price, { currencyCode, locale })}
            </span>
          </div>
          {description && (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            {item.calories > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                {item.calories} cal
              </span>
            )}
            {item.dietaryFlags?.slice(0, 2).map((flag: string) => (
              <span key={flag} className="text-[11px] font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                {flag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <button
            onClick={() => onQuickView(item)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-warm-700 hover:text-warm-900 transition-colors bg-warm-100 hover:bg-warm-200 rounded-full px-3 py-1.5"
          >
            <Plus className="h-3 w-3" />
            Add to order
          </button>
        </div>
      </div>
    </article>
  )
}

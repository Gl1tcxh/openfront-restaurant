import Image from "next/image"
import Link from "next/link"
import type { MenuItem } from "@/features/storefront/lib/store-data"
import { formatCurrency } from "@/features/storefront/lib/currency"
import {
  getMenuItemDescriptionText,
  getMenuItemHref,
  getMenuItemImageUrl,
} from "@/features/storefront/lib/menu-item-utils"

interface MenuItemCardProps {
  item: MenuItem
  currencyCode?: string
  locale?: string
}

export function MenuItemCard({ item, currencyCode = "USD", locale = "en-US" }: MenuItemCardProps) {
  const badgeLabel = item.featured ? "Featured" : item.popular ? "Popular" : null
  const description = getMenuItemDescriptionText(item.description)
  const ctaLabel = item.modifiers?.length ? "Customize" : "View Item"

  return (
    <Link
      href={getMenuItemHref(item.id)}
      prefetch={false}
      className="group block"
    >
      <article className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-foreground/5 sm:flex-row">
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted sm:min-h-[160px] sm:w-44 sm:aspect-auto">
          <Image
            src={getMenuItemImageUrl(item)}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {badgeLabel ? (
            <span className="absolute left-3 top-3 rounded-full bg-warm-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <h3 className="font-serif font-semibold text-xl leading-tight tracking-tight text-foreground group-hover:text-warm-700 transition-colors">
                {item.name}
              </h3>
              <span className="shrink-0 text-lg font-semibold text-foreground tabular-nums">
                {formatCurrency(item.price, { currencyCode, locale })}
              </span>
            </div>
            {description ? (
              <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
            <div className="flex items-center gap-2">
              {(item.calories ?? 0) > 0 ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {item.calories} cal
                </span>
              ) : null}
              {item.dietaryFlags?.slice(0, 2).map((flag: string) => (
                <span
                  key={flag}
                  className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warm-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-warm-700 transition-colors group-hover:bg-warm-200 group-hover:text-warm-900">
              {ctaLabel}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

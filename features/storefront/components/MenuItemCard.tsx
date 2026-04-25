import Image from "next/image"
import Link from "next/link"
import type { MenuItem } from "@/features/storefront/lib/store-data"
import { formatCurrency } from "@/features/storefront/lib/currency"
import {
  getMenuItemDescriptionText,
  getMenuItemHref,
} from "@/features/storefront/lib/menu-item-utils"

type MenuItemCardProps = {
  item: MenuItem
  currencyCode?: string
  locale?: string
  variant?: "default" | "feature"
  showCategory?: boolean
}

function ItemImage({ item, priority = false, compact = false }: { item: MenuItem; priority?: boolean; compact?: boolean }) {
  const thumbnail = item.thumbnail || null

  if (!thumbnail) {
    return (
      <div className={`flex w-full items-center justify-center bg-muted p-6 text-center ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
        <div>
          <p className="font-serif text-2xl font-semibold text-foreground">{item.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">Prepared fresh to order</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full overflow-hidden bg-muted ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
      <Image
        src={thumbnail}
        alt={item.name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
      />
    </div>
  )
}

function ItemMeta({ item }: { item: MenuItem }) {
  const categoryName = typeof item.category === "object" ? item.category?.name : null

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {categoryName ? <span>{categoryName}</span> : null}
      {item.calories ? <span>· {item.calories} cal</span> : null}
      {item.modifiers?.length ? <span>· Customizable</span> : null}
    </div>
  )
}

export function MenuItemCard({
  item,
  currencyCode = "USD",
  locale = "en-US",
  variant = "default",
  showCategory = false,
}: MenuItemCardProps) {
  const description = getMenuItemDescriptionText(item.description)
  const badgeLabel = item.featured ? "Featured" : item.popular ? "Popular" : null
  const ctaLabel = item.modifiers?.length ? "Customize" : "View item"
  const categoryName = typeof item.category === "object" ? item.category?.name : null

  if (variant === "feature") {
    return (
      <Link href={getMenuItemHref(item.id)} prefetch={false} className="group block h-full">
        <article className="storefront-surface flex h-full flex-col overflow-hidden bg-card transition-colors hover:border-primary/35">
          <ItemImage item={item} priority={true} />

          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                {categoryName ? <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">{categoryName}</p> : null}
                <h3 className="font-serif text-xl font-semibold text-foreground">{item.name}</h3>
              </div>
              <span className="text-base font-medium tabular-nums text-foreground">
                {formatCurrency(item.price, { currencyCode, locale })}
              </span>
            </div>

            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
              {description || "Prepared fresh and available for the full ordering flow."}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {item.calories ? <span>{item.calories} cal</span> : null}
                {item.dietaryFlags?.slice(0, 2).map((flag) => (
                  <span key={flag}>{flag.replace(/_/g, " ")}</span>
                ))}
              </div>
              <span className="text-sm font-medium text-primary">{ctaLabel}</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={getMenuItemHref(item.id)} prefetch={false} className="group block h-full">
      <article className="storefront-surface flex h-full overflow-hidden bg-card transition-colors hover:border-primary/35">
        <div className="relative w-28 shrink-0 sm:w-32">
          <ItemImage item={item} compact={true} />
          {badgeLabel ? (
            <span className="absolute left-2 top-2 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="space-y-1.5">
            {showCategory && categoryName ? <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">{categoryName}</p> : null}
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 font-medium leading-6 text-foreground">{item.name}</h3>
              <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                {formatCurrency(item.price, { currencyCode, locale })}
              </span>
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {description || "Prepared fresh and ready to customize."}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
            <ItemMeta item={item} />
            <span className="shrink-0 text-sm font-medium text-primary">{ctaLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export function FeatureMenuItemCard(props: Omit<MenuItemCardProps, "variant">) {
  return <MenuItemCard {...props} variant="feature" />
}

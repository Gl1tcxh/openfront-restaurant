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

function ItemImage({ item, priority = false }: { item: MenuItem; priority?: boolean }) {
  const thumbnail = item.thumbnail || null

  if (!thumbnail) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted p-6 text-center">
        <div>
          <p className="font-serif text-2xl font-semibold text-foreground">{item.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">Prepared fresh to order</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
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

          <div className="flex flex-1 flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                {categoryName ? <p className="text-sm font-medium text-primary">{categoryName}</p> : null}
                <h3 className="font-serif text-2xl font-semibold text-foreground">{item.name}</h3>
              </div>
              <span className="text-lg font-medium tabular-nums text-foreground">
                {formatCurrency(item.price, { currencyCode, locale })}
              </span>
            </div>

            <p className="text-pretty text-base leading-7 text-muted-foreground">
              {description || "Prepared fresh and available for the full ordering flow."}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
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
      <article className="storefront-surface flex h-full flex-col overflow-hidden bg-card transition-colors hover:border-primary/35">
        <div className="relative">
          <ItemImage item={item} />
          {badgeLabel ? (
            <span className="absolute left-4 top-4 border border-border bg-background px-3 py-1 text-xs font-medium text-primary">
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            {showCategory && categoryName ? <p className="text-sm font-medium text-primary">{categoryName}</p> : null}
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-2xl font-semibold text-foreground">{item.name}</h3>
              <span className="text-base font-medium tabular-nums text-foreground">
                {formatCurrency(item.price, { currencyCode, locale })}
              </span>
            </div>
            <p className="line-clamp-3 text-pretty text-base leading-7 text-muted-foreground">
              {description || "Prepared fresh and ready to customize."}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-4">
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

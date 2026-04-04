import { FeatureMenuItemCard, MenuItemCard } from "./MenuItemCard"
import type { MenuItem } from "@/features/storefront/lib/store-data"

interface MenuSectionProps {
  sectionId: string
  title: string
  description?: string
  items: MenuItem[]
  currencyCode?: string
  locale?: string
  className?: string
}

function MenuSectionComponent({
  sectionId,
  title,
  description,
  items,
  currencyCode = "USD",
  locale = "en-US",
  className,
}: MenuSectionProps) {
  if (items.length === 0) return null

  return (
    <section id={sectionId} className={className || "scroll-mt-32"}>
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="storefront-heading">{title}</h2>
          {description ? <p className="storefront-copy mt-3">{description}</p> : null}
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            currencyCode={currencyCode}
            locale={locale}
            showCategory={false}
          />
        ))}
      </div>
    </section>
  )
}

export const MenuSection = Object.assign(MenuSectionComponent, {
  Card: MenuItemCard,
  FeatureCard: FeatureMenuItemCard,
})

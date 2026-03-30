import { MenuItemCard } from "./MenuItemCard"
import type { MenuItem } from "@/features/storefront/lib/store-data"

interface MenuSectionProps {
  sectionId: string
  title: string
  items: MenuItem[]
  currencyCode?: string
  locale?: string
  className?: string
}

export function MenuSection({
  sectionId,
  title,
  items,
  currencyCode = "USD",
  locale = "en-US",
  className,
}: MenuSectionProps) {
  if (items.length === 0) return null

  return (
    <section id={sectionId} className={className || "scroll-mt-44"}>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-serif font-bold text-3xl md:text-4xl tracking-tight text-foreground">{title}</h2>
          <div className="mt-2 h-0.5 w-12 bg-warm-500 rounded-full" />
        </div>
        <span className="text-[13px] font-medium text-muted-foreground">{items.length} items</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            currencyCode={currencyCode}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}

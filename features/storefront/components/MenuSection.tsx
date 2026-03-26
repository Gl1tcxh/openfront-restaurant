"use client"

import { forwardRef } from "react"
import { MenuItemCard } from "./MenuItemCard"
import type { MenuItem } from "@/features/storefront/lib/store-data"

interface MenuSectionProps {
  title: string
  items: MenuItem[]
  onQuickView: (item: MenuItem) => void
  currencyCode?: string
  locale?: string
}

export const MenuSection = forwardRef<HTMLDivElement, MenuSectionProps>(({ title, items, onQuickView, currencyCode = "USD", locale = "en-US" }, ref) => {
  if (items.length === 0) return null

  return (
    <section ref={ref} className="scroll-mt-44">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-4">
        <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
        <span className="text-sm text-muted-foreground">{items.length} items</span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onQuickView={onQuickView}
            currencyCode={currencyCode}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
})

MenuSection.displayName = "MenuSection"

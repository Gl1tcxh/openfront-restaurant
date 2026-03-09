"use client"

import { forwardRef } from "react"
import { MenuItemCard } from "./MenuItemCard"
import type { MenuItem } from "@/features/storefront/lib/store-data"

interface MenuSectionProps {
  title: string
  items: MenuItem[]
  onItemSelect: (item: MenuItem) => void
  currencyCode?: string
  locale?: string
}

export const MenuSection = forwardRef<HTMLDivElement, MenuSectionProps>(({ title, items, onItemSelect, currencyCode = "USD", locale = "en-US" }, ref) => {
  if (items.length === 0) return null

  return (
    <section ref={ref} className="scroll-mt-44">
      <div className="flex items-baseline justify-between mb-8 border-b border-border pb-4">
        <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
        <span className="text-sm text-muted-foreground">{items.length} items</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onSelect={onItemSelect}
            currencyCode={currencyCode}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
})

MenuSection.displayName = "MenuSection"

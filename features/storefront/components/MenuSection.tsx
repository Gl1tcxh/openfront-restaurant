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

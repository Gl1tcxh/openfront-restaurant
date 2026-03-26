"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import { type MenuCategory } from "@/features/storefront/lib/store-data"

interface CategoryNavProps {
  categories: MenuCategory[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6">
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-200",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

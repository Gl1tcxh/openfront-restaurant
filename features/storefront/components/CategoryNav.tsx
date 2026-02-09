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
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-6">
        <div ref={scrollRef} className="flex gap-8 overflow-x-auto scrollbar-hide py-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "whitespace-nowrap text-sm tracking-wide uppercase transition-all pb-1 border-b-2",
                activeCategory === category.id
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground",
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

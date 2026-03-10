"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import type { MenuItem } from "@/features/storefront/lib/store-data"
import { formatCurrency } from "@/features/storefront/lib/currency"

interface MenuItemCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  currencyCode?: string
  locale?: string
}

// Helper to get image URL
function getImageUrl(item: MenuItem): string {
  const firstImage = item.menuItemImages?.[0]
  if (firstImage?.image?.url) return firstImage.image.url
  if (firstImage?.imagePath) return firstImage.imagePath
  return '/placeholder.jpg'
}

// Helper to get description text
function getDescriptionText(description: any): string {
  if (typeof description === 'string') return description
  if (typeof description === 'object' && description?.document) {
    const extractText = (node: any): string => {
      if (!node) return ''
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(extractText).join(' ')
      if (node.children) return extractText(node.children)
      if (node.text) return node.text
      if (node.leaves) return node.leaves.map(extractText).join(' ')
      return ''
    }
    return extractText(description.document)
  }
  return ''
}

export function MenuItemCard({ item, onSelect, currencyCode = "USD", locale = "en-US" }: MenuItemCardProps) {
  return (
    <article className="group cursor-pointer" onClick={() => onSelect(item)}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden mb-4 bg-muted rounded-xl ring-1 ring-inset ring-foreground/10">
        <Image
          src={getImageUrl(item)}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.popular && (
          <span className="absolute top-3 left-3 text-xs tracking-widest uppercase bg-background/90 backdrop-blur-sm px-3 py-1">
            Popular
          </span>
        )}
        <button
          className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-background text-foreground shadow-md ring-1 ring-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(item)
          }}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-lg group-hover:text-primary transition-colors">{item.name}</h3>
          <span className="text-sm font-medium shrink-0">{formatCurrency(item.price, { currencyCode, locale })}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{getDescriptionText(item.description)}</p>
        {item.calories && <p className="text-xs text-muted-foreground">{item.calories} cal</p>}
      </div>
    </article>
  )
}

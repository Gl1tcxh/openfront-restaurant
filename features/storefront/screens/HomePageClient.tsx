"use client"

import { useState, useRef, useEffect } from "react"
import { CartProvider } from "@/features/storefront/lib/cart-context"
import { StoreHeader } from "@/features/storefront/components/StoreHeader"
import { CategoryNav } from "@/features/storefront/components/CategoryNav"
import { HeroBanner } from "@/features/storefront/components/HeroBanner"
import { StoreInfoBar } from "@/features/storefront/components/StoreInfoBar"
import { MenuSection } from "@/features/storefront/components/MenuSection"
import { ItemCustomizationModal } from "@/features/storefront/components/ItemCustomizationModal"
import { CartSidebar } from "@/features/storefront/components/CartSidebar"
import { CheckoutModal } from "@/features/storefront/components/CheckoutModal"
import { type MenuItem, type MenuCategory, type StoreInfo } from "@/features/storefront/lib/store-data"
import Image from "next/image"

interface HomePageClientProps {
  categories: MenuCategory[]
  menuItems: MenuItem[]
  featuredItems: MenuItem[]
  storeInfo: StoreInfo
}

function StorefrontContent({ categories, menuItems, featuredItems, storeInfo }: HomePageClientProps) {
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Group menu items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const categoryId = typeof item.category === 'object' && item.category?.id
      ? item.category.id
      : typeof item.category === 'string'
      ? item.category
      : "uncategorized"
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    const section = sectionRefs.current[categoryId]
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleItemSelect = (item: MenuItem) => {
    setSelectedItem(item)
  }

  const handleCheckout = () => {
    setIsCheckoutOpen(true)
  }

  // Intersection observer for scroll-based category highlighting
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    categories.forEach((category) => {
      const section = sectionRefs.current[category.id]
      if (section) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveCategory(category.id)
              }
            })
          },
          { rootMargin: "-200px 0px -50% 0px", threshold: 0 }
        )
        observer.observe(section)
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [categories])

  // Helper to get display text from description
  const getDescriptionText = (description: any): string => {
    if (typeof description === 'string') return description
    if (typeof description === 'object' && description?.document) {
      // Extract text from structured document
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

  // Helper to get image URL
  const getImageUrl = (image: any): string => {
    if (typeof image === 'string') return image
    if (image?.url) return image.url
    return '/placeholder.jpg'
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader orderType={orderType} setOrderType={setOrderType} storeInfo={storeInfo} />
      <HeroBanner onOrderNow={() => handleCategoryChange(categories[1]?.id || "all")} storeInfo={storeInfo} />
      <StoreInfoBar storeInfo={storeInfo} />
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <main className="container mx-auto px-6 py-12">
        <div className="space-y-16">
          {/* Featured Section */}
          {featuredItems.length > 0 && (
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["featured"] = el }}
              className="scroll-mt-44"
            >
              <div className="flex items-baseline justify-between mb-8 border-b border-border pb-4">
                <h2 className="font-serif text-3xl md:text-4xl">Featured</h2>
                <span className="text-sm text-muted-foreground">{featuredItems.length} items</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredItems.map((item) => (
                  <article
                    key={item.id}
                    className="group relative cursor-pointer overflow-hidden bg-muted"
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="aspect-[16/10] relative">
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                        <span className="text-xs tracking-widest uppercase opacity-80 mb-2 block">Featured</span>
                        <h3 className="font-serif text-2xl md:text-3xl mb-2">{item.name}</h3>
                        <p className="text-sm opacity-80 line-clamp-2 max-w-md">
                          {getDescriptionText(item.description)}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <span className="text-lg">${Number(item.price).toFixed(2)}</span>
                          {item.calories && <span className="text-sm opacity-70">{item.calories} cal</span>}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Category Sections */}
          {categories.map((category) => {
            if (category.id === "all") return null
            const categoryItems = itemsByCategory[category.id] || []

            if (categoryItems.length === 0) return null

            return (
              <MenuSection
                key={category.id}
                ref={(el) => { sectionRefs.current[category.id] = el }}
                title={category.name}
                icon={category.icon || '🍽️'}
                items={categoryItems}
                onItemSelect={handleItemSelect}
              />
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-serif text-2xl mb-4">{storeInfo.name}</h3>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                {storeInfo.heroSubheadline || storeInfo.tagline}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wide mb-4">Hours</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Mon-Thu: {storeInfo.hours?.monday || '11 AM - 10 PM'}</p>
                <p>Fri-Sat: {storeInfo.hours?.friday || '11 AM - 11 PM'}</p>
                <p>Sunday: {storeInfo.hours?.sunday || '10 AM - 9 PM'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wide mb-4">Contact</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{storeInfo.address}</p>
                <p>{storeInfo.phone}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {storeInfo.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals and Sidebars */}
      <ItemCustomizationModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />
      <CartSidebar orderType={orderType} onCheckout={handleCheckout} storeInfo={storeInfo} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} orderType={orderType} storeInfo={storeInfo} />
    </div>
  )
}

export default function HomePageClient(props: HomePageClientProps) {
  return (
    <CartProvider>
      <StorefrontContent {...props} />
    </CartProvider>
  )
}

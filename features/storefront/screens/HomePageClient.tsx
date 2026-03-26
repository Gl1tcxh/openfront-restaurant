"use client"

import { useState, useRef, useEffect } from "react"
import { CategoryNav } from "@/features/storefront/components/CategoryNav"
import { HeroBanner } from "@/features/storefront/components/HeroBanner"
import { StoreInfoBar } from "@/features/storefront/components/StoreInfoBar"
import { MenuItemCard } from "@/features/storefront/components/MenuItemCard"
import { MenuSection } from "@/features/storefront/components/MenuSection"
import { ItemCustomizationModal } from "@/features/storefront/components/ItemCustomizationModal"
import { type MenuItem, type MenuCategory, type StoreInfo } from "@/features/storefront/lib/store-data"

interface HomePageClientProps {
  categories: MenuCategory[]
  menuItems: MenuItem[]
  featuredItems: MenuItem[]
  storeInfo: StoreInfo
}

function StorefrontContent({ categories, menuItems, featuredItems, storeInfo }: HomePageClientProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
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

  const handleQuickView = (item: MenuItem) => {
    setSelectedItem(item)
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

  return (
    <div className="flex flex-col">
      <div className="sticky top-[65px] z-40 bg-background border-b border-border">
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>
      <HeroBanner onOrderNow={() => handleCategoryChange(categories[1]?.id || "all")} storeInfo={storeInfo} />
      <StoreInfoBar storeInfo={storeInfo} />

      <main className="container mx-auto px-6 py-12">
        <div className="space-y-16">
          {/* Featured Section */}
          {featuredItems.length > 0 && (
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["featured"] = el }}
              className="scroll-mt-44"
            >
              <div className="mb-6 flex items-baseline justify-between border-b border-border pb-4">
                <h2 className="font-serif text-3xl md:text-4xl">Featured</h2>
                <span className="text-sm text-muted-foreground">{featuredItems.length} items</span>
              </div>
              <div className="grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
                {featuredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onQuickView={handleQuickView}
                    currencyCode={storeInfo.currencyCode}
                    locale={storeInfo.locale}
                  />
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
                items={categoryItems}
                onQuickView={handleQuickView}
                currencyCode={storeInfo.currencyCode}
                locale={storeInfo.locale}
              />
            )
          })}
        </div>
      </main>

      {/* Modals and Sidebars */}
      <ItemCustomizationModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        currencyCode={storeInfo.currencyCode}
        locale={storeInfo.locale}
      />
    </div>
  )
}

export default function HomePageClient(props: HomePageClientProps) {
  return <StorefrontContent {...props} />
}

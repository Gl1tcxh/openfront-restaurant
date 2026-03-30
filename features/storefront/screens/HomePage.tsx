import { Metadata } from "next"
import { getMenuCategories, getMenuItems, getStoreSettings } from "@/features/storefront/lib/data/menu"
import { type MenuCategory, type MenuItem, type StoreInfo } from "@/features/storefront/lib/store-data"
import { getCurrencyConfig } from "@/features/storefront/lib/currency"
import { HeroBanner } from "@/features/storefront/components/HeroBanner"
import { StoreInfoBar } from "@/features/storefront/components/StoreInfoBar"
import { CategoryNav } from "@/features/storefront/components/CategoryNav"
import { MenuItemCard } from "@/features/storefront/components/MenuItemCard"
import { MenuSection } from "@/features/storefront/components/MenuSection"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings()

  return {
    title: storeSettings?.name ? `${storeSettings.name} - ${storeSettings.tagline || ''}` : "Restaurant",
    description: storeSettings?.heroSubheadline || storeSettings?.tagline || "",
  }
}

export default async function HomePage() {
  const [categories, allItems, storeSettings] = await Promise.all([
    getMenuCategories(),
    getMenuItems(),
    getStoreSettings(),
  ])

  const featuredItems = allItems.filter((item: MenuItem) => item.featured).slice(0, 8)

  if (!storeSettings) {
    return null
  }

  const currencyConfig = getCurrencyConfig(storeSettings)

  const storeInfo: StoreInfo = {
    name: storeSettings.name,
    tagline: storeSettings.tagline || '',
    address: storeSettings.address || '',
    phone: storeSettings.phone || '',
    currencyCode: currencyConfig.currencyCode,
    locale: currencyConfig.locale,
    timezone: storeSettings.timezone || 'America/New_York',
    countryCode: storeSettings.countryCode || 'US',
    deliveryEnabled: storeSettings.deliveryEnabled ?? true,
    deliveryPostalCodes: Array.isArray(storeSettings.deliveryPostalCodes) ? storeSettings.deliveryPostalCodes : [],
    hours: storeSettings.hours || {},
    deliveryFee: parseFloat(storeSettings.deliveryFee) || 0,
    deliveryMinimum: parseFloat(storeSettings.deliveryMinimum) || 0,
    pickupDiscount: storeSettings.pickupDiscount ?? 0,
    taxRate: parseFloat(storeSettings.taxRate || "8.75") || 8.75,
    estimatedDelivery: storeSettings.estimatedDelivery || '',
    estimatedPickup: storeSettings.estimatedPickup || '',
    heroHeadline: storeSettings.heroHeadline,
    heroSubheadline: storeSettings.heroSubheadline,
    heroTagline: storeSettings.heroTagline,
    promoBanner: storeSettings.promoBanner,
    rating: parseFloat(storeSettings.rating) || undefined,
    reviewCount: storeSettings.reviewCount || undefined,
  }

  const featuredSectionId = "featured"
  const categorySections: Array<{
    category: MenuCategory
    items: MenuItem[]
    sectionId: string
  }> = categories
    .map((category: MenuCategory) => {
      const items = allItems.filter((item: MenuItem) => {
        const categoryId =
          typeof item.category === "object" && item.category?.id
            ? item.category.id
            : typeof item.category === "string"
              ? item.category
              : item.categoryId

        return categoryId === category.id && !item.featured
      })

      return {
        category,
        items,
        sectionId: `category-${category.id}`,
      }
    })
    .filter((section: { items: MenuItem[] }) => section.items.length > 0)

  const navItems: Array<{ href: string; label: string }> = []

  if (featuredItems.length > 0) {
    navItems.push({ href: `#${featuredSectionId}`, label: "Featured" })
  }

  categorySections.forEach(({ category, sectionId }: { category: MenuCategory; sectionId: string }) => {
    navItems.push({ href: `#${sectionId}`, label: category.name })
  })

  const menuHref = navItems[0]?.href || "#menu"
  const navOffset = storeSettings.promoBanner ? "top-[108px]" : "top-[72px]"
  const sectionScrollMt = storeSettings.promoBanner ? "scroll-mt-[180px]" : "scroll-mt-[140px]"

  return (
    <div className="flex flex-col scroll-smooth" id="menu">
      <HeroBanner menuHref={menuHref} storeInfo={storeInfo} />
      <StoreInfoBar storeInfo={storeInfo} />

      {navItems.length > 0 ? (
        <div className={cn("sticky z-40", navOffset)}>
          <CategoryNav items={navItems} />
        </div>
      ) : null}

      <main className="container mx-auto px-6 py-12 md:py-16">
        <div className="space-y-16 md:space-y-20">
          {featuredItems.length > 0 ? (
            <section id={featuredSectionId} className={sectionScrollMt}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-warm-100 px-3 py-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-warm-700">
                      Chef&apos;s Selection
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                    Featured
                  </h2>
                  <div className="mt-2 h-0.5 w-12 rounded-full bg-warm-500" />
                </div>
                <span className="text-[13px] font-medium text-muted-foreground">
                  {featuredItems.length} items
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {featuredItems.map((item: MenuItem) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    currencyCode={storeInfo.currencyCode}
                    locale={storeInfo.locale}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {categorySections.map(({ category, items, sectionId }: {
            category: MenuCategory
            items: MenuItem[]
            sectionId: string
          }) => (
            <MenuSection
              key={category.id}
              sectionId={sectionId}
              title={category.name}
              items={items}
              currencyCode={storeInfo.currencyCode}
              locale={storeInfo.locale}
              className={sectionScrollMt}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

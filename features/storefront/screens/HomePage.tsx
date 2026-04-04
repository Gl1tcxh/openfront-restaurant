import Image from "next/image"
import { Metadata } from "next"
import { Clock3, MapPin, Percent, Star, Truck } from "lucide-react"
import {
  getMenuCategories,
  getMenuItems,
  getStoreSettings,
} from "@/features/storefront/lib/data/menu"
import {
  type MenuCategory,
  type MenuItem,
  type StoreInfo,
} from "@/features/storefront/lib/store-data"
import { getCurrencyConfig, formatCurrency } from "@/features/storefront/lib/currency"
import { HeroBanner } from "@/features/storefront/components/HeroBanner"
import { StoreInfoBar } from "@/features/storefront/components/StoreInfoBar"
import { CategoryNav } from "@/features/storefront/components/CategoryNav"
import { MenuSection } from "@/features/storefront/components/MenuSection"
import { getMenuItemDescriptionText } from "@/features/storefront/lib/menu-item-utils"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings()

  return {
    title: storeSettings?.name
      ? `${storeSettings.name} - ${storeSettings.tagline || ""}`
      : "Restaurant",
    description: storeSettings?.heroSubheadline || storeSettings?.tagline || "",
  }
}

export default async function HomePage() {
  const [categories, allItems, storeSettings] = await Promise.all([
    getMenuCategories(),
    getMenuItems(),
    getStoreSettings(),
  ])

  if (!storeSettings) {
    return null
  }

  const featuredItems = allItems.filter((item: MenuItem) => item.featured).slice(0, 6)
  const popularItems = allItems.filter((item: MenuItem) => item.popular).slice(0, 4)

  const heroCandidates = Array.from(
    new Map(
      [...featuredItems, ...popularItems, ...allItems.slice(0, 6)].map((item) => [item.id, item])
    ).values()
  ).slice(0, 6)

  const currencyConfig = getCurrencyConfig(storeSettings)

  const storeInfo: StoreInfo = {
    name: storeSettings.name,
    tagline: storeSettings.tagline || "",
    address: storeSettings.address || "",
    phone: storeSettings.phone || "",
    currencyCode: currencyConfig.currencyCode,
    locale: currencyConfig.locale,
    timezone: storeSettings.timezone || "America/New_York",
    countryCode: storeSettings.countryCode || "US",
    deliveryEnabled: storeSettings.deliveryEnabled ?? true,
    deliveryPostalCodes: Array.isArray(storeSettings.deliveryPostalCodes)
      ? storeSettings.deliveryPostalCodes
      : [],
    hours: storeSettings.hours || {},
    deliveryFee: parseFloat(storeSettings.deliveryFee) || 0,
    deliveryMinimum: parseFloat(storeSettings.deliveryMinimum) || 0,
    pickupDiscount: storeSettings.pickupDiscount ?? 0,
    taxRate: parseFloat(storeSettings.taxRate || "8.75") || 8.75,
    estimatedDelivery: storeSettings.estimatedDelivery || "",
    estimatedPickup: storeSettings.estimatedPickup || "",
    heroHeadline: storeSettings.heroHeadline,
    heroSubheadline: storeSettings.heroSubheadline,
    heroTagline: storeSettings.heroTagline,
    promoBanner: storeSettings.promoBanner,
    rating: parseFloat(storeSettings.rating) || undefined,
    reviewCount: storeSettings.reviewCount || undefined,
  }

  const popularSectionId = "popular-dishes"
  const featuredSectionId = "house-picks"

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

  if (popularItems.length > 0) {
    navItems.push({ href: `#${popularSectionId}`, label: "Popular" })
  }

  if (featuredItems.length > 0) {
    navItems.push({ href: `#${featuredSectionId}`, label: "House picks" })
  }

  categorySections.forEach(({ category, sectionId }: { category: MenuCategory; sectionId: string }) => {
    navItems.push({ href: `#${sectionId}`, label: category.name })
  })

  const menuHref = categorySections[0]?.sectionId
    ? `#${categorySections[0].sectionId}`
    : navItems[0]?.href || "#menu"
  const navOffset = storeSettings.promoBanner ? "top-[96px]" : "top-16"
  const sectionScrollMt = storeSettings.promoBanner ? "scroll-mt-44" : "scroll-mt-32"

  const showcaseItems = featuredItems.length > 0 ? featuredItems.slice(0, 3) : allItems.slice(0, 3)
  const leftShowcase = showcaseItems[0]
  const rightShowcase = showcaseItems[1]
  const lowerShowcase = showcaseItems[2]

  return (
    <div className="flex flex-col" id="menu">
      <HeroBanner
        menuHref={menuHref}
        storeInfo={storeInfo}
        heroItems={heroCandidates.map((item) => ({
          id: item.id,
          name: item.name,
          description: getMenuItemDescriptionText(item.description),
          imagePath: item.thumbnail || null,
          price: item.price,
          categoryName:
            typeof item.category === "object" && item.category?.name ? item.category.name : undefined,
        }))}
      />

      <StoreInfoBar storeInfo={storeInfo} />

      {navItems.length > 0 ? (
        <div className={cn("sticky z-40", navOffset)}>
          <CategoryNav items={navItems} />
        </div>
      ) : null}

      <main className="flex flex-col">
        {popularItems.length > 0 ? (
          <section id={popularSectionId} className={cn("py-8 sm:py-16 lg:py-24", sectionScrollMt)}>
            <div className="storefront-shell">
              <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center justify-center space-y-4 text-center sm:mb-16">
                <h2 className="storefront-heading">Favorites from today&apos;s menu</h2>
                <p className="storefront-copy max-w-2xl text-center">
                  The dishes guests come back for most often, each prepared with the same ingredients and pricing available in the live menu below.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {popularItems.map((item: MenuItem) => (
                  <MenuSection.Card
                    key={item.id}
                    item={item}
                    currencyCode={storeInfo.currencyCode}
                    locale={storeInfo.locale}
                    showCategory={true}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="relative py-8 before:absolute before:inset-0 before:-z-10 before:skew-y-3 before:bg-muted sm:py-16 lg:py-24">
          <div className="storefront-shell">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
              <div className="space-y-5">
                <span className="storefront-kicker">Order your way</span>
                <h2 className="storefront-heading">
                  Pickup, delivery, and the full menu in one storefront.
                </h2>
                <p className="storefront-copy max-w-2xl">
                  Browse the live menu, customize every item, and check out using the same ordering flow customers use every day.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {storeInfo.rating ? (
                    <div className="storefront-surface bg-background p-5">
                      <div className="flex items-center gap-2 text-primary">
                        <Star className="size-4 fill-primary" />
                        <span className="text-sm font-medium text-foreground">Customer rating</span>
                      </div>
                      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
                        {storeInfo.rating}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {storeInfo.reviewCount
                          ? `${storeInfo.reviewCount.toLocaleString()} verified reviews`
                          : "Loved by regulars"}
                      </p>
                    </div>
                  ) : null}

                  {storeInfo.pickupDiscount ? (
                    <div className="storefront-surface bg-background p-5">
                      <div className="flex items-center gap-2 text-primary">
                        <Percent className="size-4" />
                        <span className="text-sm font-medium text-foreground">Pickup savings</span>
                      </div>
                      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
                        {storeInfo.pickupDiscount}%
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Applied to pickup orders</p>
                    </div>
                  ) : null}

                  {storeInfo.estimatedPickup ? (
                    <div className="storefront-surface bg-background p-5">
                      <div className="flex items-center gap-2 text-primary">
                        <Clock3 className="size-4" />
                        <span className="text-sm font-medium text-foreground">Pickup time</span>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-foreground">{storeInfo.estimatedPickup}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Prepared to order</p>
                    </div>
                  ) : null}

                  {storeInfo.deliveryEnabled ? (
                    <div className="storefront-surface bg-background p-5">
                      <div className="flex items-center gap-2 text-primary">
                        <Truck className="size-4" />
                        <span className="text-sm font-medium text-foreground">Delivery</span>
                      </div>
                      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
                        {formatCurrency(storeInfo.deliveryFee, currencyConfig, { inputIsCents: false })}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Minimum {formatCurrency(storeInfo.deliveryMinimum, currencyConfig, { inputIsCents: false })}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 sm:grid-rows-2">
                {leftShowcase ? (
                  <div className="storefront-surface relative row-span-2 min-h-[420px] overflow-hidden bg-background p-4">
                    {leftShowcase.thumbnail ? (
                      <Image
                        src={leftShowcase.thumbnail}
                        alt={leftShowcase.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 28vw"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center p-6 text-center">
                        <p className="font-serif text-2xl font-semibold">{leftShowcase.name}</p>
                      </div>
                    )}
                    <div className="absolute inset-x-4 bottom-4 border border-border/80 bg-background/90 p-4 backdrop-blur">
                      <p className="text-sm font-medium text-primary">{leftShowcase.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getMenuItemDescriptionText(leftShowcase.description)}
                      </p>
                    </div>
                  </div>
                ) : null}

                {rightShowcase ? (
                  <div className="storefront-surface relative min-h-[200px] overflow-hidden bg-background p-4">
                    {rightShowcase.thumbnail ? (
                      <Image
                        src={rightShowcase.thumbnail}
                        alt={rightShowcase.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 20vw"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center p-6 text-center">
                        <p className="font-serif text-xl font-semibold">{rightShowcase.name}</p>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="storefront-surface flex flex-col justify-between bg-background p-6">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin className="size-4" />
                      <p className="text-sm font-medium text-foreground">Visit the restaurant</p>
                    </div>
                    <p className="mt-3 text-pretty text-base leading-7 text-muted-foreground">
                      {storeInfo.address || `${storeInfo.name} is open for pickup and delivery.`}
                    </p>
                  </div>
                  {lowerShowcase ? (
                    <div className="mt-6 border-t border-border pt-4">
                      <p className="text-sm font-medium text-foreground">Next up</p>
                      <p className="mt-1 text-sm text-muted-foreground">{lowerShowcase.name}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {featuredItems.length > 0 ? (
          <section id={featuredSectionId} className={cn("py-8 sm:py-16 lg:py-24", sectionScrollMt)}>
            <div className="storefront-shell">
              <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center justify-center space-y-4 text-center sm:mb-16">
                <h2 className="storefront-heading">Featured dishes from the kitchen</h2>
                <p className="storefront-copy max-w-2xl text-center">
                  A curated selection from the live menu, with full customization and checkout available on every item.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featuredItems.slice(0, 3).map((item: MenuItem) => (
                  <MenuSection.FeatureCard
                    key={item.id}
                    item={item}
                    currencyCode={storeInfo.currencyCode}
                    locale={storeInfo.locale}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div className="storefront-shell py-8 sm:py-12 lg:py-16">
          <div className="space-y-16 sm:space-y-20">
            {categorySections.map(({ category, items, sectionId }) => (
              <MenuSection
                key={category.id}
                sectionId={sectionId}
                title={category.name}
                description={category.description || undefined}
                items={items}
                currencyCode={storeInfo.currencyCode}
                locale={storeInfo.locale}
                className={sectionScrollMt}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

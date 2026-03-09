import { Metadata } from "next"
import { getMenuCategories, getMenuItems, getFeaturedMenuItems, getStoreSettings } from "@/features/storefront/lib/data/menu"
import { getUser } from "@/features/storefront/lib/data/user"
import { type StoreInfo } from "@/features/storefront/lib/store-data"
import HomePageClient from "./HomePageClient"
import { getCurrencyConfig } from "@/features/storefront/lib/currency"

// Force dynamic rendering since we fetch data
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings()

  return {
    title: storeSettings?.name ? `${storeSettings.name} - ${storeSettings.tagline || ''}` : "Restaurant",
    description: storeSettings?.heroSubheadline || storeSettings?.tagline || "",
  }
}

export default async function HomePage() {
  // Fetch all data server-side
  const [categories, allItems, featuredItems, storeSettings, user] = await Promise.all([
    getMenuCategories(),
    getMenuItems(),
    getFeaturedMenuItems(8),
    getStoreSettings(),
    getUser(),
  ])

  // If no store settings exist, return null (middleware will redirect to init)
  if (!storeSettings) {
    return null
  }

  // Build storeInfo from database settings
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
    hours: storeSettings.hours || {},
    deliveryFee: parseFloat(storeSettings.deliveryFee) || 0,
    deliveryMinimum: parseFloat(storeSettings.deliveryMinimum) || 0,
    pickupDiscount: storeSettings.pickupDiscount ?? 0,
    estimatedDelivery: storeSettings.estimatedDelivery || '',
    estimatedPickup: storeSettings.estimatedPickup || '',
    heroHeadline: storeSettings.heroHeadline,
    heroSubheadline: storeSettings.heroSubheadline,
    heroTagline: storeSettings.heroTagline,
    promoBanner: storeSettings.promoBanner,
    rating: parseFloat(storeSettings.rating) || undefined,
    reviewCount: storeSettings.reviewCount || undefined,
  }

  // Add "All" category at the beginning
  const allCategories = [
    { id: "all", name: "All", icon: "all", sortOrder: -1 },
    ...categories
  ]

  return (
    <HomePageClient
      categories={allCategories}
      menuItems={allItems}
      featuredItems={featuredItems}
      storeInfo={storeInfo}
      user={user}
    />
  )
}

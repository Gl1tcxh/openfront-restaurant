import LoginPage from "@/features/storefront/screens/LoginPage"
import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings()
  return {
    title: `Sign In - ${storeSettings?.name || "Openfront Restaurant"}`,
  }
}

export default async function Page() {
  const storeSettings = await getStoreSettings()
  const storeInfo = {
    name: storeSettings?.name || "Openfront Restaurant",
    tagline: storeSettings?.tagline || "",
    address: storeSettings?.address || "",
    phone: storeSettings?.phone || "",
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
    timezone: storeSettings?.timezone || "America/New_York",
    countryCode: storeSettings?.countryCode || "US",
    hours: storeSettings?.hours || {},
    deliveryFee: parseFloat(storeSettings?.deliveryFee || "0"),
    deliveryMinimum: parseFloat(storeSettings?.deliveryMinimum || "0"),
    pickupDiscount: storeSettings?.pickupDiscount || 0,
    estimatedDelivery: storeSettings?.estimatedDelivery || "",
    estimatedPickup: storeSettings?.estimatedPickup || "",
  }

  return <LoginPage storeInfo={storeInfo} />
}

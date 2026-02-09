import LoginPage from "@/features/storefront/screens/LoginPage"
import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings()
  return {
    title: `Sign In - ${storeSettings?.name || "Restaurant"}`,
  }
}

export default async function Default() {
  const storeSettings = await getStoreSettings()
  const storeInfo = {
    name: storeSettings?.name || "",
    tagline: storeSettings?.tagline || "",
    address: storeSettings?.address || "",
    phone: storeSettings?.phone || "",
    hours: storeSettings?.hours || {},
    deliveryFee: parseFloat(storeSettings?.deliveryFee || "0"),
    pickupDiscount: storeSettings?.pickupDiscount || 0,
    estimatedDelivery: storeSettings?.estimatedDelivery || "",
    estimatedPickup: storeSettings?.estimatedPickup || "",
  }

  return <LoginPage storeInfo={storeInfo} />
}

import { NextResponse } from "next/server"
import { getStoreSettings, getStorefrontPaymentConfig } from "@/features/storefront/lib/data/menu"
import { getUser } from "@/features/storefront/lib/data/user"

export async function GET() {
  try {
    const [storeSettings, paymentConfig, user] = await Promise.all([
      getStoreSettings(),
      getStorefrontPaymentConfig(),
      getUser(),
    ])

    return NextResponse.json({
      storeInfo: storeSettings,
      paymentConfig,
      user,
    })
  } catch (error) {
    console.error("Error fetching store config:", error)
    return NextResponse.json(
      { error: "Failed to fetch store configuration" },
      { status: 500 }
    )
  }
}

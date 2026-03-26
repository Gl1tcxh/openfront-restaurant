import { Suspense } from "react"
import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import { getCurrencyConfig } from "@/features/storefront/lib/currency"
import CartButton from "@/features/storefront/modules/layout/components/cart-button"

export default async function Nav() {
  const storeSettings = await getStoreSettings()

  const storeName = storeSettings?.name || "Restaurant"
  const currencyConfig = getCurrencyConfig(storeSettings || undefined)

  return (
    <div className="sticky top-0 z-50 bg-background">
      <header className="bg-background/95 backdrop-blur-sm">
        {storeSettings?.promoBanner && (
          <div className="border-b border-border">
            <div className="container mx-auto px-6 py-2">
              <p className="text-center text-xs tracking-widest uppercase text-muted-foreground">
                {storeSettings.promoBanner}
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-border">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <a href="/" className="flex items-center gap-2">
                <span className="font-serif text-2xl tracking-tight">{storeName}</span>
              </a>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <Suspense fallback={
                  <button className="relative flex items-center gap-2 text-sm tracking-wide uppercase">
                    <span className="hidden sm:inline">Bag</span>
                  </button>
                }>
                  <CartButton
                    currencyCode={currencyConfig.currencyCode}
                    locale={currencyConfig.locale}
                  />
                </Suspense>

                <a href="/account" className="hidden sm:flex items-center gap-2 text-sm tracking-wide uppercase hover:text-primary transition-colors">
                  Account
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

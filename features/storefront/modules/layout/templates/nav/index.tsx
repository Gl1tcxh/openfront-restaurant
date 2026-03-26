import { Suspense } from "react"
import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import { getCurrencyConfig } from "@/features/storefront/lib/currency"
import CartButton from "@/features/storefront/modules/layout/components/cart-button"

export default async function Nav() {
  const storeSettings = await getStoreSettings()

  const storeName = storeSettings?.name || "Restaurant"
  const currencyConfig = getCurrencyConfig(storeSettings || undefined)

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-background/80 backdrop-blur-xl border-b border-border/50">
        {storeSettings?.promoBanner && (
          <div className="bg-primary text-primary-foreground">
            <div className="container mx-auto px-6 py-2.5">
              <p className="text-center text-[11px] font-medium tracking-[0.2em] uppercase">
                {storeSettings.promoBanner}
              </p>
            </div>
          </div>
        )}

        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <span className="font-serif font-bold text-[1.6rem] tracking-tight leading-none">
                {storeName}
              </span>
            </a>

            {/* Right side */}
            <div className="flex items-center gap-5">
              <a
                href="/account"
                className="hidden sm:flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Account
              </a>

              <div className="h-5 w-px bg-border hidden sm:block" />

              <Suspense fallback={
                <button className="relative flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                  <span className="hidden sm:inline">Order</span>
                </button>
              }>
                <CartButton
                  currencyCode={currencyConfig.currencyCode}
                  locale={currencyConfig.locale}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

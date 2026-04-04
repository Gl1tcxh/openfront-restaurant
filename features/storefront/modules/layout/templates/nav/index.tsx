import Link from "next/link"
import { Suspense } from "react"
import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import { getCurrencyConfig } from "@/features/storefront/lib/currency"
import CartButton from "@/features/storefront/modules/layout/components/cart-button"
import { StorefrontSectionLink } from "@/features/storefront/components/StorefrontSectionLink"

const primaryLinks = [
  { href: "/#popular-dishes", label: "Popular" },
  { href: "/#menu", label: "Menu" },
  { href: "/#visit-us", label: "Visit us" },
]

export default async function Nav() {
  const storeSettings = await getStoreSettings()

  const storeName = storeSettings?.name || "Restaurant"
  const currencyConfig = getCurrencyConfig(storeSettings || undefined)

  return (
    <div className="sticky top-0 z-50">
      {storeSettings?.promoBanner ? (
        <div className="border-b border-primary/20 bg-primary text-primary-foreground">
          <div className="storefront-shell py-2">
            <p className="text-center text-xs font-medium tracking-[0.18em] text-primary-foreground/90 uppercase">
              {storeSettings.promoBanner}
            </p>
          </div>
        </div>
      ) : null}

      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="storefront-shell flex h-16 items-center justify-between gap-6">
          <Link href="/" className="min-w-0 py-1">
            <span className="block whitespace-nowrap font-serif text-[1.4rem] font-bold leading-[1.05] tracking-tight text-primary sm:text-[1.6rem]">
              {storeName}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {primaryLinks.map((link) => (
              <StorefrontSectionLink
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
              >
                {link.label}
              </StorefrontSectionLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/account"
              className="hidden rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary sm:inline-flex"
            >
              Account
            </Link>

            <Suspense
              fallback={
                <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
                  <span>Order</span>
                </button>
              }
            >
              <CartButton
                currencyCode={currencyConfig.currencyCode}
                locale={currencyConfig.locale}
              />
            </Suspense>
          </div>
        </div>
      </header>
    </div>
  )
}

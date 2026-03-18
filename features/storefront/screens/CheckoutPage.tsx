import Link from "next/link"
import { ChevronDown, Loader2 } from "lucide-react"
import { CheckoutForm } from "@/features/storefront/modules/checkout/components/checkout-form"
import { getStoreSettings, getStorefrontPaymentConfig } from "@/features/storefront/lib/data/menu"
import { getUser } from "@/features/storefront/lib/data/user"
import { fetchCart } from "@/features/storefront/lib/data"
import { Suspense } from "react"

export const metadata = {
  title: "Checkout",
}

export async function CheckoutPage() {
  const [storeSettings, paymentConfig, user, cart] = await Promise.all([
    getStoreSettings(),
    getStorefrontPaymentConfig(),
    getUser(),
    fetchCart(),
  ])

  if (!cart || !cart.items?.length) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
        <h1 className="text-2xl font-semibold text-foreground">Your cart is empty</h1>
        <p className="text-xs font-normal text-foreground">Add some items to your cart before checking out.</p>
        <Link href="/" className="text-primary hover:underline">Browse Menu</Link>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckoutForm
        cart={cart}
        storeInfo={storeSettings}
        paymentConfig={paymentConfig}
        user={user}
      />
    </Suspense>
  )
}

export function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-background relative">
      <div className="h-16 bg-background border-b">
        <nav className="flex h-full items-center max-w-[1440px] w-full mx-auto px-6 justify-between">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-x-2 uppercase flex-1 basis-0 min-w-0"
            data-testid="back-to-menu-link"
          >
            <ChevronDown className="rotate-90 shrink-0" size={16} />
            <span className="mt-px hidden lg:block text-xs font-medium leading-5 truncate">Back to menu</span>
            <span className="mt-px hidden sm:block lg:hidden text-xs font-medium leading-5 truncate">Back</span>
          </Link>
          <div className="text-lg font-semibold">Checkout</div>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}

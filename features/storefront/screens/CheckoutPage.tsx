import { notFound } from "next/navigation";
import Wrapper from "@/features/storefront/modules/checkout/components/payment-wrapper";
import CheckoutForm from "@/features/storefront/modules/checkout/components/checkout-form";
import CheckoutSummary from "@/features/storefront/modules/checkout/components/checkout-summary";
import { retrieveCart } from "@/features/storefront/lib/data/cart";
import { getUser } from "@/features/storefront/lib/data/user";
import { getStorefrontPaymentConfig } from "@/features/storefront/lib/data/menu";
import React from "react"
import Link from "next/link"

export const metadata = {
  title: "Checkout",
};

const fetchCartData = async () => {
  const cart = await retrieveCart();
  if (!cart) {
    return notFound();
  }
  return cart;
};

export async function CheckoutPage() {
  const [cart, customer, paymentConfig] = await Promise.all([
    fetchCartData(),
    getUser(),
    getStorefrontPaymentConfig(),
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_416px] max-w-[1440px] w-full mx-auto px-6 gap-y-8 sm:gap-x-12 xl:gap-x-40 py-12">
      <Wrapper cart={cart} paymentConfig={paymentConfig}>
        <CheckoutForm cart={cart} customer={customer} />
      </Wrapper>
      <CheckoutSummary cart={cart} />
    </div>
  );
}

export function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-background relative">
      <div className="h-16 bg-background border-b">
        <nav className="flex h-full items-center max-w-[1440px] w-full mx-auto px-6 justify-between">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-x-2 uppercase flex-1 basis-0 min-w-0"
            data-testid="back-to-menu-link"
          >
            <span className="mt-px hidden lg:block text-xs font-medium leading-5 truncate">Back to menu</span>
            <span className="mt-px hidden sm:block lg:hidden text-xs font-medium leading-5 truncate">Back</span>
          </Link>
          <div className="text-lg font-semibold">Checkout</div>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}

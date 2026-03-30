import { notFound } from "next/navigation";
import Wrapper from "@/features/storefront/modules/checkout/components/payment-wrapper";
import CheckoutForm from "@/features/storefront/modules/checkout/components/checkout-form";
import CheckoutSummary from "@/features/storefront/modules/checkout/components/checkout-summary";
import { retrieveCart } from "@/features/storefront/lib/data/cart";
import { getUser } from "@/features/storefront/lib/data/user";
import { getStoreSettings } from "@/features/storefront/lib/data/menu";
import { CheckoutPaymentStateProvider } from "@/features/storefront/modules/checkout/components/checkout-state";
import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
  const cart = await fetchCartData();
  const [customer, storeSettings] = await Promise.all([getUser(), getStoreSettings()]);

  return (
    <Wrapper cart={cart}>
      <CheckoutPaymentStateProvider>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] max-w-[1080px] w-full mx-auto px-6 gap-y-8 lg:gap-x-16 py-10 md:py-14">
          <CheckoutForm cart={cart} customer={customer} storeSettings={storeSettings} />
          <CheckoutSummary cart={cart} customer={customer} storeSettings={storeSettings} />
        </div>
      </CheckoutPaymentStateProvider>
    </Wrapper>
  );
}

export function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-background relative">
      <div className="h-16 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <nav className="flex h-full items-center max-w-[1080px] w-full mx-auto px-6 justify-between">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-[13px] font-medium flex items-center gap-2 group"
            data-testid="back-to-menu-link"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to menu</span>
          </Link>
          <div className="font-serif font-bold text-xl tracking-tight">Checkout</div>
          <div className="flex-1 basis-0 max-w-[100px]" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}

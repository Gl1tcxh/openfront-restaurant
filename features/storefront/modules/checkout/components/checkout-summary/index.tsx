"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { calculateRestaurantCheckoutTotals } from "@/features/storefront/lib/checkout-totals";import PaymentButton from "../payment-button";
import { cn } from "@/lib/utils";
import { isStripe } from "@/features/storefront/lib/constants";
import { useCheckoutPaymentState } from "../checkout-state";
import LineItemDisplay from "@/features/storefront/modules/common/components/line-item-display";


type CheckoutSummaryProps = {
  cart: any;
  customer: any;
  storeSettings: any;
};

const CheckoutSummary = ({
  cart,
  customer,
  storeSettings,
}: CheckoutSummaryProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { cardComplete } = useCheckoutPaymentState();

  const items = cart?.items || [];
  const subtotal =
    cart?.subtotal ||
    items.reduce((sum: number, item: any) => {
      const itemPrice = item.menuItem?.price || 0;
      const modifierPrice = (item.modifiers || []).reduce(
        (subtotalSum: number, modifier: any) =>
          subtotalSum + (modifier.priceAdjustment || 0),
        0
      );
      return sum + (itemPrice + modifierPrice) * item.quantity;
    }, 0);

  const orderType = cart?.orderType || "pickup";
  const tipPercent = String(cart?.tipPercent || "0");
  const currencyConfig = {
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
  };

  const { deliveryFee, pickupDiscount, tax, tip, total } =
    calculateRestaurantCheckoutTotals({
      subtotal,
      orderType,
      tipPercent: Number(tipPercent),
      deliveryFee: Number(storeSettings?.deliveryFee || 0),
      pickupDiscountPercent: Number(storeSettings?.pickupDiscount || 10),
      taxRate: Number(storeSettings?.taxRate || 8.75),
    });

  const activeSession = cart?.paymentCollection?.paymentSessions?.find(
    (session: any) => session.isSelected
  );
  const activeSessionMatchesTotal = Boolean(
    activeSession &&
      activeSession.amount === total &&
      activeSession.status !== "error"
  );
  const requiresStripeCard =
    activeSessionMatchesTotal && isStripe(activeSession?.paymentProvider?.code);

  const currentStep = searchParams?.get("step");
  const isPaymentStage = currentStep === "payment" || currentStep === "review";

  const hasCustomerInfo = Boolean(
    cart?.customerName && cart?.email && cart?.customerPhone
  );
  const hasDeliveryInfo =
    orderType === "pickup" ||
    Boolean(
      cart?.deliveryAddress &&
        cart?.deliveryCity &&
        cart?.deliveryZip &&
        cart?.deliveryCountryCode
    );

  const canPlaceOrder = Boolean(
    hasCustomerInfo &&
      hasDeliveryInfo &&
      isPaymentStage &&
      activeSessionMatchesTotal &&
      (!requiresStripeCard || cardComplete)
  );


  return (
    <div className="sticky top-20 flex flex-col gap-y-6 py-8 sm:py-0">
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Order Items
        </h3>

        <div className="mt-4 divide-y divide-border/50">
          {items.map((item: any) => {
            return (
              <LineItemDisplay
                key={item.id}
                item={item}
                currencyCode={currencyConfig.currencyCode}
                locale={currencyConfig.locale}
                className="rounded-none border-0 bg-transparent px-0 py-4 first:pt-0 last:pb-0"
              />
            );
          })}
        </div>


        <div className="mt-4 border-t border-border pt-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal, currencyConfig)}</span>
          </div>
          {pickupDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span>Pickup Discount</span>
              <span className="font-medium tabular-nums">
                -{formatCurrency(pickupDiscount, currencyConfig)}
              </span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium tabular-nums">{formatCurrency(deliveryFee, currencyConfig)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium tabular-nums">{formatCurrency(tax, currencyConfig)}</span>
          </div>
          {Number(tipPercent) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
              <span className="font-medium tabular-nums">{formatCurrency(tip, currencyConfig)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="font-medium">Total</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(total, currencyConfig)}
            </span>
          </div>
          {canPlaceOrder ? (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By placing your order, you agree to our Terms of Use, Terms of Sale
              and acknowledge our Privacy Policy.
            </p>
            <PaymentButton
              cart={cart}
              billingAddress={customer?.billingAddress || null}
              data-testid="submit-order-button"
            />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;

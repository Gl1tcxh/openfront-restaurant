"use client";

import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { calculateRestaurantCheckoutTotals } from "@/features/storefront/lib/checkout-totals";
import PaymentButton from "../payment-button";
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
  const searchParams = useSearchParams();
  const { cardComplete } = useCheckoutPaymentState();

  const items = cart?.items || [];
  const subtotal =
    cart?.subtotal ||
    items.reduce((sum: number, item: any) => {
      const itemPrice = item.menuItem?.price || 0;
      const modifierPrice = (item.modifiers || []).reduce(
        (subtotalSum: number, modifier: any) => subtotalSum + (modifier.priceAdjustment || 0),
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
    activeSession && activeSession.amount === total && activeSession.status !== "error"
  );
  const requiresStripeCard =
    activeSessionMatchesTotal && isStripe(activeSession?.paymentProvider?.code);

  const currentStep = searchParams?.get("step") || "contact";
  const isPaymentStage = currentStep === "payment" || currentStep === "review";

  const hasCustomerInfo = Boolean(cart?.customerName && cart?.email && cart?.customerPhone);
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
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="storefront-surface bg-card p-6">
        <div className="border-b border-border pb-4">
          <p className="text-sm font-medium text-primary">Order summary</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</h2>
        </div>

        <div className="mt-2">
          {items.map((item: any) => (
            <LineItemDisplay
              key={item.id}
              item={item}
              currencyCode={currencyConfig.currencyCode}
              locale={currencyConfig.locale}
            />
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(subtotal, currencyConfig)}
            </span>
          </div>

          {pickupDiscount > 0 && (
            <div className="flex items-center justify-between text-emerald-700">
              <span>Pickup discount</span>
              <span className="font-medium tabular-nums">
                -{formatCurrency(pickupDiscount, currencyConfig)}
              </span>
            </div>
          )}

          {deliveryFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(deliveryFee, currencyConfig)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(tax, currencyConfig)}
            </span>
          </div>

          {Number(tipPercent) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(tip, currencyConfig)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4 text-base">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrency(total, currencyConfig)}
            </span>
          </div>
        </div>

        {canPlaceOrder ? (
          <div className="mt-5 border-t border-border pt-5 space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              By placing your order, you agree to our terms and acknowledge our privacy policy.
            </p>
            <PaymentButton
              cart={cart}
              billingAddress={customer?.billingAddress || null}
              data-testid="submit-order-button"
            />
          </div>
        ) : (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Complete the steps on the left to unlock order placement.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CheckoutSummary;

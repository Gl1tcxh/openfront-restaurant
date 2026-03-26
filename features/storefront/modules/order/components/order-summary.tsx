"use client";

import { formatCurrency } from "@/features/storefront/lib/currency";
import { getOrderPriceAdjustments } from "@/features/lib/restaurant-order-pricing";

interface OrderSummaryProps {
  orderType?: string;
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  currencyCode?: string;
  locale?: string;
}

export function OrderSummary({
  orderType,
  subtotal,
  tax,
  tip,
  discount,
  total,
  currencyCode = "USD",
  locale = "en-US",
}: OrderSummaryProps) {
  const currencyConfig = { currencyCode, locale };
  const { deliveryFee, pickupDiscount, remainingDiscount } = getOrderPriceAdjustments({
    orderType,
    subtotal,
    tax,
    tip,
    discount,
    total,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Order Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal, currencyConfig)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatCurrency(tax, currencyConfig)}</span>
        </div>
        {tip > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tip</span>
            <span>{formatCurrency(tip, currencyConfig)}</span>
          </div>
        )}
        {pickupDiscount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Pickup Discount</span>
            <span>-{formatCurrency(pickupDiscount, currencyConfig)}</span>
          </div>
        )}
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span>{formatCurrency(deliveryFee, currencyConfig)}</span>
          </div>
        )}
        {remainingDiscount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discount</span>
            <span>-{formatCurrency(remainingDiscount, currencyConfig)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 mt-2">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total, currencyConfig)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { calculateRestaurantTotals } from "@/features/lib/restaurant-order-pricing"

export function calculateRestaurantCheckoutTotals({
  subtotal,
  orderType,
  tipPercent,
  deliveryFee,
  pickupDiscountPercent,
  taxRate,
}: {
  subtotal: number
  orderType: string
  tipPercent: number
  deliveryFee: number
  pickupDiscountPercent: number
  taxRate: number
}) {
  return calculateRestaurantTotals({
    subtotal,
    orderType,
    tipPercent,
    deliveryFee,
    pickupDiscountPercent,
    taxRate,
  })
}

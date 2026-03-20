type CurrencyConfig = {
  currencyCode?: string
  locale?: string
}

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
  const normalizedSubtotal = Number(subtotal || 0)
  const normalizedDeliveryFee = orderType === "delivery" ? Math.round(Number(deliveryFee || 0) * 100) : 0
  const normalizedPickupDiscountPercent = Number(pickupDiscountPercent || 0)
  const normalizedTaxRate = Number(taxRate || 0)
  const normalizedTipPercent = Number(tipPercent || 0)

  const pickupDiscount =
    orderType === "pickup"
      ? Math.round(normalizedSubtotal * (normalizedPickupDiscountPercent / 100))
      : 0
  const tax = Math.round(normalizedSubtotal * (normalizedTaxRate / 100))
  const tip = Math.round(normalizedSubtotal * (normalizedTipPercent / 100))
  const total = normalizedSubtotal - pickupDiscount + normalizedDeliveryFee + tax + tip

  return {
    subtotal: normalizedSubtotal,
    deliveryFee: normalizedDeliveryFee,
    pickupDiscount,
    tax,
    tip,
    total,
  }
}

import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { calculateRestaurantCheckoutTotals } from "@/features/storefront/lib/checkout-totals"

const CheckoutSummary = async ({ cart }: { cart: any }) => {
  const storeSettings = await getStoreSettings()
  const items = cart?.items || []
  const subtotal = cart?.subtotal || items.reduce((sum: number, item: any) => {
    const itemPrice = item.menuItem?.price || 0
    const modifierPrice = (item.modifiers || []).reduce((s: number, m: any) => s + (m.priceAdjustment || 0), 0)
    return sum + ((itemPrice + modifierPrice) * item.quantity)
  }, 0)

  const orderType = cart?.orderType || "pickup"
  const tipPercent = Number(cart?.tipPercent || 0)
  const currencyConfig = {
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
  }

  const { deliveryFee, pickupDiscount, tax, tip, total } = calculateRestaurantCheckoutTotals({
    subtotal,
    orderType,
    tipPercent,
    deliveryFee: Number(storeSettings?.deliveryFee || 0),
    pickupDiscountPercent: Number(storeSettings?.pickupDiscount || 10),
    taxRate: Number(storeSettings?.taxRate || 8.75),
  })

  return (
    <div className="sticky top-20 flex flex-col-reverse sm:flex-col gap-y-8 py-8 sm:py-0">
      <div className="w-full flex flex-col">
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-serif font-bold text-xl tracking-tight mb-5">
            Order Summary
          </h2>

          <div className="flex flex-col gap-y-3 pb-5 border-b border-border/50">
            {items.map((item: any) => {
              const itemPrice = item.menuItem?.price || 0
              const modifierPrice = (item.modifiers || []).reduce((s: number, m: any) => s + (m.priceAdjustment || 0), 0)
              const lineTotal = (itemPrice + modifierPrice) * item.quantity

              return (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-warm-100 text-warm-800 text-xs font-bold shrink-0">
                      {item.quantity}×
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium leading-snug">{item.menuItem?.name}</span>
                      {item.modifiers?.length > 0 && (
                        <span className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {item.modifiers.map((m: any) => m.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">{formatCurrency(lineTotal, currencyConfig)}</span>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal, currencyConfig)}</span>
            </div>
            {pickupDiscount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Pickup Discount</span>
                <span className="tabular-nums">-{formatCurrency(pickupDiscount, currencyConfig)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="tabular-nums">{formatCurrency(deliveryFee, currencyConfig)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">{formatCurrency(tax, currencyConfig)}</span>
            </div>
            {tipPercent > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
                <span className="tabular-nums">{formatCurrency(tip, currencyConfig)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="font-serif font-bold text-lg">Total</span>
              <span className="font-serif font-bold text-lg tabular-nums">{formatCurrency(total, currencyConfig)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary

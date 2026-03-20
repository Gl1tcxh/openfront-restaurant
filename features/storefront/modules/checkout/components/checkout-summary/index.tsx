import Divider from "@/features/storefront/modules/common/components/divider"
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
    <div className="sticky top-0 flex flex-col-reverse sm:flex-col gap-y-8 py-8 sm:py-0">
      <div className="w-full bg-background flex flex-col">
        <Divider className="my-6 sm:hidden" />
        <h2 className="flex flex-row text-3xl font-medium items-baseline">
          Order Summary
        </h2>
        <Divider className="my-6" />

        <div className="flex flex-col gap-y-4">
          {items.map((item: any) => {
            const itemPrice = item.menuItem?.price || 0
            const modifierPrice = (item.modifiers || []).reduce((s: number, m: any) => s + (m.priceAdjustment || 0), 0)
            const lineTotal = (itemPrice + modifierPrice) * item.quantity

            return (
              <div key={item.id} className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted text-sm font-medium">
                    {item.quantity}x
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.menuItem?.name}</span>
                    {item.modifiers?.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {item.modifiers.map((m: any) => m.name).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm">{formatCurrency(lineTotal, currencyConfig)}</span>
              </div>
            )
          })}
        </div>

        <Divider className="my-6" />

        <div className="flex flex-col gap-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal, currencyConfig)}</span>
          </div>
          {pickupDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-primary">
              <span>Pickup Discount</span>
              <span>-{formatCurrency(pickupDiscount, currencyConfig)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>{formatCurrency(deliveryFee, currencyConfig)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(tax, currencyConfig)}</span>
          </div>
          {tipPercent > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
              <span>{formatCurrency(tip, currencyConfig)}</span>
            </div>
          )}
          <Divider className="my-2" />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total, currencyConfig)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary

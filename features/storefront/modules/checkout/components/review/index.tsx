"use client"

import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { calculateRestaurantCheckoutTotals } from "@/features/storefront/lib/checkout-totals"
import PaymentButton from "../payment-button"

function getImageUrl(item: any): string {
  const firstImage = item?.menuItemImages?.[0]
  if (firstImage?.image?.url) return firstImage.image.url
  if (firstImage?.imagePath) return firstImage.imagePath
  return "/placeholder.jpg"
}

const Review = ({
  cart,
  storeSettings,
}: {
  cart: any
  storeSettings: any
}) => {
  const storeInfo = storeSettings || {}
  const searchParams = useSearchParams()

  const isOpen = searchParams?.get("step") === "review"

  const orderType = cart?.orderType || "pickup"

  const hasCustomerInfo = !!(cart?.customerName && cart?.email && cart?.customerPhone)
  const hasDeliveryInfo =
    orderType === "pickup" ||
    !!(cart?.deliveryAddress && cart?.deliveryCity && cart?.deliveryZip)
  const hasPaymentSession = !!cart?.paymentCollection?.paymentSessions?.find(
    (s: any) => s.isSelected
  )
  const previousStepsCompleted =
    hasCustomerInfo && hasDeliveryInfo && hasPaymentSession

  const subtotal = cart?.subtotal || 0
  const tipPercent = Number(cart?.tipPercent || 18)
  const currencyConfig = { currencyCode: storeInfo?.currencyCode || "USD", locale: storeInfo?.locale || "en-US" }
  const { deliveryFee, pickupDiscount, tax, tip, total } = calculateRestaurantCheckoutTotals({
    subtotal,
    orderType,
    tipPercent,
    deliveryFee: Number(storeInfo?.deliveryFee || 0),
    pickupDiscountPercent: Number(storeInfo?.pickupDiscount || 10),
    taxRate: Number(storeInfo?.taxRate || 8.75),
  })

  return (
    <div className="bg-background">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2
          className={cn("flex flex-row text-3xl font-medium gap-x-2 items-baseline", {
            "opacity-50 pointer-events-none select-none": !isOpen || !previousStepsCompleted,
          })}
        >
          Review
        </h2>
      </div>

      {isOpen && previousStepsCompleted && (
        <>
          <div className="space-y-4 mb-6">
            {cart?.items?.map((item: any) => {
              const modifiersTotal = item.modifiers?.reduce((sum: number, m: any) => sum + (m.priceAdjustment || 0), 0) || 0
              const itemTotal = (item.menuItem?.price || 0) + modifiersTotal
              return (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 bg-muted rounded-md overflow-hidden">
                    <Image src={getImageUrl(item.menuItem)} alt={item.menuItem?.name || ""} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.menuItem?.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    {item.modifiers?.length > 0 && (
                      <p className="text-xs text-muted-foreground">+ {item.modifiers.map((m: any) => m.name).join(", ")}</p>
                    )}
                  </div>
                  <p className="text-sm whitespace-nowrap">{formatCurrency(itemTotal * item.quantity, currencyConfig)}</p>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border pt-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal, currencyConfig)}</span>
            </div>
            {pickupDiscount > 0 && (
              <div className="flex justify-between text-sm mb-2 text-primary">
                <span>Pickup Discount</span>
                <span>-{formatCurrency(pickupDiscount, currencyConfig)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatCurrency(deliveryFee, currencyConfig)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(tax, currencyConfig)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
              <span>{formatCurrency(tip, currencyConfig)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(total, currencyConfig)}</span>
            </div>
          </div>

          <div className="flex items-start gap-x-1 w-full mb-6">
            <p className="text-sm text-foreground mb-1">
              By clicking the Place Order button, you confirm that you have read, understand and accept our Terms of Use, Terms of Sale and Returns Policy and acknowledge that you have read our Privacy Policy.
            </p>
          </div>

          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review

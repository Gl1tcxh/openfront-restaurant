"use client"

import { CircleCheck, Loader2, ShoppingBag, Truck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { createGuestUser } from "@/features/storefront/lib/data/user"
import { setCheckoutContact } from "@/features/storefront/lib/data/cart"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { calculateRestaurantTotals } from "@/features/lib/restaurant-order-pricing"

const Contact = ({
  cart,
  customer,
  storeSettings,
}: {
  cart: any
  customer: any
  storeSettings: any
}) => {
  const user = customer
  const deliveryEnabled = storeSettings?.deliveryEnabled ?? true
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams?.get("step") === "contact"

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderType, setOrderType] = useState(
    cart?.orderType === "delivery" && !deliveryEnabled ? "pickup" : cart?.orderType || "pickup"
  )
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.name?.split(" ")[0] || cart?.customerName?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || cart?.customerName?.split(" ").slice(1).join(" ") || "",
    email: user?.email || cart?.email || "",
    phone: user?.phone || cart?.customerPhone || "",
  })

  const isComplete = customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone
  const currencyConfig = {
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
  }
  const deliveryPricing = calculateRestaurantTotals({
    subtotal: Number(cart?.subtotal || 0),
    orderType,
    tipPercent: Number(cart?.tipPercent || 0),
    deliveryFee: storeSettings?.deliveryFee,
    deliveryMinimum: storeSettings?.deliveryMinimum,
    pickupDiscountPercent: Number(storeSettings?.pickupDiscount || 0),
    taxRate: Number(storeSettings?.taxRate || 0),
    currencyCode: currencyConfig.currencyCode,
  })
  const deliveryMinimumNotMet = Boolean(deliveryPricing.deliveryMinimumNotMet)

  const handleEdit = () => {
    router.push(pathname + "?step=contact")
  }

  const handleSubmit = async () => {
    if (!isComplete) return
    setIsLoading(true)
    setError(null)

    try {
      if (orderType === "delivery" && deliveryMinimumNotMet) {
        setError(
          `Delivery requires a minimum subtotal of ${formatCurrency(storeSettings?.deliveryMinimum || 0, currencyConfig, {
            inputIsCents: false,
          })}. Add ${formatCurrency(deliveryPricing.deliveryMinimumShortfall, currencyConfig)} more or switch to pickup.`
        )
        setIsLoading(false)
        return
      }

      let customerId = user?.id

      // Create guest user if not logged in
      if (!user) {
        const result = await createGuestUser({
          email: customerInfo.email,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          phone: customerInfo.phone,
        })
        if (!result.success) {
          setError(result.error || "Could not proceed. Please try again.")
          setIsLoading(false)
          return
        }
        customerId = result.userId
      }

      // Save to cart
      const result = await setCheckoutContact({
        email: customerInfo.email,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerPhone: customerInfo.phone,
        orderType,
        userId: customerId,
      })

      if (!result.success) {
        setError(result.message || "Could not proceed. Please try again.")
        setIsLoading(false)
        return
      }

      router.refresh()
      router.push(pathname + "?step=delivery")
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-warm-100 flex items-center justify-center">
            <User className="h-4 w-4 text-warm-700" />
          </div>
          <h2 className={cn("font-serif font-bold text-xl tracking-tight", { "text-muted-foreground": !isOpen && !isComplete })}>
            Contact
          </h2>
          {!isOpen && isComplete && <CircleCheck className="h-4 w-4 text-green-600" />}
        </div>
        {!isOpen && isComplete && (
          <Button onClick={handleEdit} data-testid="edit-contact-button" variant="ghost" size="sm" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Edit
          </Button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Order Type</Label>
            <RadioGroup
              value={orderType}
              onValueChange={(val) => setOrderType(val)}
              className={deliveryEnabled ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}
            >
              <div>
                <RadioGroupItem value="pickup" id="order-pickup" className="peer sr-only" />
                <Label htmlFor="order-pickup" className="flex flex-col items-start gap-1 border border-border rounded-xl p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="text-sm font-semibold">Pickup</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground pl-6">Free</span>
                </Label>
              </div>
              {deliveryEnabled ? (
                <div>
                  <RadioGroupItem value="delivery" id="order-delivery" className="peer sr-only" />
                  <Label htmlFor="order-delivery" className="flex flex-col items-start gap-1 border border-border rounded-xl p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="text-sm font-semibold">Delivery</span>
                    </div>
                    <div className="text-[12px] text-muted-foreground pl-6 flex flex-col items-start">
                      <span>{formatCurrency(storeSettings?.deliveryFee || 0, currencyConfig, { inputIsCents: false })}</span>
                      <span>Min. {formatCurrency(storeSettings?.deliveryMinimum || 0, currencyConfig, { inputIsCents: false })}</span>
                    </div>
                  </Label>
                </div>
              ) : null}
            </RadioGroup>
            {orderType === "delivery" && deliveryMinimumNotMet ? (
              <p className="text-sm text-amber-600 font-medium">
                Add {formatCurrency(deliveryPricing.deliveryMinimumShortfall, currencyConfig)} more for delivery, or switch to pickup.
              </p>
            ) : null}
            {!deliveryEnabled ? (
              <p className="text-xs text-muted-foreground">
                This restaurant is currently pickup only.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Your Information</h3>
              {!user && (
                <Link href="/account" className="text-[12px] font-medium text-warm-600 hover:text-warm-700 transition-colors">
                  Sign in →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First name" value={customerInfo.firstName} onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))} required data-testid="first-name-input" className="rounded-lg h-11" />
              <Input placeholder="Last name" value={customerInfo.lastName} onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))} required data-testid="last-name-input" className="rounded-lg h-11" />
            </div>
            <Input type="email" placeholder="Email" value={customerInfo.email} onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))} required data-testid="email-input" className="rounded-lg h-11" />
            <Input type="tel" placeholder="Phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))} required data-testid="phone-input" className="rounded-lg h-11" />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-xs leading-5">
              {error}
            </div>
          )}

          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!isComplete || isLoading || (orderType === "delivery" && deliveryMinimumNotMet)}
            data-testid="submit-contact-button"
            className="w-full rounded-xl h-12 font-semibold"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </div>
      ) : (
        isComplete && (
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-x-8 pl-11">
            <div className="flex flex-col" data-testid="contact-summary">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contact</p>
              <p className="text-sm text-foreground">{customerInfo.firstName} {customerInfo.lastName}</p>
              <p className="text-sm text-muted-foreground">{customerInfo.email}</p>
              <p className="text-sm text-muted-foreground">{customerInfo.phone}</p>
            </div>
            <div className="flex flex-col" data-testid="order-type-summary">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Order Type</p>
              <p className="text-sm text-foreground capitalize">{orderType}</p>
            </div>
          </div>
        )
      )}
    </div>
  )
}

export default Contact

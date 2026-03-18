"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { PayPalButtons } from "@paypal/react-paypal-js"
import { CircleCheck, CreditCard, DollarSign, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { type StoreInfo, type StorefrontPaymentConfig } from "@/features/storefront/lib/store-data"
import { createGuestUser } from "@/features/storefront/lib/data/user"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"

// ─── GraphQL Mutations ────────────────────────────────────────────
const UPDATE_CART_CUSTOMER_INFO = `
  mutation UpdateCartCustomerInfo($cartId: ID!, $data: CartUpdateInput!) {
    updateActiveCart(cartId: $cartId, data: $data) { id }
  }
`

const INITIATE_PAYMENT_SESSION = `
  mutation InitiatePaymentSession($cartId: ID!, $paymentProviderId: String!) {
    initiatePaymentSession(cartId: $cartId, paymentProviderId: $paymentProviderId) {
      id
      data
      amount
    }
  }
`

const COMPLETE_ACTIVE_CART = `
  mutation CompleteActiveCart($cartId: ID!, $paymentSessionId: ID) {
    completeActiveCart(cartId: $cartId, paymentSessionId: $paymentSessionId) {
      id
      orderNumber
      secretKey
      status
    }
  }
`

async function graphqlRequest(query: string, variables: any) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  })
  const result = await response.json()
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "GraphQL error")
  }
  return result.data
}

const PAYMENT_METHOD_TO_PROVIDER: Record<string, string> = {
  card: "pp_stripe",
  paypal: "pp_paypal",
  cash: "pp_manual",
}

type PaymentMethod = "card" | "paypal" | "cash"
type OrderType = "pickup" | "delivery"

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  city?: string
  zip?: string
}

// ─── Helpers ──────────────────────────────────────────────────────
function getImageUrl(item: any): string {
  const firstImage = item?.menuItemImages?.[0]
  if (firstImage?.image?.url) return firstImage.image.url
  if (firstImage?.imagePath) return firstImage.imagePath
  return "/placeholder.jpg"
}

// ─── Error Message Component ──────────────────────────────────────
function ErrorMessage({ error, "data-testid": dataTestId }: { error?: string | null; "data-testid"?: string }) {
  if (!error) return null
  return (
    <div className="pt-2 text-rose-500 text-xs leading-5 font-normal" data-testid={dataTestId}>
      <span>{error}</span>
    </div>
  )
}

// ─── Divider Component ────────────────────────────────────────────
function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full border-b border-border", className)} />
}

// ─── Contact Section ──────────────────────────────────────────────
function ContactSection({
  customerInfo,
  setCustomerInfo,
  user,
  isOpen,
  onEdit,
  onComplete,
  orderType,
  setOrderType,
}: {
  customerInfo: CustomerInfo
  setCustomerInfo: (info: CustomerInfo | ((prev: CustomerInfo) => CustomerInfo)) => void
  user?: any
  isOpen: boolean
  onEdit: () => void
  onComplete: () => void
  orderType: OrderType
  setOrderType: (type: OrderType) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const isComplete = customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone

  const handleContinue = async () => {
    if (!isComplete) return
    setIsLoading(true)
    setAuthError(null)

    if (!user) {
      const result = await createGuestUser({
        email: customerInfo.email,
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        phone: customerInfo.phone,
      })
      if (!result.success) {
        setAuthError(result.error || "Could not proceed. Please try again.")
        setIsLoading(false)
        return
      }
    }

    setIsLoading(false)
    onComplete()
  }

  return (
    <div className="bg-background">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className="flex flex-row text-3xl font-medium gap-x-2 items-baseline">
          Contact
          {!isOpen && isComplete && <CircleCheck className="hidden sm:block h-5 w-5 text-primary" />}
        </h2>
        {!isOpen && isComplete && (
          <Button onClick={onEdit} data-testid="edit-contact-button" variant="outline" size="sm">
            Update Contact
          </Button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium uppercase tracking-wide">Order Type</Label>
            <RadioGroup value={orderType} onValueChange={(val) => setOrderType(val as OrderType)} className="grid grid-cols-2 gap-3">
              <div>
                <RadioGroupItem value="pickup" id="order-pickup" className="peer sr-only" />
                <Label htmlFor="order-pickup" className="flex items-center justify-center border border-border p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center transition-colors rounded-md">
                  <span className="text-sm font-medium">Pickup</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="delivery" id="order-delivery" className="peer sr-only" />
                <Label htmlFor="order-delivery" className="flex items-center justify-center border border-border p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center transition-colors rounded-md">
                  <span className="text-sm font-medium">Delivery</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide">Your Information</h3>
            {!user && (
              <p className="text-xs text-muted-foreground">
                Already have an account? <Link href="/account" className="text-primary hover:underline">Sign in</Link>
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="First name" value={customerInfo.firstName} onChange={(e) => setCustomerInfo((prev) => ({ ...prev, firstName: e.target.value }))} required data-testid="first-name-input" />
              <Input placeholder="Last name" value={customerInfo.lastName} onChange={(e) => setCustomerInfo((prev) => ({ ...prev, lastName: e.target.value }))} required data-testid="last-name-input" />
            </div>
            <Input type="email" placeholder="Email" value={customerInfo.email} onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))} required data-testid="email-input" />
            <Input type="tel" placeholder="Phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))} required data-testid="phone-input" />
          </div>

          {authError && <ErrorMessage error={authError} data-testid="contact-error-message" />}

          <Button size="lg" onClick={handleContinue} disabled={!isComplete || isLoading} data-testid="submit-contact-button">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Delivery
          </Button>
        </div>
      ) : (
        isComplete && (
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-x-8">
            <div className="flex flex-col w-full sm:w-1/3" data-testid="contact-summary">
              <p className="text-sm font-medium text-foreground mb-1">Contact</p>
              <p className="text-sm font-normal text-muted-foreground">{customerInfo.firstName} {customerInfo.lastName}</p>
              <p className="text-sm font-normal text-muted-foreground">{customerInfo.email}</p>
              <p className="text-sm font-normal text-muted-foreground">{customerInfo.phone}</p>
            </div>
            <div className="flex flex-col w-full sm:w-1/3" data-testid="order-type-summary">
              <p className="text-sm font-medium text-foreground mb-1">Order Type</p>
              <p className="text-sm font-normal text-muted-foreground capitalize">{orderType}</p>
            </div>
          </div>
        )
      )}
      <Divider className="mt-8" />
    </div>
  )
}

// ─── Delivery Section ─────────────────────────────────────────────
function DeliverySection({
  customerInfo,
  setCustomerInfo,
  storeInfo,
  orderType,
  user,
  isOpen,
  onEdit,
  onComplete,
}: {
  customerInfo: CustomerInfo
  setCustomerInfo: (info: CustomerInfo | ((prev: CustomerInfo) => CustomerInfo)) => void
  storeInfo: StoreInfo
  orderType: OrderType
  user?: any
  isOpen: boolean
  onEdit: () => void
  onComplete: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const isComplete = orderType === "pickup" || (customerInfo.address && customerInfo.city && customerInfo.zip)

  const handleContinue = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsLoading(false)
    onComplete()
  }

  return (
    <div className="bg-background">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className={cn("flex flex-row text-3xl font-medium gap-x-2 items-baseline", { "opacity-50 pointer-events-none select-none": !isOpen && !isComplete })}>
          {orderType === "delivery" ? "Delivery Address" : "Pickup Location"}
          {!isOpen && isComplete && <CircleCheck className="hidden sm:block h-5 w-5 text-primary" />}
        </h2>
        {!isOpen && isComplete && (
          <Button onClick={onEdit} data-testid="edit-delivery-button" variant="outline" size="sm">Update</Button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-6">
          {orderType === "delivery" ? (
            <div className="space-y-4">
              {user && user.addresses?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Use a saved address:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {user.addresses.map((address: any) => (
                      <button key={address.id} type="button" onClick={() => setCustomerInfo((prev) => ({ ...prev, address: address.address1 || "", city: address.city || "", zip: address.postalCode || "" }))} className={cn("text-left p-3 border rounded-md text-sm transition-colors hover:bg-muted", customerInfo.address === address.address1 ? "border-primary bg-muted/50" : "border-border")}>
                        <p className="font-medium">{address.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{address.address1}, {address.city}</p>
                      </button>
                    ))}
                  </div>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><Separator /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or enter manually</span></div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="address" className="text-xs text-muted-foreground">Street Address</Label>
                <Input id="address" placeholder="123 Main St" className="mt-1" value={customerInfo.address || ""} onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))} data-testid="address-input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                  <Input id="city" placeholder="Brooklyn" className="mt-1" value={customerInfo.city || ""} onChange={(e) => setCustomerInfo((prev) => ({ ...prev, city: e.target.value }))} data-testid="city-input" />
                </div>
                <div>
                  <Label htmlFor="zip" className="text-xs text-muted-foreground">ZIP Code</Label>
                  <Input id="zip" placeholder="11201" className="mt-1" value={customerInfo.zip || ""} onChange={(e) => setCustomerInfo((prev) => ({ ...prev, zip: e.target.value }))} data-testid="zip-input" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2 mb-2"><MapPin className="h-4 w-4" />Pickup Location</h3>
              <p className="text-sm">{storeInfo.address}</p>
              <p className="text-sm text-muted-foreground mt-1">Ready in {storeInfo.estimatedPickup}</p>
            </div>
          )}
          <Button size="lg" onClick={handleContinue} disabled={!isComplete || isLoading} data-testid="submit-delivery-button">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Payment
          </Button>
        </div>
      ) : (
        isComplete && (
          <div className="flex flex-col w-full sm:w-1/3" data-testid="delivery-summary">
            {orderType === "delivery" ? (
              <>
                <p className="text-sm font-medium text-foreground mb-1">Delivery Address</p>
                <p className="text-sm font-normal text-muted-foreground">{customerInfo.address}</p>
                <p className="text-sm font-normal text-muted-foreground">{customerInfo.city}, {customerInfo.zip}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground mb-1">Pickup Location</p>
                <p className="text-sm font-normal text-muted-foreground">{storeInfo.address}</p>
                <p className="text-sm font-normal text-muted-foreground">Ready in {storeInfo.estimatedPickup}</p>
              </>
            )}
          </div>
        )
      )}
      <Divider className="mt-8" />
    </div>
  )
}

// ─── Payment Section (handles card confirmation HERE, not in review) ─
function PaymentSection({
  subtotal,
  storeInfo,
  paymentConfig,
  paymentMethod,
  setPaymentMethod,
  tipPercent,
  setTipPercent,
  customerInfo,
  orderType,
  cart,
  isOpen,
  onEdit,
  onComplete,
}: {
  subtotal: number
  storeInfo: StoreInfo
  paymentConfig: StorefrontPaymentConfig
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  tipPercent: number
  setTipPercent: (percent: number) => void
  customerInfo: CustomerInfo
  orderType: OrderType
  cart: any
  isOpen: boolean
  onEdit: () => void
  onComplete: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const currencyConfig = { currencyCode: storeInfo.currencyCode, locale: storeInfo.locale }

  const hasCardMethod = !!(paymentConfig.hasStripe && paymentConfig.stripePublishableKey)
  const hasPayPalMethod = !!(paymentConfig.hasPayPal && paymentConfig.paypalClientId)
  const hasCashMethod = paymentConfig.hasCash

  const cardElementOptions = {
    style: { base: { fontSize: "16px", color: "#424770", "::placeholder": { color: "#aab7c4" } }, invalid: { color: "#9e2146" } },
    hidePostalCode: true,
  }

  const saveCustomerInfoToCart = async () => {
    if (!cart?.id) throw new Error("No cart found")
    await graphqlRequest(UPDATE_CART_CUSTOMER_INFO, {
      cartId: cart.id,
      data: {
        email: customerInfo.email,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerPhone: customerInfo.phone,
        orderType,
        tipPercent: String(tipPercent),
        ...(orderType === "delivery"
          ? { deliveryAddress: customerInfo.address || "", deliveryCity: customerInfo.city || "", deliveryZip: customerInfo.zip || "" }
          : {}),
      },
    })
  }

  const handleContinue = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Save customer info to cart
      await saveCustomerInfoToCart()

      if (paymentMethod === "card") {
        // For Stripe: initiate payment session, then confirm card payment HERE
        if (!stripe || !elements) throw new Error("Payment system not ready")
        const card = elements.getElement(CardElement)
        if (!card) throw new Error("Card element not found")

        const { initiatePaymentSession: session } = await graphqlRequest(INITIATE_PAYMENT_SESSION, {
          cartId: cart.id,
          paymentProviderId: PAYMENT_METHOD_TO_PROVIDER.card,
        })

        if (!session?.data?.clientSecret) throw new Error("Failed to create payment session")

        // Confirm the card payment RIGHT HERE (on the payment step)
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          session.data.clientSecret,
          {
            payment_method: {
              card,
              billing_details: {
                name: `${customerInfo.firstName} ${customerInfo.lastName}`,
                email: customerInfo.email,
              },
            },
          }
        )

        if (stripeError) throw new Error(stripeError.message || "Payment failed")
        if (paymentIntent?.status !== "succeeded" && paymentIntent?.status !== "requires_capture") {
          throw new Error("Payment was not successful")
        }

        // Store session ID for the review step to complete the order
        sessionStorage.setItem("paymentSessionId", session.id)
      } else if (paymentMethod === "cash") {
        // For cash: just initiate session, no confirmation needed
        const { initiatePaymentSession: session } = await graphqlRequest(INITIATE_PAYMENT_SESSION, {
          cartId: cart.id,
          paymentProviderId: PAYMENT_METHOD_TO_PROVIDER.cash,
        })
        if (session?.id) {
          sessionStorage.setItem("paymentSessionId", session.id)
        }
      }

      // Move to review step
      onComplete()
    } catch (err: any) {
      console.error("Payment error:", err)
      setError(err.message || "An error occurred during payment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className={cn("flex flex-row text-3xl font-medium gap-x-2 items-baseline", { "opacity-50 pointer-events-none select-none": !isOpen })}>
          Payment
          {!isOpen && paymentMethod && <CircleCheck className="hidden sm:block h-5 w-5 text-primary" />}
        </h2>
        {!isOpen && paymentMethod && (
          <Button onClick={onEdit} data-testid="edit-payment-button" variant="outline" size="sm">Update Payment</Button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)} className="space-y-2">
              {hasCardMethod && (
                <div className="relative">
                  <RadioGroupItem value="card" id="payment-card" className="sr-only" />
                  <Label htmlFor="payment-card" className={cn("flex items-center justify-between text-sm font-normal cursor-pointer py-4 border rounded-md px-8 transition-colors", { "border-primary bg-primary/5": paymentMethod === "card", "border-border hover:border-primary/50": paymentMethod !== "card" })}>
                    <div className="flex items-center gap-x-4">
                      <div className={cn("w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors", { "border-primary": paymentMethod === "card", "border-border": paymentMethod !== "card" })}>
                        {paymentMethod === "card" && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </div>
                      <CreditCard className="h-5 w-5" />
                      <span className="text-sm font-normal">Credit / Debit Card</span>
                    </div>
                  </Label>
                </div>
              )}
              {hasPayPalMethod && (
                <div className="relative">
                  <RadioGroupItem value="paypal" id="payment-paypal" className="sr-only" />
                  <Label htmlFor="payment-paypal" className={cn("flex items-center justify-between text-sm font-normal cursor-pointer py-4 border rounded-md px-8 transition-colors", { "border-primary bg-primary/5": paymentMethod === "paypal", "border-border hover:border-primary/50": paymentMethod !== "paypal" })}>
                    <div className="flex items-center gap-x-4">
                      <div className={cn("w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors", { "border-primary": paymentMethod === "paypal", "border-border": paymentMethod !== "paypal" })}>
                        {paymentMethod === "paypal" && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </div>
                      <span className="text-lg font-bold text-blue-600">P</span>
                      <span className="text-sm font-normal">PayPal</span>
                    </div>
                  </Label>
                </div>
              )}
              {hasCashMethod && (
                <div className="relative">
                  <RadioGroupItem value="cash" id="payment-cash" className="sr-only" />
                  <Label htmlFor="payment-cash" className={cn("flex items-center justify-between text-sm font-normal cursor-pointer py-4 border rounded-md px-8 transition-colors", { "border-primary bg-primary/5": paymentMethod === "cash", "border-border hover:border-primary/50": paymentMethod !== "cash" })}>
                    <div className="flex items-center gap-x-4">
                      <div className={cn("w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors", { "border-primary": paymentMethod === "cash", "border-border": paymentMethod !== "cash" })}>
                        {paymentMethod === "cash" && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </div>
                      <DollarSign className="h-5 w-5" />
                      <span className="text-sm font-normal">Cash on Arrival</span>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Card input - only rendered on payment step */}
          {paymentMethod === "card" && (
            <div className="mt-5">
              <p className="text-base font-semibold mb-1">Enter your card details:</p>
              <div className="border border-border rounded-md p-4 mt-2">
                <CardElement
                  options={cardElementOptions}
                  onChange={(e) => {
                    if (e.brand) setCardBrand(e.brand.charAt(0).toUpperCase() + e.brand.slice(1))
                    setError(e.error?.message || null)
                    setCardComplete(e.complete)
                  }}
                />
              </div>
            </div>
          )}

          {/* PayPal button - shown inline on payment step */}
          {paymentMethod === "paypal" && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Click the PayPal button below to continue:</p>
              <PayPalButtons
                style={{ layout: "horizontal" }}
                disabled={isLoading}
                createOrder={() => {
                  // Return the amount for PayPal
                  const deliveryFee = orderType === "delivery" ? Math.round(storeInfo.deliveryFee * 100) : 0
                  const discount = orderType === "pickup" ? Math.round(subtotal * (storeInfo.pickupDiscount / 100)) : 0
                  const taxRate = (storeInfo.taxRate || 8.75) / 100
                  const tax = Math.round((subtotal - discount) * taxRate)
                  const tip = Math.round(subtotal * (tipPercent / 100))
                  const total = subtotal - discount + deliveryFee + tax + tip

                  throw new Error("PayPal integration requires backend setup")
                }}
                onApprove={async () => {
                  setIsLoading(true)
                  try {
                    await saveCustomerInfoToCart()
                    const { initiatePaymentSession: session } = await graphqlRequest(INITIATE_PAYMENT_SESSION, {
                      cartId: cart.id,
                      paymentProviderId: PAYMENT_METHOD_TO_PROVIDER.paypal,
                    })
                    if (session?.id) {
                      sessionStorage.setItem("paymentSessionId", session.id)
                    }
                    onComplete()
                  } catch (err: any) {
                    setError(err.message || "PayPal error")
                  } finally {
                    setIsLoading(false)
                  }
                }}
                onError={() => setError("PayPal encountered an error. Please try again.")}
                data-testid="paypal-payment-button"
              />
            </div>
          )}

          {/* Tip Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide">Add a Tip</h3>
            <RadioGroup value={tipPercent.toString()} onValueChange={(val) => setTipPercent(Number.parseInt(val))} className="flex gap-2">
              {[0, 15, 18, 20, 25].map((percent) => (
                <div key={percent} className="flex-1">
                  <RadioGroupItem value={percent.toString()} id={`tip-${percent}`} className="peer sr-only" />
                  <Label htmlFor={`tip-${percent}`} className="flex flex-col items-center justify-center border border-border p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center transition-colors rounded-md">
                    <span className="text-sm font-medium">{percent}%</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(subtotal * (percent / 100), currencyConfig)}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <ErrorMessage error={error} data-testid="payment-error-message" />

          {/* Continue button - for card and cash (PayPal has its own button above) */}
          {paymentMethod !== "paypal" && (
            <Button size="lg" onClick={handleContinue} disabled={!paymentMethod || isLoading || (paymentMethod === "card" && !cardComplete)} data-testid="submit-payment-button">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {paymentMethod === "card" && !cardComplete ? "Enter card details" : "Continue to Review"}
            </Button>
          )}
        </div>
      ) : (
        paymentMethod && (
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-x-8 w-full">
            <div className="flex flex-col w-full sm:w-1/3">
              <p className="text-sm font-medium mb-1">Payment Method</p>
              <p className="text-sm text-muted-foreground capitalize" data-testid="payment-method-summary">
                {paymentMethod === "card" ? "Credit / Debit Card" : paymentMethod === "paypal" ? "PayPal" : "Cash on Arrival"}
              </p>
            </div>
            <div className="flex flex-col w-full sm:w-1/3">
              <p className="text-sm font-medium mb-1">Tip</p>
              <p className="text-sm text-muted-foreground" data-testid="tip-summary">{tipPercent}% ({formatCurrency(subtotal * (tipPercent / 100), currencyConfig)})</p>
            </div>
          </div>
        )
      )}
      <Divider className="mt-8" />
    </div>
  )
}

// ─── Review Section (just finalizes the order, no card handling) ───
function ReviewSection({
  cart,
  storeInfo,
  orderType,
  customerInfo,
  paymentMethod,
  tipPercent,
}: {
  cart: any
  storeInfo: StoreInfo
  orderType: OrderType
  customerInfo: CustomerInfo
  paymentMethod: PaymentMethod
  tipPercent: number
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = cart?.subtotal || 0
  const currencyConfig = { currencyCode: storeInfo.currencyCode, locale: storeInfo.locale }
  const deliveryFee = orderType === "delivery" ? Math.round(storeInfo.deliveryFee * 100) : 0
  const discount = orderType === "pickup" ? Math.round(subtotal * (storeInfo.pickupDiscount / 100)) : 0
  const taxRate = (storeInfo.taxRate || 8.75) / 100
  const tax = Math.round((subtotal - discount) * taxRate)
  const tip = Math.round(subtotal * (tipPercent / 100))
  const total = subtotal - discount + deliveryFee + tax + tip

  const previousStepsCompleted = customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone &&
    (orderType === "pickup" || (customerInfo.address && customerInfo.city && customerInfo.zip)) && paymentMethod

  const handlePlaceOrder = async () => {
    if (!previousStepsCompleted) return
    setIsSubmitting(true)
    setError(null)

    try {
      // Get the session ID that was stored during payment step
      const paymentSessionId = sessionStorage.getItem("paymentSessionId")
      if (!paymentSessionId) throw new Error("Payment session not found. Please go back to payment step.")

      // Just complete the cart - payment was already confirmed in the payment step
      const { completeActiveCart: order } = await graphqlRequest(COMPLETE_ACTIVE_CART, {
        cartId: cart.id,
        paymentSessionId,
      })

      // Clear session storage
      sessionStorage.removeItem("paymentSessionId")

      // Navigate to confirmation
      router.push(`/order/confirmed/${order.id}`)
    } catch (err: any) {
      console.error("Order completion error:", err)
      setError(err.message || "An error occurred while placing your order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-background">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className={cn("flex flex-row text-3xl font-medium gap-x-2 items-baseline", { "opacity-50 pointer-events-none select-none": !previousStepsCompleted })}>Review</h2>
      </div>
      {previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <p className="text-sm text-foreground mb-1">By clicking the Place Order button, you confirm that you have read, understand and accept our Terms of Use, Terms of Sale and Returns Policy and acknowledge that you have read our Privacy Policy.</p>
          </div>
          <ErrorMessage error={error} data-testid="review-error-message" />
          <Button size="lg" onClick={handlePlaceOrder} disabled={isSubmitting || !previousStepsCompleted} data-testid="submit-order-button">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Place Order · {formatCurrency(total, currencyConfig)}
          </Button>
        </>
      )}
    </div>
  )
}

// ─── Checkout Summary Sidebar ─────────────────────────────────────
function CheckoutSummary({
  items,
  subtotal,
  storeInfo,
  orderType,
  tipPercent,
}: {
  items: any[]
  subtotal: number
  storeInfo: StoreInfo
  orderType: OrderType
  tipPercent: number
}) {
  const currencyConfig = { currencyCode: storeInfo.currencyCode, locale: storeInfo.locale }
  const deliveryFee = orderType === "delivery" ? Math.round(storeInfo.deliveryFee * 100) : 0
  const discount = orderType === "pickup" ? Math.round(subtotal * (storeInfo.pickupDiscount / 100)) : 0
  const taxRate = (storeInfo.taxRate || 8.75) / 100
  const tax = Math.round((subtotal - discount) * taxRate)
  const tip = Math.round(subtotal * (tipPercent / 100))
  const total = subtotal - discount + deliveryFee + tax + tip

  return (
    <div className="sticky top-0 flex flex-col gap-y-8 py-8 sm:py-0">
      <div className="w-full bg-background flex flex-col">
        <Divider className="my-6 sm:hidden" />
        <h2 className="flex flex-row text-3xl font-medium items-baseline">Order Summary</h2>
        <Divider className="my-6" />
        <div className="space-y-4 mb-6">
          {items.map((item: any) => {
            const modifiersTotal = item.modifiers?.reduce((sum: number, m: any) => sum + (m.price || 0), 0) || 0
            const itemTotal = (Number(item.menuItem?.price) + modifiersTotal) * item.quantity
            return (
              <div key={item.id} className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 bg-muted rounded-md overflow-hidden">
                  <Image src={getImageUrl(item.menuItem)} alt={item.menuItem?.name || ""} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.menuItem?.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  {item.modifiers?.length > 0 && <p className="text-xs text-muted-foreground">+ {item.modifiers.map((m: any) => m.name).join(", ")}</p>}
                </div>
                <p className="text-sm whitespace-nowrap">{formatCurrency(itemTotal, currencyConfig)}</p>
              </div>
            )
          })}
        </div>
        <Divider className="my-4" />
        <div className="flex flex-col gap-y-2 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal, currencyConfig)}</span></div>
          {discount > 0 && <div className="flex justify-between text-primary"><span>Pickup Discount</span><span>-{formatCurrency(discount, currencyConfig)}</span></div>}
          {deliveryFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>{formatCurrency(deliveryFee, currencyConfig)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(tax, currencyConfig)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tip</span><span>{formatCurrency(tip, currencyConfig)}</span></div>
        </div>
        <Divider className="my-4" />
        <div className="flex items-center justify-between mb-2 text-base font-medium"><span>Total</span><span className="text-2xl font-semibold">{formatCurrency(total, currencyConfig)}</span></div>
      </div>
    </div>
  )
}

// ─── Main Checkout Form (Client Component) ────────────────────────
export function CheckoutForm({
  cart,
  storeInfo,
  paymentConfig,
  user,
}: {
  cart: any
  storeInfo: StoreInfo
  paymentConfig: StorefrontPaymentConfig
  user?: any
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.addresses?.find((a: any) => a.isDefault)?.address1 || "",
    city: user?.addresses?.find((a: any) => a.isDefault)?.city || "",
    zip: user?.addresses?.find((a: any) => a.isDefault)?.postalCode || "",
  })

  const [orderType, setOrderType] = useState<OrderType>("pickup")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [tipPercent, setTipPercent] = useState(18)

  const currentStep = searchParams?.get("step") || "contact"

  useEffect(() => {
    if (paymentConfig) {
      if (paymentConfig.hasStripe && paymentConfig.stripePublishableKey) setPaymentMethod("card")
      else if (paymentConfig.hasPayPal && paymentConfig.paypalClientId) setPaymentMethod("paypal")
      else if (paymentConfig.hasCash) setPaymentMethod("cash")
    }
  }, [paymentConfig])

  const navigateToStep = (step: string) => router.push(`/checkout?step=${step}`, { scroll: false })

  const stripePromise = useMemo(() => {
    if (!paymentConfig?.stripePublishableKey) return null
    return loadStripe(paymentConfig.stripePublishableKey)
  }, [paymentConfig?.stripePublishableKey])

  const content = (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <ContactSection customerInfo={customerInfo} setCustomerInfo={setCustomerInfo} user={user} isOpen={currentStep === "contact"} onEdit={() => navigateToStep("contact")} onComplete={() => navigateToStep("delivery")} orderType={orderType} setOrderType={setOrderType} />
      <DeliverySection customerInfo={customerInfo} setCustomerInfo={setCustomerInfo} storeInfo={storeInfo} orderType={orderType} user={user} isOpen={currentStep === "delivery"} onEdit={() => navigateToStep("delivery")} onComplete={() => navigateToStep("payment")} />
      <PaymentSection subtotal={cart?.subtotal || 0} storeInfo={storeInfo} paymentConfig={paymentConfig} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} tipPercent={tipPercent} setTipPercent={setTipPercent} customerInfo={customerInfo} orderType={orderType} cart={cart} isOpen={currentStep === "payment"} onEdit={() => navigateToStep("payment")} onComplete={() => navigateToStep("review")} />
      <ReviewSection cart={cart} storeInfo={storeInfo} orderType={orderType} customerInfo={customerInfo} paymentMethod={paymentMethod} tipPercent={tipPercent} />
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_416px] max-w-[1440px] w-full mx-auto px-6 gap-y-8 sm:gap-x-12 xl:gap-x-40 py-12">
      <div>
        {paymentMethod === "card" && stripePromise ? (
          <Elements stripe={stripePromise}>{content}</Elements>
        ) : (
          content
        )}
      </div>
      <CheckoutSummary items={cart?.items || []} subtotal={cart?.subtotal || 0} storeInfo={storeInfo} orderType={orderType} tipPercent={tipPercent} />
    </div>
  )
}

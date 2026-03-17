"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { CreditCard, MapPin, Clock, CheckCircle2, ArrowLeft, Loader2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCartData, useClearCart } from "@/features/storefront/lib/hooks/use-cart"
import { type StoreInfo, type StorefrontPaymentConfig } from "@/features/storefront/lib/store-data"
import { createGuestUser } from "@/features/storefront/lib/data/user"
import { formatCurrency } from "@/features/storefront/lib/currency"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

type PaymentMethod = "card" | "paypal" | "cash"

// ─── OpenFront 3-tier GraphQL mutations ────────────────────────────
// Tier 1: Cart already exists (managed by use-cart hooks)
// Tier 2: initiatePaymentSession — creates payment intent with provider
// Tier 3: completeActiveCart — verifies payment, converts cart → order

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
  mutation CompleteActiveCart($cartId: ID!) {
    completeActiveCart(cartId: $cartId) {
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

const PAYMENT_METHOD_TO_PROVIDER: Record<PaymentMethod, string> = {
  card: "pp_stripe",
  paypal: "pp_paypal",
  cash: "pp_manual",
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  orderType: "pickup" | "delivery"
  storeInfo: StoreInfo
  user?: any
  paymentConfig: StorefrontPaymentConfig
}

type CheckoutStep = "details" | "payment" | "confirmation"

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  city?: string
  zip?: string
}

function CheckoutForm({ 
  orderType, 
  storeInfo, 
  onClose,
  onSuccess,
  paymentMethod,
  setPaymentMethod,
  user,
  hasCardMethod,
  hasPayPalMethod,
  hasCashMethod,
}: { 
  orderType: "pickup" | "delivery"
  storeInfo: StoreInfo
  onClose: () => void
  onSuccess: (orderId: string) => void
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  user?: any
  hasCardMethod: boolean
  hasPayPalMethod: boolean
  hasCashMethod: boolean
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { subtotal, items } = useCartData()
  const clearCart = useClearCart()
  const currencyConfig = { currencyCode: storeInfo.currencyCode, locale: storeInfo.locale }
  const paypalCurrency = (storeInfo.currencyCode || "USD").toUpperCase()
  
  const [step, setStep] = useState<CheckoutStep>("details")
  const [tipPercent, setTipPercent] = useState(18)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: user?.name?.split(' ')[0] || "",
    lastName: user?.name?.split(' ').slice(1).join(' ') || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.addresses?.find((a: any) => a.isDefault)?.address1 || "",
    city: user?.addresses?.find((a: any) => a.isDefault)?.city || "",
    zip: user?.addresses?.find((a: any) => a.isDefault)?.postalCode || "",
  })

  // Sync customerInfo when user prop changes (e.g. login status)
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        firstName: user.name?.split(' ')[0] || "",
        lastName: user.name?.split(' ').slice(1).join(' ') || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.addresses?.find((a: any) => a.isDefault)?.address1 || "",
        city: user.addresses?.find((a: any) => a.isDefault)?.city || "",
        zip: user.addresses?.find((a: any) => a.isDefault)?.postalCode || "",
      })
    }
  }, [user])

  // Calculations are in cents
  const deliveryFee = orderType === "delivery" ? Math.round(storeInfo.deliveryFee * 100) : 0
  const discount = orderType === "pickup" ? Math.round(subtotal * (storeInfo.pickupDiscount / 100)) : 0
  const taxRate = (storeInfo.taxRate || 8.75) / 100
  const tax = Math.round((subtotal - discount) * taxRate)
  const tip = Math.round((subtotal - discount) * (tipPercent / 100))
  const total = subtotal - discount + deliveryFee + tax + tip

  // ─── Shared: persist customer info on cart + initiate payment session ───
  const { cartId } = useCartData()

  const saveCustomerInfoToCart = async () => {
    if (!cartId) throw new Error("No cart found")
    await graphqlRequest(UPDATE_CART_CUSTOMER_INFO, {
      cartId,
      data: {
        email: customerInfo.email,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerPhone: customerInfo.phone,
        orderType,
        tipPercent: String(tipPercent),
        ...(orderType === "delivery"
          ? {
              deliveryAddress: customerInfo.address || "",
              deliveryCity: customerInfo.city || "",
              deliveryZip: customerInfo.zip || "",
            }
          : {}),
      },
    })
  }

  const initiateSession = async (method: PaymentMethod) => {
    if (!cartId) throw new Error("No cart found")
    const providerCode = PAYMENT_METHOD_TO_PROVIDER[method]
    const { initiatePaymentSession: session } = await graphqlRequest(
      INITIATE_PAYMENT_SESSION,
      { cartId, paymentProviderId: providerCode }
    )
    return session // { id, data: { clientSecret?, paymentIntentId?, providerCode }, amount }
  }

  const completeCart = async () => {
    if (!cartId) throw new Error("No cart found")
    const { completeActiveCart: order } = await graphqlRequest(
      COMPLETE_ACTIVE_CART,
      { cartId }
    )
    return order // { id, orderNumber, secretKey, status }
  }

  // ─── Handle card payment (Stripe) — OpenFront 3-tier ─────────────
  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      setError("Payment system not ready. Please try again.")
      return
    }
    const card = elements.getElement(CardElement)
    if (!card) { setError("Card element not found."); return }

    setIsSubmitting(true)
    setError(null)

    try {
      // Tier 1: save customer info on cart
      await saveCustomerInfoToCart()

      // Tier 2: create Stripe PaymentIntent via adapter
      const session = await initiateSession("card")
      const clientSecret = session?.data?.clientSecret

      if (!clientSecret) throw new Error("Failed to create payment session")

      // Client-side Stripe confirmation
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
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

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
        // Tier 3: verify payment + convert cart → order
        const order = await completeCart()
        clearCart()
        onSuccess(order.id)
      } else {
        throw new Error("Payment was not successful. Please try again.")
      }
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err.message || "An error occurred during checkout")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Handle PayPal payment — OpenFront 3-tier ────────────────────
  const handlePayPalApprove = async (details: any) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await saveCustomerInfoToCart()
      await initiateSession("paypal")
      const order = await completeCart()
      clearCart()
      onSuccess(order.id)
    } catch (err: any) {
      console.error("PayPal checkout error:", err)
      setError(err.message || "An error occurred during checkout")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Handle cash/pay at counter — OpenFront 3-tier ───────────────
  const handleCashPayment = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await saveCustomerInfoToCart()
      await initiateSession("cash")
      const order = await completeCart()
      clearCart()
      onSuccess(order.id)
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err.message || "An error occurred during checkout")
    } finally {
      setIsSubmitting(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: true,
  }

  const isDetailsValid = customerInfo.firstName && customerInfo.lastName && 
    customerInfo.email && customerInfo.phone &&
    (orderType === "pickup" || (customerInfo.address && customerInfo.city && customerInfo.zip))

  const handleContinueToPayment = async () => {
    if (!isDetailsValid) return

    // If user is already authenticated, skip guest auth
    if (user) {
      setStep("payment")
      return
    }

    // Guest checkout — try to create an account with this email
    setIsCreatingAccount(true)
    setAuthError(null)

    const result = await createGuestUser({
      email: customerInfo.email,
      name: `${customerInfo.firstName} ${customerInfo.lastName}`,
      phone: customerInfo.phone,
    })

    setIsCreatingAccount(false)

    if (!result.success) {
      setAuthError(result.error || "Could not proceed. Please try again.")
      return
    }

    setStep("payment")
  }

  return (
    <>
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-4">
          {step === "payment" && (
            <button onClick={() => setStep("details")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="font-serif text-2xl">{step === "details" ? "Checkout" : "Payment"}</h2>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {step === "details" ? (
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wide">Contact</h3>
              {!user && (
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/account" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    className="mt-1 border-border"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    className="mt-1 border-border"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  className="mt-1 border-border"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="(555) 123-4567" 
                  className="mt-1 border-border"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Delivery Address */}
            {orderType === "delivery" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </h3>
                </div>

                {user && user.addresses?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Use a saved address:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {user.addresses.map((address: any) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => setCustomerInfo(prev => ({
                            ...prev,
                            address: address.address1 || "",
                            city: address.city || "",
                            zip: address.postalCode || "",
                          }))}
                          className={cn(
                            "text-left p-3 border rounded-md text-sm transition-colors hover:bg-muted",
                            customerInfo.address === address.address1 ? "border-primary bg-muted/50" : "border-border"
                          )}
                        >
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
                  <Input 
                    id="address" 
                    placeholder="123 Main St" 
                    className="mt-1 border-border"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                    <Input 
                      id="city" 
                      placeholder="Brooklyn" 
                      className="mt-1 border-border"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip" className="text-xs text-muted-foreground">ZIP</Label>
                    <Input 
                      id="zip" 
                      placeholder="11201" 
                      className="mt-1 border-border"
                      value={customerInfo.zip}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, zip: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Location */}
            {orderType === "pickup" && (
              <div className="bg-muted p-4">
                <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  Pickup Location
                </h3>
                <p className="text-sm">{storeInfo.address}</p>
                <p className="text-sm text-muted-foreground mt-1">Ready in {storeInfo.estimatedPickup}</p>
              </div>
            )}

            {authError && (
              <p className="text-sm text-destructive">{authError}</p>
            )}

            <Button
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
              onClick={handleContinueToPayment}
              disabled={!isDetailsValid || isCreatingAccount}
            >
              {isCreatingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </h3>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                className="grid grid-cols-3 gap-3"
              >
                {hasCardMethod && (
                  <div>
                    <RadioGroupItem value="card" id="payment-card" className="peer sr-only" />
                    <Label
                      htmlFor="payment-card"
                      className="flex flex-col items-center justify-center border border-border p-4 hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted cursor-pointer text-center transition-colors rounded-md"
                    >
                      <CreditCard className="h-5 w-5 mb-2" />
                      <span className="text-sm font-medium">Card</span>
                    </Label>
                  </div>
                )}
                {hasPayPalMethod && (
                  <div>
                    <RadioGroupItem value="paypal" id="payment-paypal" className="peer sr-only" />
                    <Label
                      htmlFor="payment-paypal"
                      className="flex flex-col items-center justify-center border border-border p-4 hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted cursor-pointer text-center transition-colors rounded-md"
                    >
                      <span className="text-lg font-bold text-blue-600 mb-1">P</span>
                      <span className="text-sm font-medium">PayPal</span>
                    </Label>
                  </div>
                )}
                {hasCashMethod && (
                  <div>
                    <RadioGroupItem value="cash" id="payment-cash" className="peer sr-only" />
                    <Label
                      htmlFor="payment-cash"
                      className="flex flex-col items-center justify-center border border-border p-4 hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted cursor-pointer text-center transition-colors rounded-md"
                    >
                      <DollarSign className="h-5 w-5 mb-2" />
                      <span className="text-sm font-medium">Cash</span>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Card Payment Form */}
            {paymentMethod === "card" && (
              <div className="border border-border rounded-md p-4">
                <CardElement 
                  options={cardElementOptions}
                  onChange={(e) => {
                    setCardComplete(e.complete)
                    if (e.error) {
                      setError(e.error.message)
                    } else {
                      setError(null)
                    }
                  }}
                />
              </div>
            )}

            {/* PayPal Button */}
            {paymentMethod === "paypal" && hasPayPalMethod && (
              <div className="border border-border rounded-md p-4">
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", label: "pay" }}
                  disabled={isSubmitting}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: {
                          currency_code: paypalCurrency,
                          value: (total / 100).toFixed(2),
                        },
                      }],
                    })
                  }}
                  onApprove={async (data, actions) => {
                    const details = await actions.order?.capture()
                    await handlePayPalApprove(details)
                  }}
                  onError={(err) => {
                    setError("PayPal encountered an error. Please try again.")
                  }}
                />
              </div>
            )}

            {/* Cash Payment Info */}
            {paymentMethod === "cash" && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Pay with cash when you pick up your order or when it's delivered.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Tip Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wide">Add a Tip</h3>
              <RadioGroup
                value={tipPercent.toString()}
                onValueChange={(val) => setTipPercent(Number.parseInt(val))}
                className="flex gap-2"
              >
                {[0, 15, 18, 20, 25].map((percent) => (
                  <div key={percent} className="flex-1">
                    <RadioGroupItem value={percent.toString()} id={`tip-${percent}`} className="peer sr-only" />
                    <Label
                      htmlFor={`tip-${percent}`}
                      className="flex flex-col items-center justify-center border border-border p-3 hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted cursor-pointer text-center transition-colors"
                    >
                      <span className="text-sm font-medium">{percent}%</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency((subtotal - discount) * (percent / 100), currencyConfig)}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Order Summary */}
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({items.length})</span>
                <span>{formatCurrency(subtotal, currencyConfig)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Pickup Discount</span>
                  <span>-{formatCurrency(discount, currencyConfig)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatCurrency(deliveryFee, currencyConfig)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(tax, currencyConfig)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tip</span>
                <span>{formatCurrency(tip, currencyConfig)}</span>
              </div>
              <div className="flex justify-between font-serif text-lg pt-4 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(total, currencyConfig)}</span>
              </div>
            </div>

            {/* Place Order Button - only show for card and cash (PayPal has its own button) */}
            {paymentMethod !== "paypal" && (
              <Button
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
                onClick={paymentMethod === "card" ? handleCardPayment : handleCashPayment}
                disabled={isSubmitting || (paymentMethod === "card" && !cardComplete)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {paymentMethod === "cash" ? "Place Order (Pay on Arrival)" : `Place Order · ${formatCurrency(total, currencyConfig)}`}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function OrderConfirmation({ 
  orderNumber, 
  orderType, 
  storeInfo, 
  onClose 
}: { 
  orderNumber: string
  orderType: "pickup" | "delivery"
  storeInfo: StoreInfo
  onClose: () => void
}) {
  return (
    <div className="p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-serif text-3xl mb-2">Order Confirmed</h2>
      <p className="text-muted-foreground mb-6">Order #{orderNumber}</p>
      <div className="bg-muted p-4 mb-8">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            Estimated {orderType === "pickup" ? "pickup" : "delivery"}:{" "}
            <strong>{orderType === "pickup" ? storeInfo.estimatedPickup : storeInfo.estimatedDelivery}</strong>
          </span>
        </div>
      </div>
      <Button
        onClick={onClose}
        className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
      >
        Done
      </Button>
    </div>
  )
}

export function StripeCheckoutModal({ isOpen, onClose, orderType, storeInfo, user, paymentConfig }: CheckoutModalProps) {
  const router = useRouter()

  const stripePromise = useMemo(
    () => paymentConfig.stripePublishableKey ? loadStripe(paymentConfig.stripePublishableKey) : null,
    [paymentConfig.stripePublishableKey]
  )

  const hasCardMethod = !!(paymentConfig.hasStripe && stripePromise)
  const hasPayPalMethod = !!(paymentConfig.hasPayPal && paymentConfig.paypalClientId)
  const hasCashMethod = paymentConfig.hasCash

  const getDefaultPaymentMethod = (): PaymentMethod => {
    if (hasCardMethod) return 'card'
    if (hasPayPalMethod) return 'paypal'
    return 'cash'
  }

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod)

  useEffect(() => {
    if (paymentMethod === 'card' && !hasCardMethod) {
      setPaymentMethod(hasPayPalMethod ? 'paypal' : 'cash')
      return
    }

    if (paymentMethod === 'paypal' && !hasPayPalMethod) {
      setPaymentMethod(hasCardMethod ? 'card' : 'cash')
      return
    }

    if (paymentMethod === 'cash' && !hasCashMethod) {
      setPaymentMethod(hasCardMethod ? 'card' : 'paypal')
    }
  }, [paymentMethod, hasCardMethod, hasPayPalMethod, hasCashMethod])

  const handleSuccess = (orderId: string) => {
    onClose()
    router.push(`/order/confirmed/${orderId}`)
  }

  const handleClose = () => {
    onClose()
  }

  const hasAnyPaymentMethod = hasCardMethod || hasPayPalMethod || hasCashMethod

  const renderCheckoutContent = () => {
    if (!hasAnyPaymentMethod) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Payment system is not configured. Please contact support.</p>
          <Button onClick={handleClose} className="mt-4">Close</Button>
        </div>
      )
    }

    const formContent = (
      <Elements stripe={stripePromise}>
        <CheckoutForm 
          orderType={orderType} 
          storeInfo={storeInfo} 
          onClose={handleClose}
          onSuccess={handleSuccess}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          user={user}
          hasCardMethod={hasCardMethod}
          hasPayPalMethod={hasPayPalMethod}
          hasCashMethod={hasCashMethod}
        />
      </Elements>
    )

    if (hasPayPalMethod && paymentConfig.paypalClientId) {
      return (
        <PayPalScriptProvider
          options={{
            clientId: paymentConfig.paypalClientId,
            currency: (storeInfo.currencyCode || "USD").toUpperCase(),
            intent: "capture",
            components: "buttons",
          }}
        >
          {formContent}
        </PayPalScriptProvider>
      )
    }

    return formContent
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 bg-background flex flex-col max-h-[90vh]">
        {renderCheckoutContent()}
      </DialogContent>
    </Dialog>
  )
}

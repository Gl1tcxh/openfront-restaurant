"use client"

import { useState } from "react"
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
import { useCart } from "@/features/storefront/lib/cart-context"
import { type StoreInfo } from "@/features/storefront/lib/store-data"
import { formatCurrency } from "@/features/storefront/lib/currency"
import Link from "next/link"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

type PaymentMethod = "card" | "paypal" | "cash"

// GraphQL mutation for creating storefront order
const CREATE_STOREFRONT_ORDER_MUTATION = `
  mutation CreateStorefrontOrder(
    $orderType: String!
    $customerInfo: CustomerInfoInput!
    $deliveryAddress: DeliveryAddressInput
    $items: [StorefrontOrderItemInput!]!
    $subtotal: Int!
    $tax: Int!
    $tip: Int!
    $total: Int!
    $currencyCode: String
    $specialInstructions: String
  ) {
    createStorefrontOrder(
      orderType: $orderType
      customerInfo: $customerInfo
      deliveryAddress: $deliveryAddress
      items: $items
      subtotal: $subtotal
      tax: $tax
      tip: $tip
      total: $total
      currencyCode: $currencyCode
      specialInstructions: $specialInstructions
    ) {
      success
      orderId
      orderNumber
      clientSecret
      error
    }
  }
`

// GraphQL mutation for completing order after payment confirmation
const COMPLETE_STOREFRONT_ORDER_MUTATION = `
  mutation CompleteStorefrontOrder($orderId: String!) {
    completeStorefrontOrder(orderId: $orderId) {
      success
      orderNumber
      error
    }
  }
`

async function createStorefrontOrderGraphQL(variables: {
  orderType: string
  customerInfo: { name: string; email: string; phone: string }
  deliveryAddress?: { address: string; city: string; zip: string } | null
  items: { menuItemId: string; quantity: number; price: number; specialInstructions?: string; modifierIds?: string[] }[]
  subtotal: number
  tax: number
  tip: number
  total: number
  specialInstructions?: string
  currencyCode?: string
}) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: CREATE_STOREFRONT_ORDER_MUTATION,
      variables,
    }),
  })

  const result = await response.json()
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error")
  }
  
  return result.data.createStorefrontOrder
}

async function completeStorefrontOrderGraphQL(orderId: string) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: COMPLETE_STOREFRONT_ORDER_MUTATION,
      variables: { orderId },
    }),
  })

  const result = await response.json()
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error")
  }
  
  return result.data.completeStorefrontOrder
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  orderType: "pickup" | "delivery"
  storeInfo: StoreInfo
  user?: any
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
}: { 
  orderType: "pickup" | "delivery"
  storeInfo: StoreInfo
  onClose: () => void
  onSuccess: (orderId: string) => void
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  user?: any
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { subtotal, items, clearCart } = useCart()
  const currencyConfig = { currencyCode: storeInfo.currencyCode, locale: storeInfo.locale }
  const paypalCurrency = (storeInfo.currencyCode || "USD").toUpperCase()
  
  const [step, setStep] = useState<CheckoutStep>("details")
  const [tipPercent, setTipPercent] = useState(18)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  
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
  const tax = Math.round((subtotal - discount) * 0.0875)
  const tip = Math.round((subtotal - discount) * (tipPercent / 100))
  const total = subtotal - discount + deliveryFee + tax + tip

  // Create order data helper
  const createOrderData = () => ({
    orderType,
    customerInfo: {
      name: `${customerInfo.firstName} ${customerInfo.lastName}`,
      email: customerInfo.email,
      phone: customerInfo.phone,
    },
    deliveryAddress: orderType === "delivery" ? {
      address: customerInfo.address || "",
      city: customerInfo.city || "",
      zip: customerInfo.zip || "",
    } : null,
    items: items.map(item => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
      price: Number(item.menuItem.price), // In cents
      specialInstructions: item.specialInstructions,
      modifierIds: item.modifiers.map(m => m.modifierId),
    })),
    subtotal: Math.round(subtotal),
    tax: Math.round(tax),
    tip: Math.round(tip),
    total: Math.round(total),
  })

  // Handle card payment (Stripe)
  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      setError("Payment system not ready. Please try again.")
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      setError("Card element not found.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const orderData = await createStorefrontOrderGraphQL({
        ...createOrderData(),
        currencyCode: storeInfo.currencyCode,
      })

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      if (orderData.clientSecret) {
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          orderData.clientSecret,
          {
            payment_method: {
              card: card,
              billing_details: {
                name: `${customerInfo.firstName} ${customerInfo.lastName}`,
                email: customerInfo.email,
              },
            },
          }
        )

        if (stripeError) {
          throw new Error(stripeError.message || "Payment failed")
        }

        if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
          const completeResult = await completeStorefrontOrderGraphQL(orderData.orderId)
          if (!completeResult.success) {
            throw new Error(completeResult.error || "Failed to complete order")
          }
          clearCart()
          onSuccess(orderData.orderId)
        } else {
          throw new Error("Payment was not successful. Please try again.")
        }
      } else {
        clearCart()
        onSuccess(orderData.orderId)
      }
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err.message || "An error occurred during checkout")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle PayPal payment
  const handlePayPalApprove = async (details: any) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Create order in our system
      const orderData = await createStorefrontOrderGraphQL({
        ...createOrderData(),
        currencyCode: storeInfo.currencyCode,
      })
      
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // PayPal already captured the payment, just complete the order
      const completeResult = await completeStorefrontOrderGraphQL(orderData.orderId)
      if (!completeResult.success) {
        throw new Error(completeResult.error || "Failed to complete order")
      }
      
      clearCart()
      onSuccess(orderData.orderId)
    } catch (err: any) {
      console.error("PayPal checkout error:", err)
      setError(err.message || "An error occurred during checkout")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cash/pay at counter
  const handleCashPayment = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const orderData = await createStorefrontOrderGraphQL({
        ...createOrderData(),
        currencyCode: storeInfo.currencyCode,
      })
      
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      clearCart()
      onSuccess(orderData.orderId)
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

            <Button
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
              onClick={() => setStep("payment")}
              disabled={!isDetailsValid}
            >
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
                {stripePromise && (
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
                {paypalClientId && (
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
            {paymentMethod === "paypal" && paypalClientId && (
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

export function StripeCheckoutModal({ isOpen, onClose, orderType, storeInfo, user }: CheckoutModalProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    stripePromise ? "card" : paypalClientId ? "paypal" : "cash"
  )

  const handleSuccess = (orderId: string) => {
    onClose()
    router.push(`/order/confirmed/${orderId}`)
  }

  const handleClose = () => {
    onClose()
  }

  // Determine available payment methods
  const hasAnyPaymentMethod = stripePromise || paypalClientId || true // cash is always available

  const renderCheckoutContent = () => {
    if (!hasAnyPaymentMethod) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Payment system is not configured. Please contact support.</p>
          <Button onClick={handleClose} className="mt-4">Close</Button>
        </div>
      )
    }

    // Wrap with PayPalScriptProvider if PayPal is available
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
        />
      </Elements>
    )

    if (paypalClientId) {
      return (
        <PayPalScriptProvider
          options={{
            clientId: paypalClientId,
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

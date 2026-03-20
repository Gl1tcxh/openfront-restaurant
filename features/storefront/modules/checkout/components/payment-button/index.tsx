"use client"

import { isManual, isStripe, isPaypal } from "@/features/storefront/lib/constants"
import { placeOrder } from "@/features/storefront/lib/data/cart"
import { Button } from "@/components/ui/button"
import { useElements, useStripe, CardElement } from "@stripe/react-stripe-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import React, { useState } from "react"
import { RiLoader2Fill } from "@remixicon/react"
import { useRouter } from "next/navigation"

interface PaymentButtonProps {
  cart: {
    id: string
    customerName?: string
    customerPhone?: string
    email?: string
    orderType?: string
    deliveryAddress?: string
    deliveryCity?: string
    deliveryZip?: string
    paymentCollection?: {
      paymentSessions?: {
        id: string
        isSelected: boolean
        paymentProvider?: {
          code: string
        }
        data?: {
          clientSecret?: string
          orderId?: string
        }
      }[]
    }
  }
  "data-testid"?: string
}


const ErrorMessage = ({ error, "data-testid": dataTestId }: { error?: string | null; "data-testid"?: string }) => {
  if (!error) return null
  return (
    <div className="pt-2 text-rose-500 text-xs leading-5 font-normal" data-testid={dataTestId}>
      <span>{error}</span>
    </div>
  )
}


const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const paymentSession = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected
  )

  switch (true) {
    case isStripe(paymentSession?.paymentProvider?.code):
      return <StripePaymentButton cart={cart} data-testid={dataTestId} />
    case isPaypal(paymentSession?.paymentProvider?.code):
      return <PayPalPaymentButton cart={cart} data-testid={dataTestId} />
    case isManual(paymentSession?.paymentProvider?.code):
      return <ManualPaymentButton cart={cart} data-testid={dataTestId} />
    default:
      return <Button disabled size="lg">Select a payment method</Button>
  }
}

const StripePaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const session = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected && isStripe(s.paymentProvider?.code)
  )

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const card = elements?.getElement(CardElement)

      if (!stripe || !elements || !card || !session?.data?.clientSecret || !session.id) {
        throw new Error("Stripe not initialized or payment session not found.")
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        session.data.clientSecret,
        {
          payment_method: {
            card,
            billing_details: {
              name: cart.customerName || undefined,
              email: cart.email || undefined,
              phone: cart.customerPhone || undefined,
            },
          },
        }
      )

      if (confirmError) {
        throw new Error(confirmError.message || "Payment confirmation failed.")
      }

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
        const result = await placeOrder(session.id)
        if (result && typeof result === "object" && "success" in result && result.success && "redirectTo" in result) {
          router.push(result.redirectTo as string)
          return
        }
      }

      throw new Error("Payment was not successful. Please try again.")
    } catch (err: any) {
      console.error("Stripe payment error:", err)
      setErrorMessage(err.message || "An error occurred during payment processing.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={submitting}
        onClick={handlePayment}
        size="lg"
        data-testid={dataTestId || "submit-order-button"}
      >
        {submitting && <RiLoader2Fill className="mr-2 h-4 w-4 animate-spin" />}
        Place Order
      </Button>
      <ErrorMessage error={errorMessage} data-testid="stripe-payment-error-message" />
    </>
  )
}

const ManualPaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const session = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected && isManual(s.paymentProvider?.code)
  )

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (!session?.id) {
        throw new Error("Payment session not found. Please refresh and try again.")
      }

      const result = await placeOrder(session.id)
      if (result && typeof result === "object" && "success" in result && result.success && "redirectTo" in result) {
        router.push(result.redirectTo as string)
      }
    } catch (err: any) {
      console.error("Manual payment error:", err)
      setErrorMessage(err.message || "An error occurred during payment processing.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={submitting}
        onClick={handlePayment}
        size="lg"
        data-testid={dataTestId || "submit-order-button"}
      >
        {submitting && <RiLoader2Fill className="mr-2 h-4 w-4 animate-spin" />}
        Place Order
      </Button>
      <ErrorMessage error={errorMessage} data-testid="cash-payment-error-message" />
    </>
  )
}

const PayPalPaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const session = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected && isPaypal(s.paymentProvider?.code)
  )

  const [{ isPending }] = usePayPalScriptReducer()

  const handleApprove = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (!session?.id) {
        throw new Error("PayPal payment session not found.")
      }

      const result = await placeOrder(session.id)
      if (result && typeof result === "object" && "success" in result && result.success && "redirectTo" in result) {
        router.push(result.redirectTo as string)
      }
    } catch (err: any) {
      console.error("PayPal payment error:", err)
      setErrorMessage(err.message || "An error occurred during payment processing.")
    } finally {
      setSubmitting(false)
    }
  }

  if (isPending) {
    return <RiLoader2Fill className="animate-spin" />
  }

  if (!session?.data?.orderId) {
    return <ErrorMessage error="PayPal order ID not found." data-testid="paypal-payment-error-message" />
  }

  return (
    <>
      <PayPalButtons
        style={{ layout: "horizontal" }}
        createOrder={async () => session.data?.orderId as string}
        onApprove={handleApprove}
        disabled={submitting || isPending}
        data-testid={dataTestId || "paypal-payment-button"}
      />
      <ErrorMessage error={errorMessage} data-testid="paypal-payment-error-message" />
    </>
  )
}

export default PaymentButton

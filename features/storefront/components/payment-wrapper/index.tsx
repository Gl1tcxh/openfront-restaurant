"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { isStripe, isPaypal } from "@/features/storefront/lib/constants"

interface PaymentWrapperProps {
  paymentMethod?: string;
  clientSecret?: string;
  currency?: string;
  children: React.ReactNode;
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ 
  paymentMethod,
  clientSecret,
  currency = "usd",
  children 
}) => {
  if (isStripe(paymentMethod) && stripePromise && clientSecret) {
    return (
      <StripeWrapper
        clientSecret={clientSecret}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  if (isPaypal(paymentMethod) && paypalClientId) {
    return (
      <PayPalScriptProvider
        options={{
          clientId: paypalClientId,
          currency: currency.toUpperCase(),
          intent: "capture",
          components: "buttons",
        }}
      >
        {children}
      </PayPalScriptProvider>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper

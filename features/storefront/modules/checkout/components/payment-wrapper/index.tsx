"use client"

import { loadStripe } from "@stripe/stripe-js"
import React, { useMemo } from "react"
import StripeWrapper from "./stripe-wrapper"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { isStripe, isPaypal } from "@/features/storefront/lib/constants"

interface PaymentWrapperProps {
  cart: {
    paymentCollection?: {
      paymentSessions?: {
        isSelected: boolean;
        paymentProvider?: {
          code: string;
        };
        data?: {
          clientSecret?: string;
        }
      }[];
    };
    currencyCode?: string;
  };
  paymentConfig: {
    hasStripe: boolean;
    hasPayPal: boolean;
    hasCash: boolean;
    stripePublishableKey: string | null;
    paypalClientId: string | null;
  };
  children: React.ReactNode
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({
  cart,
  paymentConfig,
  children,
}) => {
  const paymentSession = cart.paymentCollection?.paymentSessions?.find(
    (s) => s.isSelected
  )
  const stripeKey = paymentConfig.stripePublishableKey
  const stripePromise = useMemo(
    () => (stripeKey ? loadStripe(stripeKey) : null),
    [stripeKey]
  )
  const paypalClientId = paymentConfig.paypalClientId

  let content = children

  if (paymentConfig.hasStripe && stripePromise) {
    content = (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {content}
      </StripeWrapper>
    )
  }

  if (
    isPaypal(paymentSession?.paymentProvider?.code) &&
    paypalClientId &&
    cart
  ) {
    content = (
      <PayPalScriptProvider
        options={{
          clientId: paypalClientId,
          currency: (cart.currencyCode || "USD").toUpperCase(),
          intent: "authorize",
          components: "buttons",
        }}
      >
        {content}
      </PayPalScriptProvider>
    )
  }

  return <div>{content}</div>
}

export default PaymentWrapper

"use client";
import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { createContext } from "react"

export const StripeContext = createContext(false)

interface StripeWrapperProps {
  paymentSession?: {
    data?: {
      clientSecret?: string;
    };
  };
  stripeKey: string | null | undefined;
  stripePromise: any;
  children: React.ReactNode;
}

const StripeWrapper = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}: StripeWrapperProps) => {
  const options = paymentSession?.data?.clientSecret
    ? {
        clientSecret: paymentSession.data.clientSecret,
      }
    : undefined

  if (!stripeKey) {
    throw new Error(
      "Stripe key is missing. Make sure storefront payment config includes a Stripe publishable key."
    )
  }

  if (!stripePromise) {
    throw new Error(
      "Stripe promise is missing. Make sure you have provided a valid Stripe key."
    )
  }

  return (
    <StripeContext.Provider value={true}>
      <Elements options={options} stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper

import React from "react"
import { CreditCard, DollarSign } from "lucide-react"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard className="w-5 h-5" />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <CreditCard className="w-5 h-5" />,
  },
  pp_system_default: {
    title: "Cash",
    icon: <DollarSign className="w-5 h-5" />,
  },
  // Restaurant-specific payment methods
  cash: {
    title: "Cash",
    icon: <DollarSign className="w-5 h-5" />,
  },
  credit_card: {
    title: "Credit Card",
    icon: <CreditCard className="w-5 h-5" />,
  },
  gift_card: {
    title: "Gift Card",
    icon: <CreditCard className="w-5 h-5" />,
  },
}

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe_")
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Detect if we're in sandbox/test mode
// Stripe: test keys start with "pk_test_" or "sk_test_"
// PayPal: sandbox mode uses PAYPAL_SANDBOX=true env var (since PayPal uses different endpoints, not key prefixes)
export const isStripeSandbox = () => {
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY || ""
  return stripeKey.startsWith("pk_test_")
}

export const isPayPalSandbox = () => {
  // PayPal sandbox is controlled by NEXT_PUBLIC_PAYPAL_SANDBOX env var
  // Default to true if not set (safer for demos)
  const sandboxEnv = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX
  return sandboxEnv !== "false"
}

// Check if any payment provider is in sandbox/test mode
export const isPaymentSandboxMode = () => {
  return isStripeSandbox() || isPayPalSandbox()
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

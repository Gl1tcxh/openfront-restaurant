import React from "react"
import { CreditCard, DollarSign } from "lucide-react"

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

export const isStripe = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe_")
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

export const isStripeSandbox = () => {
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY || ""
  return stripeKey.startsWith("pk_test_")
}

export const isPayPalSandbox = () => {
  const sandboxEnv = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX
  return sandboxEnv !== "false"
}

export const isPaymentSandboxMode = () => {
  return isStripeSandbox() || isPayPalSandbox()
}

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

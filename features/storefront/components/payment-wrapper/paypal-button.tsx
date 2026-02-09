"use client"

import React, { useState } from "react"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { Loader2 } from "lucide-react"

interface PayPalPaymentButtonProps {
  amount: number;
  currency?: string;
  orderId?: string;
  onSuccess: (details: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export function PayPalPaymentButton({
  amount,
  currency = "USD",
  orderId,
  onSuccess,
  onError,
  disabled = false,
}: PayPalPaymentButtonProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer()
  const [error, setError] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (isRejected) {
    return (
      <div className="text-sm text-destructive p-4">
        Failed to load PayPal. Please try again later.
      </div>
    )
  }

  return (
    <div className="w-full">
      <PayPalButtons
        style={{ 
          layout: "vertical",
          shape: "rect",
          label: "pay",
        }}
        disabled={disabled}
        createOrder={async (data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: currency.toUpperCase(),
                  value: amount.toFixed(2),
                },
                custom_id: orderId,
              },
            ],
          })
        }}
        onApprove={async (data, actions) => {
          try {
            const details = await actions.order?.capture()
            onSuccess(details)
          } catch (err: any) {
            setError(err.message || "Payment failed")
            onError?.(err)
          }
        }}
        onError={(err) => {
          setError("PayPal encountered an error")
          onError?.(err)
        }}
        onCancel={() => {
          setError("Payment was cancelled")
        }}
      />
      {error && (
        <div className="mt-2 text-sm text-destructive">{error}</div>
      )}
    </div>
  )
}

export default PayPalPaymentButton

import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  text,
  relationship,
  select,
  timestamp,
  decimal,
  checkbox,
  integer
} from "@keystone-6/core/fields";

import { isSignedIn } from "../access";
import { trackingFields } from "./trackingFields";

export const Payment = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
  },
  ui: {
    listView: {
      initialColumns: ["amount", "status", "paymentMethod", "order", "createdAt"],
    },
  },
  fields: {
    amount: integer({
      validation: { isRequired: true },
      ui: {
        description: "Payment amount in cents",
      },
    }),

    status: select({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Succeeded", value: "succeeded" },
        { label: "Failed", value: "failed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Refunded", value: "refunded" },
        { label: "Partially Refunded", value: "partially_refunded" },
      ],
      defaultValue: "pending",
      validation: { isRequired: true },
    }),

    paymentMethod: select({
      type: "string",
      options: [
        { label: "Credit Card", value: "credit_card" },
        { label: "Debit Card", value: "debit_card" },
        { label: "Cash", value: "cash" },
        { label: "Gift Card", value: "gift_card" },
        { label: "Apple Pay", value: "apple_pay" },
        { label: "Google Pay", value: "google_pay" },
      ],
      defaultValue: "credit_card",
    }),

    paymentProvider: relationship({
      ref: "PaymentProvider",
      ui: {
        displayMode: "select",
        description: "Optional provider backing this payment",
      },
    }),

    providerPaymentId: text({
      ui: {
        description: "Provider payment identifier (Stripe/PayPal/etc.)",
      },
    }),

    // Stripe integration fields
    stripePaymentIntentId: text({
      isIndexed: 'unique',
      ui: {
        description: "Stripe PaymentIntent ID",
      },
    }),

    stripeChargeId: text({
      ui: {
        description: "Stripe Charge ID for successful payments",
      },
    }),

    stripeRefundId: text({
      ui: {
        description: "Stripe Refund ID if refunded",
      },
    }),

    // Card details (last 4 digits for reference)
    cardLast4: text({
      ui: {
        description: "Last 4 digits of card",
      },
    }),

    cardBrand: text({
      ui: {
        description: "Card brand (visa, mastercard, etc.)",
      },
    }),

    // Tip handling
    tipAmount: integer({
      defaultValue: 0,
      ui: {
        description: "Tip amount included in payment in cents",
      },
    }),

    // Split payment support
    isSplitPayment: checkbox({
      defaultValue: false,
      ui: {
        description: "Whether this payment is part of a split bill",
      },
    }),

    splitPaymentIndex: integer({
      ui: {
        description: "Index of this payment in split (1, 2, 3, etc.)",
      },
    }),

    splitTotal: integer({
      ui: {
        description: "Total number of split payments for this order",
      },
    }),

    processedAt: timestamp({
      ui: {
        description: "When payment was successfully processed",
      },
    }),

    // Metadata for errors or additional info
    errorMessage: text({
      ui: {
        description: "Error message if payment failed",
      },
    }),

    notes: text({
      ui: {
        displayMode: "textarea",
        description: "Internal notes about this payment",
      },
    }),

    // Relationships
    order: relationship({
      ref: "RestaurantOrder.payments",
      ui: {
        displayMode: "select",
      },
    }),

    processedBy: relationship({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who processed payment",
      },
    }),
    ...trackingFields,
  },
});

import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  text,
  relationship,
  select,
  integer,
  decimal
} from "@keystone-6/core/fields";

import { isSignedIn } from "../access";
import { trackingFields } from "./trackingFields";

export const RestaurantOrder = list({
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
      initialColumns: ["orderNumber", "orderType", "status", "table", "server", "total"],
    },
  },
  fields: {
    orderNumber: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),

    orderType: select({
      type: "string",
      options: [
        { label: "Dine-in", value: "dine_in" },
        { label: "Takeout", value: "takeout" },
        { label: "Delivery", value: "delivery" },
      ],
      defaultValue: "dine_in",
    }),

    orderSource: select({
      type: "string",
      options: [
        { label: "POS", value: "pos" },
        { label: "Online", value: "online" },
        { label: "Kiosk", value: "kiosk" },
        { label: "Phone", value: "phone" },
      ],
      defaultValue: "pos",
    }),

    status: select({
      type: "string",
      options: [
        { label: "Open", value: "open" },
        { label: "Sent to Kitchen", value: "sent_to_kitchen" },
        { label: "In Progress", value: "in_progress" },
        { label: "Ready", value: "ready" },
        { label: "Served", value: "served" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "open",
    }),

    guestCount: integer({
      defaultValue: 1,
      validation: { min: 1 },
    }),

    specialInstructions: text({
      ui: {
        displayMode: "textarea",
      },
    }),

    subtotal: decimal({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
    }),

    tax: decimal({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
    }),

    tip: decimal({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
    }),

    discount: decimal({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
    }),

    total: decimal({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
    }),

    // Relationships
    table: relationship({
      ref: "Table",
      ui: {
        displayMode: "select",
      },
    }),

    server: relationship({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name",
      },
    }),

    createdBy: relationship({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name",
        description: "Staff member who created this order",
      },
    }),

    orderItems: relationship({
      ref: "OrderItem.order",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["menuItem", "quantity", "price"],
        inlineCreate: { fields: ["menuItem", "quantity", "specialInstructions"] },
        inlineEdit: { fields: ["menuItem", "quantity", "specialInstructions"] },
      },
    }),

    payments: relationship({
      ref: "Payment.order",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["amount", "status", "paymentMethod"],
        inlineCreate: { fields: ["amount", "paymentMethod", "tipAmount"] },
        inlineEdit: { fields: ["amount", "paymentMethod", "status", "tipAmount"] },
      },
    }),

    discounts: relationship({
      ref: "Discount.orders",
      many: true,
    }),

    giftCards: relationship({
      ref: "GiftCard.order",
      many: true,
    }),
    ...trackingFields,
  },
});

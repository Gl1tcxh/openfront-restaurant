import { list } from "@keystone-6/core";
import { integer, json, select, text, relationship } from "@keystone-6/core/fields";

import { isSignedIn } from "../access";
import { trackingFields } from "./trackingFields";

export const DiscountRule = list({
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
      initialColumns: ["description", "type", "value"],
    },
  },
  fields: {
    description: text(),
    type: select({
      type: "enum",
      options: [
        { label: "Fixed", value: "fixed" },
        { label: "Percentage", value: "percentage" },
        { label: "Free Item", value: "free_item" },
      ],
      validation: { isRequired: true },
    }),
    value: integer({
      validation: { isRequired: true },
    }),
    allocation: select({
      type: "enum",
      options: [
        { label: "Total", value: "total" },
        { label: "Item", value: "item" },
      ],
    }),
    metadata: json(),
    discounts: relationship({
      ref: "Discount.discountRule",
      many: true,
    }),
    ...trackingFields,
  },
});

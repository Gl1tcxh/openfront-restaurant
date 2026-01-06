import { list } from "@keystone-6/core";
import { integer, relationship } from "@keystone-6/core/fields";

import { isSignedIn } from "../access";
import { trackingFields } from "./trackingFields";

export const GiftCardTransaction = list({
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
      initialColumns: ["giftCard", "amount", "createdAt", "order"],
    },
  },
  fields: {
    amount: integer({
      validation: { isRequired: true },
    }),
    ...trackingFields,
    giftCard: relationship({
      ref: "GiftCard.giftCardTransactions",
    }),
    order: relationship({
      ref: "RestaurantOrder",
    }),
  },
});

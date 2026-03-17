import { list } from "@keystone-6/core";
import { integer, relationship } from "@keystone-6/core/fields";

import { isSignedIn, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const GiftCardTransaction = list({
  access: {
    operation: {
      query: permissions.canReadGiftCards,
      create: permissions.canManageGiftCards,
      update: permissions.canManageGiftCards,
      delete: permissions.canManageGiftCards,
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

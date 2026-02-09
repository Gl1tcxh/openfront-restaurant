import { list, graphql } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  text,
  relationship,
  integer,
  timestamp,
  decimal,
  virtual
} from "@keystone-6/core/fields";

import { isSignedIn } from "../access";

export const OrderItem = list({
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
      initialColumns: ["menuItem", "quantity", "price", "order"],
    },
  },
  fields: {
    quantity: integer({
      defaultValue: 1,
      validation: { min: 1, isRequired: true },
    }),

    price: integer({
      validation: { isRequired: true },
      ui: {
        description: "Price at time of order in cents (snapshot)",
      },
    }),

    unitPrice: virtual({
      field: graphql.field({
        type: graphql.Int,
        resolve(item: any) {
          return item.price || 0;
        },
      }),
    }),

    totalPrice: virtual({
      field: graphql.field({
        type: graphql.Int,
        resolve(item: any) {
          return (item.price || 0) * (item.quantity || 1);
        },
      }),
    }),

    specialInstructions: text({
      ui: {
        displayMode: "textarea",
      },
    }),

    courseNumber: integer({
      defaultValue: 1,
      ui: {
        description: "For fine dining: 1=appetizer, 2=main, 3=dessert",
      },
    }),

    seatNumber: integer({
      ui: {
        description: "Seat number for split check support",
      },
    }),

    sentToKitchen: timestamp({
      ui: {
        description: "When this item was sent to kitchen",
      },
    }),

    // Relationships
    order: relationship({
      ref: "RestaurantOrder.orderItems",
      ui: {
        displayMode: "select",
      },
    }),

    course: relationship({
      ref: "OrderCourse.orderItems",
      ui: {
        displayMode: "select",
      },
    }),

    menuItem: relationship({
      ref: "MenuItem",
      ui: {
        displayMode: "select",
      },
    }),

    // Applied modifiers for this order item
    appliedModifiers: relationship({
      ref: "MenuItemModifier",
      many: true,
      ui: {
        displayMode: "select",
      },
    }),
  },
});

import { list, graphql } from "@keystone-6/core";
import { json, relationship, select, text, virtual } from "@keystone-6/core/fields";
import { isSignedIn, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const Cart = list({
  access: {
    operation: {
      query: () => true, // Public read for storefront
      create: () => true, // Allow cart creation for guests
      update: permissions.canManageCart,
      delete: permissions.canManageCart,
    },
  },
  fields: {
    user: relationship({ ref: "User.carts" }),
    items: relationship({ ref: "CartItem.cart", many: true }),
    orderType: select({
      options: [
        { label: "Pickup", value: "pickup" },
        { label: "Delivery", value: "delivery" },
      ],
      defaultValue: "pickup",
    }),

    // Customer info (set during checkout, persists across steps)
    email: text(),
    customerName: text(),
    customerPhone: text(),

    // Delivery address (set during checkout)
    deliveryAddress: text(),
    deliveryCity: text(),
    deliveryZip: text(),

    // Payment session data (like OpenFront's PaymentSession.data)
    // Stores: { providerCode, paymentIntentId, clientSecret, orderId, ... }
    paymentData: json(),

    // Payment provider used for this cart's session
    paymentProvider: relationship({ ref: "PaymentProvider" }),

    // Tip and totals (set during checkout)
    tipPercent: select({
      options: [
        { label: "0%", value: "0" },
        { label: "15%", value: "15" },
        { label: "18%", value: "18" },
        { label: "20%", value: "20" },
        { label: "25%", value: "25" },
      ],
      defaultValue: "18",
    }),

    // Link to order once completed (like OpenFront's cart.order)
    order: relationship({ ref: "RestaurantOrder" }),

    subtotal: virtual({
      field: graphql.field({
        type: graphql.Int,
        async resolve(item: any, args, context) {
          const cart = await context.sudo().query.Cart.findOne({
            where: { id: item.id as string },
            query: 'items { quantity menuItem { price } modifiers { priceAdjustment } }'
          });
          if (!cart?.items) return 0;
          return cart.items.reduce((total: number, cartItem: any) => {
            const modifiersTotal = cartItem.modifiers?.reduce((sum: number, mod: any) => sum + (mod.priceAdjustment || 0), 0) || 0;
            return total + ((cartItem.menuItem?.price || 0) + modifiersTotal) * cartItem.quantity;
          }, 0);
        }
      })
    }),
    ...trackingFields,
  }
});

import { list, graphql } from "@keystone-6/core";
import { relationship, select, virtual } from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";
import { trackingFields } from "./trackingFields";

export const Cart = list({
  access: allowAll,
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

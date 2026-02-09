import { list } from "@keystone-6/core";
import { relationship, integer, text } from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";

export const CartItem = list({
  access: allowAll,
  fields: {
    cart: relationship({ ref: "Cart.items" }),
    menuItem: relationship({ ref: "MenuItem" }),
    quantity: integer({ defaultValue: 1, validation: { min: 1 } }),
    modifiers: relationship({ ref: "MenuItemModifier", many: true }),
    specialInstructions: text(),
  }
});

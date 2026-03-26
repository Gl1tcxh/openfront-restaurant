import { list } from "@keystone-6/core";
import { json, text, relationship, image, integer } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const MenuItemImage = list({
  access: {
    operation: {
      query: () => true, // Public read for storefront
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts,
    },
  },
  fields: {
    image: image({ storage: "my_images" }),
    imagePath: text(),
    altText: text(),
    order: integer({
      defaultValue: 0,
    }),
    menuItems: relationship({ ref: "MenuItem.menuItemImages", many: true }),
    metadata: json(),
    ...trackingFields,
  },
  ui: {
    listView: {
      initialColumns: ["image", "imagePath", "altText", "menuItems"],
    },
  },
});

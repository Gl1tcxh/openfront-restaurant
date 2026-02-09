import { list } from "@keystone-6/core";
import { json, text, relationship, image, integer } from "@keystone-6/core/fields";
import { isSignedIn } from "../access";

export const MenuItemImage = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
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
  },
  ui: {
    listView: {
      initialColumns: ["image", "imagePath", "altText", "menuItems"],
    },
  },
});

import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { text, relationship, multiselect, integer } from "@keystone-6/core/fields";

import { isSignedIn, permissions } from "../access";

export const MenuCategory = list({
  access: {
    operation: {
      query: () => true, // Public read for storefront
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "icon", "mealPeriods", "sortOrder"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
    }),

    icon: text({
      ui: {
        description: "Icon name for this category (optional)",
      },
    }),

    description: text({
      ui: {
        displayMode: "textarea",
      },
    }),

    mealPeriods: multiselect({
      type: "string",
      options: [
        { label: "Breakfast", value: "breakfast" },
        { label: "Lunch", value: "lunch" },
        { label: "Dinner", value: "dinner" },
        { label: "All Day", value: "all_day" },
      ],
      defaultValue: ["all_day"],
    }),

    sortOrder: integer({
      defaultValue: 0,
      ui: {
        description: "Order in which categories appear on the menu",
      },
    }),

    // Relationships
    menuItems: relationship({
      ref: "MenuItem.category",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "price", "available"],
        inlineCreate: { fields: ["name", "price", "available"] },
        inlineEdit: { fields: ["name", "price", "available"] },
      },
    }),
  },
});

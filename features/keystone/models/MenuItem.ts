import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  text,
  relationship,
  multiselect,
  integer,
  select,
  checkbox,
  decimal,
  image
} from "@keystone-6/core/fields";
import { document } from "@keystone-6/fields-document";

import { isSignedIn, permissions } from "../access";

export const MenuItem = list({
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
      initialColumns: ["name", "price", "category", "available", "kitchenStation"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
    }),

    menuItemImages: relationship({
      ref: "MenuItemImage.menuItems",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["image", "altText", "imagePath"],
        inlineCreate: { fields: ["image", "altText", "imagePath"] },
        inlineEdit: { fields: ["image", "altText", "imagePath"] },
        inlineConnect: true,
        removeMode: "disconnect",
        linkToItem: false,
      },
    }),

    description: document({
      formatting: true,
      links: true,
    }),

    price: integer({
      validation: { isRequired: true },
      ui: {
        description: "Price in cents",
      },
    }),

    available: checkbox({
      defaultValue: true,
    }),

    featured: checkbox({
      defaultValue: false,
      ui: {
        description: "Highlight this item on the storefront",
      },
    }),

    popular: checkbox({
      defaultValue: false,
      ui: {
        description: "Mark as popular item (shows 'Popular' badge)",
      },
    }),

    prepTime: integer({
      defaultValue: 15,
      ui: {
        description: "Preparation time in minutes",
      },
    }),

    calories: integer({
      ui: {
        description: "Calorie count for this menu item",
      },
    }),

    kitchenStation: select({
      type: "string",
      options: [
        { label: "Grill", value: "grill" },
        { label: "Fryer", value: "fryer" },
        { label: "Salad", value: "salad" },
        { label: "Dessert", value: "dessert" },
        { label: "Bar", value: "bar" },
        { label: "Expo", value: "expo" },
      ],
      defaultValue: "grill",
    }),

    allergens: multiselect({
      type: "string",
      options: [
        { label: "Gluten", value: "gluten" },
        { label: "Dairy", value: "dairy" },
        { label: "Eggs", value: "eggs" },
        { label: "Nuts", value: "nuts" },
        { label: "Shellfish", value: "shellfish" },
        { label: "Soy", value: "soy" },
        { label: "Fish", value: "fish" },
      ],
      defaultValue: [],
    }),

    dietaryFlags: multiselect({
      type: "string",
      options: [
        { label: "Vegan", value: "vegan" },
        { label: "Vegetarian", value: "vegetarian" },
        { label: "Gluten-Free", value: "gluten_free" },
        { label: "Dairy-Free", value: "dairy_free" },
        { label: "Keto", value: "keto" },
      ],
      defaultValue: [],
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

    // Relationships
    category: relationship({
      ref: "MenuCategory.menuItems",
      ui: {
        displayMode: "select",
      },
    }),

    modifiers: relationship({
      ref: "MenuItemModifier.menuItem",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "priceAdjustment", "modifierGroup"],
        inlineCreate: { fields: ["name", "priceAdjustment", "modifierGroup"] },
        inlineEdit: { fields: ["name", "priceAdjustment", "modifierGroup"] },
      },
    }),
  },
});

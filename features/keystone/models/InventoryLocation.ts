import { list } from "@keystone-6/core";
import { text, checkbox, relationship } from "@keystone-6/core/fields";

import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const InventoryLocation = list({
  access: {
    operation: {
      query: permissions.canReadInventory,
      create: permissions.canManageInventory,
      update: permissions.canManageInventory,
      delete: permissions.canManageInventory,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "isActive"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      ui: {
        description: "Storage location name (e.g., Walk-in, Freezer, Dry Storage)",
      },
    }),

    description: text({
      ui: {
        displayMode: "textarea",
        description: "Description of the storage location",
      },
    }),

    isActive: checkbox({
      defaultValue: true,
      ui: {
        description: "Whether this location is currently in use",
      },
    }),

    // Relationships
    ingredients: relationship({
      ref: "Ingredient.location",
      many: true,
    }),
    ...trackingFields,
  },
});

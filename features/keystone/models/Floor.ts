import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { text, integer, checkbox, relationship } from "@keystone-6/core/fields";

import { isSignedIn } from "../access";

export const Floor = list({
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
      initialColumns: ["name", "level", "isActive"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      ui: {
        description: "Floor name (e.g., Main Floor, Second Floor, Patio)",
      },
    }),

    level: integer({
      validation: { isRequired: true },
      defaultValue: 1,
      ui: {
        description: "Floor level number (1 for ground floor, 2 for second floor, etc.)",
      },
    }),

    isActive: checkbox({
      defaultValue: true,
      ui: {
        description: "Whether this floor is currently active for seating",
      },
    }),

    // Relationships
    tables: relationship({
      ref: "Table.floor",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["tableNumber", "capacity", "status"],
        inlineCreate: { fields: ["tableNumber", "capacity", "positionX", "positionY"] },
        inlineEdit: { fields: ["tableNumber", "capacity", "status", "positionX", "positionY"] },
      },
    }),
  },
});

import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { text, integer, checkbox, relationship } from "@keystone-6/core/fields";

import { isSignedIn, permissions } from "../access";

export const KitchenStation = list({
  access: {
    operation: {
      query: permissions.canReadKitchen,
      create: permissions.canManageKitchen,
      update: permissions.canManageKitchen,
      delete: permissions.canManageKitchen,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "displayOrder", "isActive"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      ui: {
        description: "Station name (e.g., Grill, Fryer, Salad, Expo)",
      },
    }),

    displayOrder: integer({
      defaultValue: 0,
      ui: {
        description: "Order in which stations are displayed (lower numbers first)",
      },
    }),

    isActive: checkbox({
      defaultValue: true,
      ui: {
        description: "Whether this station is currently active",
      },
    }),

    // Relationships
    assignedStaff: relationship({
      ref: "User",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "email"],
        inlineConnect: true,
        description: "Staff members assigned to this station",
      },
    }),

    tickets: relationship({
      ref: "KitchenTicket.station",
      many: true,
    }),

    prepStations: relationship({
      ref: "PrepStation.station",
      many: true,
    }),
  },
});

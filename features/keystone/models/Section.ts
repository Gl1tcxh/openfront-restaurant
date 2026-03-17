import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { text, relationship } from "@keystone-6/core/fields";

import { isSignedIn, permissions } from "../access";

export const Section = list({
  access: {
    operation: {
      query: permissions.canReadTables,
      create: permissions.canManageTables,
      update: permissions.canManageTables,
      delete: permissions.canManageTables,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "tables"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),

    // Relationships
    tables: relationship({
      ref: "Table.section",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["tableNumber", "capacity", "status"],
        inlineCreate: { fields: ["tableNumber", "capacity", "status"] },
        inlineEdit: { fields: ["tableNumber", "capacity", "status"] },
      },
    }),
  },
});

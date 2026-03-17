import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { text, integer, relationship } from "@keystone-6/core/fields";

import { isSignedIn, permissions } from "../access";

export const Vendor = list({
  access: {
    operation: {
      query: permissions.canReadVendors,
      create: permissions.canManageVendors,
      update: permissions.canManageVendors,
      delete: permissions.canManageVendors,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "contact", "email", "phone"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      ui: {
        description: "Vendor company name",
      },
    }),

    contact: text({
      ui: {
        description: "Primary contact person",
      },
    }),

    email: text({
      validation: {
        match: {
          regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          explanation: "Please enter a valid email address",
        },
      },
      ui: {
        description: "Vendor email address",
      },
    }),

    phone: text({
      ui: {
        description: "Vendor phone number",
      },
    }),

    paymentTerms: text({
      ui: {
        description: "Payment terms (e.g., Net 30, COD)",
      },
    }),

    leadTime: integer({
      ui: {
        description: "Lead time in days for orders",
      },
    }),

    // Relationships
    ingredients: relationship({
      ref: "Ingredient.vendor",
      many: true,
    }),
  },
});

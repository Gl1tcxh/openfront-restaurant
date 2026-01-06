import {
  text,
  password,
  relationship,
  select,
  timestamp,
  json,
} from "@keystone-6/core/fields";
import { list } from "@keystone-6/core";

import { isSignedIn } from "../access";
import { trackingFields } from "./trackingFields";

// Restaurant-focused API key scopes
export const API_KEY_SCOPES = {
  read_orders: "View restaurant orders",
  write_orders: "Manage restaurant orders",
  read_menu: "View menu items and categories",
  write_menu: "Manage menu items and categories",
  read_reservations: "View reservations",
  write_reservations: "Manage reservations",
  read_inventory: "View inventory and ingredients",
  write_inventory: "Manage inventory and ingredients",
  read_payments: "View payments",
  write_payments: "Manage payments and refunds",
} as const;

export type ApiKeyScope = keyof typeof API_KEY_SCOPES;

export const ApiKey = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
      update: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
      delete: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
    },
  },
  hooks: {
    validate: {
      create: async ({ resolvedData, addValidationError }) => {
        if (!resolvedData.scopes || resolvedData.scopes.length === 0) {
          addValidationError("At least one scope is required for API keys");
        }
      },
    },
    resolveInput: {
      create: async ({ resolvedData, context }) => {
        return {
          ...resolvedData,
          user:
            resolvedData.user ||
            (context.session?.itemId
              ? { connect: { id: context.session.itemId } }
              : undefined),
        };
      },
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      ui: {
        description:
          "A descriptive name for this API key (e.g. 'POS Integration')",
      },
    }),
    tokenSecret: password({
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
        description: "Secure API key token (hashed and never displayed)",
      },
    }),
    tokenPreview: text({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
        description: "Preview of the API key (actual key is hidden)",
      },
    }),
    scopes: json({
      defaultValue: [],
      ui: {
        description: "Array of scopes for this API key",
      },
    }),
    status: select({
      type: "enum",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Revoked", value: "revoked" },
      ],
      defaultValue: "active",
      ui: {
        description: "Current status of this API key",
      },
    }),
    expiresAt: timestamp({
      ui: {
        description:
          "When this API key expires (optional - leave blank for no expiration)",
      },
    }),
    lastUsedAt: timestamp({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Last time this API key was used",
      },
    }),
    usageCount: json({
      defaultValue: { total: 0, daily: {} },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Usage statistics for this API key",
      },
    }),
    restrictedToIPs: json({
      defaultValue: [],
      ui: {
        description:
          "Optional: Restrict this key to specific IP addresses (array of IPs)",
      },
    }),
    ...trackingFields,
    user: relationship({
      ref: "User.apiKeys",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
      },
    }),
  },
  ui: {
    labelField: "name",
    listView: {
      initialColumns: ["name", "tokenPreview", "scopes", "status", "lastUsedAt"],
    },
    description: "Secure API keys for programmatic access",
  },
});

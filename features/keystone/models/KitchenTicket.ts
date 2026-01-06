import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  relationship,
  select,
  integer,
  json,
  timestamp,
} from "@keystone-6/core/fields";

import { isSignedIn } from "../access";

export const KitchenTicket = list({
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
      initialColumns: ["order", "station", "status", "priority", "firedAt"],
    },
  },
  fields: {
    status: select({
      type: "string",
      options: [
        { label: "New", value: "new" },
        { label: "In Progress", value: "in_progress" },
        { label: "Ready", value: "ready" },
        { label: "Served", value: "served" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "new",
      validation: { isRequired: true },
    }),

    priority: integer({
      defaultValue: 0,
      ui: {
        description: "Priority level (higher numbers = higher priority)",
      },
    }),

    items: json({
      ui: {
        description: "Order items for this ticket (JSON array)",
      },
    }),

    firedAt: timestamp({
      defaultValue: { kind: "now" },
      ui: {
        description: "When the ticket was sent to the kitchen",
      },
    }),

    completedAt: timestamp({
      ui: {
        description: "When all items were completed",
      },
    }),

    servedAt: timestamp({
      ui: {
        description: "When the items were served to the customer",
      },
    }),

    // Relationships
    order: relationship({
      ref: "RestaurantOrder",
      ui: {
        displayMode: "select",
        description: "Restaurant order this ticket belongs to",
      },
    }),

    station: relationship({
      ref: "KitchenStation.tickets",
      ui: {
        displayMode: "select",
        description: "Kitchen station assigned to this ticket",
      },
    }),

    preparedBy: relationship({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who prepared this ticket",
      },
    }),
  },
});

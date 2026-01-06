import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { text, integer, select, relationship, float, json } from "@keystone-6/core/fields";

import { isSignedIn } from "../access";

export const Table = list({
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
      initialColumns: ["tableNumber", "capacity", "section", "status"],
    },
  },
  fields: {
    tableNumber: text({
      validation: { isRequired: true },
      isIndexed: true,
    }),

    capacity: integer({
      validation: { isRequired: true, min: 1 },
      defaultValue: 4,
    }),

    status: select({
      type: "string",
      options: [
        { label: "Available", value: "available" },
        { label: "Occupied", value: "occupied" },
        { label: "Reserved", value: "reserved" },
        { label: "Cleaning", value: "cleaning" },
      ],
      defaultValue: "available",
      ui: {
        displayMode: "segmented-control",
      },
    }),

    shape: select({
      type: "string",
      options: [
        { label: "Round", value: "round" },
        { label: "Square", value: "square" },
        { label: "Rectangle", value: "rectangle" },
      ],
      defaultValue: "rectangle",
      ui: {
        description: "Table shape for floor plan rendering",
      },
    }),

    // Floor plan positioning
    positionX: float({
      defaultValue: 0,
      ui: {
        description: "X coordinate for floor plan rendering",
      },
    }),

    positionY: float({
      defaultValue: 0,
      ui: {
        description: "Y coordinate for floor plan rendering",
      },
    }),

    metadata: json({
      ui: {
        description: "Additional table metadata (dimensions, notes, etc.)",
      },
    }),

    // Relationships
    floor: relationship({
      ref: "Floor.tables",
      ui: {
        displayMode: "select",
        description: "Floor this table belongs to",
      },
    }),

    section: relationship({
      ref: "Section.tables",
      ui: {
        displayMode: "select",
      },
    }),
  },
});

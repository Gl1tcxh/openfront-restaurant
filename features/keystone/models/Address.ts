import { list, graphql } from "@keystone-6/core";
import { text, relationship, checkbox, virtual, json } from "@keystone-6/core/fields";
import { isSignedIn, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const Address = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: ({ session }) => {
        if (permissions.canManagePeople({ session })) return true;
        return { user: { id: { equals: session?.itemId } } };
      },
      update: ({ session }) => {
        if (permissions.canManagePeople({ session })) return true;
        return { user: { id: { equals: session?.itemId } } };
      },
      delete: ({ session }) => {
        if (permissions.canManagePeople({ session })) return true;
        return { user: { id: { equals: session?.itemId } } };
      },
    }
  },
  fields: {
    label: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve(item: any) {
          const parts = [];
          if (item.name) parts.push(item.name);
          if (item.address1) parts.push(item.address1);
          if (item.city) parts.push(item.city);
          return parts.join(', ');
        }
      }),
    }),
    name: text({ validation: { isRequired: true } }),
    address1: text({ validation: { isRequired: true } }),
    address2: text(),
    city: text({ validation: { isRequired: true } }),
    state: text(),
    postalCode: text({ validation: { isRequired: true } }),
    country: text({ defaultValue: "USA" }),
    phone: text(),
    isDefault: checkbox({ defaultValue: false }),
    isBilling: checkbox({ defaultValue: false }),
    metadata: json(),
    user: relationship({ ref: "User.addresses" }),
    ...trackingFields,
  },
  ui: {
    labelField: 'label',
    listView: {
      initialColumns: ['label', 'user', 'isDefault'],
    },
  },
});

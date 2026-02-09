import { list, graphql } from '@keystone-6/core'
import { allOperations, denyAll } from '@keystone-6/core/access'
import {
  checkbox,
  password,
  relationship,
  text,
  timestamp,
  decimal,
  select,
  json,
  image,
  virtual,
} from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import type { Session } from '../access'
import { trackingFields } from './trackingFields'

export const User = list({
  access: {
    operation: {
      query: () => true,
      create: (args) => {
        // Allow public sign-ups if environment variable is set to true
        if (process.env.PUBLIC_SIGNUPS_ALLOWED === 'true') {
          return true;
        }
        // Otherwise, require canManagePeople permission
        return permissions.canManagePeople(args);
      },
      update: isSignedIn,
      delete: permissions.canManagePeople,
    },
    filter: {
      query: rules.canReadPeople,
      update: rules.canUpdatePeople,
    },
  },
  ui: {
    hideCreate: args => !permissions.canManagePeople(args),
    hideDelete: args => !permissions.canManagePeople(args),
    listView: {
      initialColumns: ['name', 'email', 'role', 'employeeId', 'staffRole', 'isActive'],
    },
    itemView: {
      defaultFieldMode: ({ session, item }) => {
        // canEditOtherPeople can edit other people
        if (session?.data.role?.canEditOtherPeople) return 'edit'

        // edit themselves
        if (session?.itemId === item?.id) return 'edit'

        // else, default all fields to read mode
        return 'read'
      },
    },
  },
  fields: {
    name: text({
      validation: {
        isRequired: true,
      },
    }),
    email: text({
      isFilterable: false,
      isOrderable: false,
      isIndexed: 'unique',
      validation: {
        isRequired: true,
      },
    }),
    password: password({
      access: {
        read: denyAll,
        update: ({ session, item }) =>
          permissions.canManagePeople({ session }) || session?.itemId === item.id,
      },
      validation: { isRequired: true },
    }),
    role: relationship({
      ref: 'Role.assignedTo',
      access: {
        create: permissions.canManagePeople,
        update: permissions.canManagePeople,
      },
      ui: {
        itemView: {
          fieldMode: args => (permissions.canManagePeople(args) ? 'edit' : 'read'),
        },
      },
    }),

    apiKeys: relationship({
      ref: 'ApiKey.user',
      many: true,
      ui: {
        itemView: { fieldMode: 'read' },
      },
    }),

    phone: text({
      ui: {
        description: 'Primary phone number for the user',
      },
    }),

    restaurantOrders: relationship({
      ref: 'RestaurantOrder.customer',
      many: true,
      ui: {
        itemView: { fieldMode: 'read' },
      },
    }),

    addresses: relationship({
      ref: 'Address.user',
      many: true,
    }),

    carts: relationship({
      ref: 'Cart.user',
      many: true,
    }),

    firstName: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve(item) {
          if (!item.name) return '';
          return item.name.trim().split(/\s+/)[0] || '';
        },
      }),
    }),

    lastName: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve(item) {
          if (!item.name) return '';
          const parts = item.name.trim().split(/\s+/);
          return parts.length > 1 ? parts.slice(1).join(' ') : '';
        },
      }),
    }),

    billingAddress: virtual({
      field: (lists) =>
        graphql.field({
          type: lists.Address.types.output,
          async resolve(item, args, context) {
            const address = await context.db.Address.findMany({
              where: {
                user: { id: { equals: item.id } },
                isBilling: { equals: true },
              },
              take: 1,
            });

            if (!address.length) return null;

            return address[0];
          },
        }),
      ui: {
        query: '{ id name address1 address2 city state postalCode phone isBilling }',
      },
    }),

    // Restaurant Staff Fields
    employeeId: text({
      isIndexed: 'unique',
      ui: {
        description: 'Unique employee identifier',
      },
    }),

    staffRole: select({
      type: 'string',
      options: [
        { label: 'Server', value: 'server' },
        { label: 'Bartender', value: 'bartender' },
        { label: 'Host', value: 'host' },
        { label: 'Cook', value: 'cook' },
        { label: 'Manager', value: 'manager' },
        { label: 'Admin', value: 'admin' },
        { label: 'Busser', value: 'busser' },
        { label: 'Chef', value: 'chef' },
      ],
      ui: {
        displayMode: 'select',
        description: 'Staff role in the restaurant',
      },
    }),

    hireDate: timestamp({
      ui: {
        description: 'Date employee was hired',
      },
    }),

    hourlyRate: decimal({
      precision: 10,
      scale: 2,
      ui: {
        description: 'Hourly wage rate',
      },
    }),

    pin: text({
      access: {
        read: denyAll,
        update: ({ session, item }) =>
          permissions.canManagePeople({ session }) || session?.itemId === item.id,
      },
      ui: {
        description: '4-digit PIN for quick POS login',
      },
    }),

    staffPermissions: json({
      ui: {
        description: 'Additional staff permissions and settings',
      },
    }),

    isActive: checkbox({
      defaultValue: true,
      ui: {
        description: 'Whether this employee is currently active',
      },
    }),

    onboardingStatus: select({
      type: 'string',
      options: [
        { label: 'Not Started', value: 'not_started' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Dismissed', value: 'dismissed' },
      ],
      defaultValue: 'not_started',
      ui: {
        description: 'Restaurant onboarding progress',
      },
    }),

    photo: image({
      storage: 'my_images',
    }),

    // Emergency Contact Info
    emergencyContactName: text({
      ui: {
        description: 'Emergency contact person name',
      },
    }),

    emergencyContactPhone: text({
      ui: {
        description: 'Emergency contact phone number',
      },
    }),

    // Certifications
    certifications: json({
      ui: {
        description: 'Food handler, alcohol service, and other certifications (JSON)',
      },
    }),
    ...trackingFields,
  },
});

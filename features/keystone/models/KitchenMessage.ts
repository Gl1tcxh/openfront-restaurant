import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  select,
  timestamp,
} from "@keystone-6/core/fields";

import { isSignedIn } from "../access";
import { trackingFields } from "./trackingFields";

export const KitchenMessage = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
  },
  fields: {
    content: text({ validation: { isRequired: true } }),
    
    type: select({
      options: [
        { label: 'General', value: 'general' },
        { label: 'Urgent', value: 'urgent' },
        { label: '86 Alert', value: '86_alert' },
      ],
      defaultValue: 'general',
    }),

    fromStation: select({
      options: [
        { label: 'Kitchen', value: 'kitchen' },
        { label: 'FOH', value: 'foh' },
      ],
      defaultValue: 'foh',
    }),

    // Relationships
    order: relationship({ ref: 'RestaurantOrder' }),
    sender: relationship({ ref: 'User' }),
    
    ...trackingFields,
  },
});

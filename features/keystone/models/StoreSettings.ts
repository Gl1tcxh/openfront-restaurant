import { list } from "@keystone-6/core";
import { text, integer, decimal, json } from "@keystone-6/core/fields";

import { permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const StoreSettings = list({
  access: {
    operation: {
      query: () => true, // Public read for storefront
      create: permissions.canManageSettings,
      update: permissions.canManageSettings,
      delete: permissions.canManageSettings,
    },
  },
  isSingleton: true,
  graphql: {
    plural: 'storeSettingsItems',
  },
  ui: {
    listView: {
      initialColumns: ["name", "tagline", "phone"],
    },
  },
  fields: {
    // Basic Info
    name: text({
      validation: { isRequired: true },
      ui: { description: "Restaurant name" },
    }),

    tagline: text({
      ui: { description: "Short tagline (e.g., 'Artisan Burgers & Craft Sides')" },
    }),

    // Contact
    address: text({
      ui: { description: "Full street address" },
    }),

    phone: text({
      ui: { description: "Phone number" },
    }),

    email: text({
      ui: { description: "Contact email" },
    }),

    // Localization
    currencyCode: text({
      defaultValue: "USD",
      ui: { description: "ISO 4217 currency code (e.g. USD, EUR, JPY)" },
    }),

    locale: text({
      defaultValue: "en-US",
      ui: { description: "Locale used for formatting numbers/dates (e.g. en-US)" },
    }),

    timezone: text({
      defaultValue: "America/New_York",
      ui: { description: "IANA timezone (e.g. America/New_York)" },
    }),

    countryCode: text({
      defaultValue: "US",
      ui: { description: "Primary storefront country code (ISO 3166-1 alpha-2)" },
    }),

    // Hours (stored as JSON for flexibility)
    hours: json({
      defaultValue: {
        monday: "11:00 AM - 10:00 PM",
        tuesday: "11:00 AM - 10:00 PM",
        wednesday: "11:00 AM - 10:00 PM",
        thursday: "11:00 AM - 10:00 PM",
        friday: "11:00 AM - 11:00 PM",
        saturday: "10:00 AM - 11:00 PM",
        sunday: "10:00 AM - 9:00 PM",
      },
      ui: { description: "Operating hours by day of week" },
    }),

    // Tax
    taxRate: decimal({
      precision: 5,
      scale: 2,
      defaultValue: "8.75",
      ui: { description: "Tax rate percentage (e.g. 8.75 for 8.75%)" },
    }),

    // Delivery/Pickup Settings
    deliveryFee: decimal({
      precision: 10,
      scale: 2,
      defaultValue: "4.99",
      ui: { description: "Delivery fee amount" },
    }),

    deliveryMinimum: decimal({
      precision: 10,
      scale: 2,
      defaultValue: "15.00",
      ui: { description: "Minimum order for delivery" },
    }),

    pickupDiscount: integer({
      defaultValue: 10,
      ui: { description: "Pickup discount percentage" },
    }),

    estimatedDelivery: text({
      defaultValue: "30-45 min",
      ui: { description: "Estimated delivery time" },
    }),

    estimatedPickup: text({
      defaultValue: "15-20 min",
      ui: { description: "Estimated pickup time" },
    }),

    // Hero/Branding
    heroHeadline: text({
      defaultValue: "Thoughtfully crafted burgers.",
      ui: { description: "Main hero headline" },
    }),

    heroSubheadline: text({
      defaultValue: "Premium ingredients from local farms, bold flavors, and a commitment to quality in every bite.",
      ui: { description: "Hero subheadline/description" },
    }),

    heroTagline: text({
      defaultValue: "Locally Sourced · Made Fresh Daily",
      ui: { description: "Small tagline above headline" },
    }),

    // Promo Banner
    promoBanner: text({
      defaultValue: "Free pickup discount · 10% off all pickup orders",
      ui: { description: "Promotional banner text at top of page" },
    }),

    // Social/Reviews (optional display data)
    rating: decimal({
      precision: 2,
      scale: 1,
      defaultValue: "4.8",
      ui: { description: "Average rating to display" },
    }),

    reviewCount: integer({
      defaultValue: 0,
      ui: { description: "Number of reviews to display" },
    }),
    ...trackingFields,
  },
});

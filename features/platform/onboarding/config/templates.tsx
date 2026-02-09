import { Utensils, UtensilsCrossed, CircleCheck, Building2, Package } from 'lucide-react';

export interface RestaurantTemplate {
  name: string;
  description: string;
  icon: React.ReactNode;
  displayNames: {
    storeInfo: string[];
    kitchenStations: string[];
    floors: string[];
    sections: string[];
    tables: string[];
    paymentMethods: string[];
    categories: string[];
    menuItems: string[];
    modifiers: string[];
  };
}

export const RESTAURANT_TEMPLATES: Record<'full' | 'minimal' | 'custom', RestaurantTemplate> = {
  full: {
    name: 'Complete Restaurant Setup',
    description: 'Full restaurant setup with kitchen, seating, menu items, and payment methods.',
    icon: <Building2 className="h-5 w-5" />,
    displayNames: {
      storeInfo: ['Store Settings'],
      kitchenStations: ['Grill', 'Fryer', 'Salad', 'Bar', 'Dessert', 'Prep'],
      floors: ['Main Floor'],
      sections: ['Main Dining', 'Patio'],
      tables: ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8'],
      paymentMethods: ['Cash', 'Credit Card', 'Mobile Payment'],
      categories: ['Featured', 'Burgers', 'Chicken', 'Sides', 'Drinks', 'Desserts'],
      menuItems: [
        'The Big Stack',
        'BBQ Bacon Burger',
        'Classic Burger',
        'Mushroom Swiss',
        'Spicy Jalapeño',
        'Western Burger',
        'Garden Veggie Burger',
        'Crispy Chicken Sandwich',
        'Spicy Chicken Sandwich',
        'Grilled Chicken Sandwich',
        'Chicken Tenders',
        'Classic Fries',
        'Loaded Fries',
        'Onion Rings',
        'Sweet Potato Fries',
        'Creamy Coleslaw',
        'Fountain Drink',
        'Hand-Spun Milkshake',
        'Fresh Brewed Iced Tea',
        'Bottled Water',
        'Brownie Sundae',
        'Warm Apple Pie',
        'Fresh Baked Cookies',
      ],
      modifiers: [
        'Single Patty',
        'Double Patty',
        'Triple Patty',
        'American Cheese',
        'Cheddar Cheese',
        'Crispy Bacon',
        'Regular Size',
        'Large Size',
        'Small (16 oz)',
        'Medium (22 oz)',
        'Large (32 oz)',
      ],
    },
  },
  minimal: {
    name: 'Basic Menu',
    description: 'A few sample items to get started.',
    icon: <Package className="h-5 w-5" />,
    displayNames: {
      storeInfo: ['Store Settings'],
      kitchenStations: ['Grill', 'Fryer', 'Bar'],
      floors: ['Main Floor'],
      sections: ['Main Dining'],
      tables: ['Table 1', 'Table 2'],
      paymentMethods: ['Cash', 'Credit Card'],
      categories: ['Burgers', 'Sides', 'Drinks'],
      menuItems: ['Classic Burger', 'Classic Fries', 'Fountain Drink'],
      modifiers: ['Single Patty', 'Double Patty', 'Regular Size', 'Large Size'],
    },
  },
  custom: {
    name: 'Custom Setup',
    description: 'Customize your setup with your own JSON templates for each section.',
    icon: <CircleCheck className="h-5 w-5" />,
    displayNames: {
      storeInfo: ['Store Settings'],
      kitchenStations: ['Grill', 'Fryer', 'Bar'],
      floors: ['Main Floor'],
      sections: ['Main Dining'],
      tables: ['Table 1', 'Table 2'],
      paymentMethods: ['Cash', 'Credit Card'],
      categories: ['Burgers', 'Sides', 'Drinks'],
      menuItems: ['Classic Burger', 'Classic Fries', 'Fountain Drink'],
      modifiers: ['Single Patty', 'Double Patty', 'Regular Size', 'Large Size'],
    },
  },
};

export interface SectionDefinition {
  id: number;
  type: string;
  label: string;
  getItemsFn: (template: 'full' | 'minimal' | 'custom') => string[];
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: 1,
    type: 'storeInfo',
    label: 'Store Information',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.storeInfo,
  },
  {
    id: 2,
    type: 'categories',
    label: 'Menu Categories',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.categories,
  },
  {
    id: 3,
    type: 'menuItems',
    label: 'Menu Items',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.menuItems,
  },
  {
    id: 4,
    type: 'modifiers',
    label: 'Item Modifiers',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.modifiers,
  },
  {
    id: 5,
    type: 'paymentMethods',
    label: 'Payment Methods',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.paymentMethods,
  },
  {
    id: 6,
    type: 'kitchenStations',
    label: 'Kitchen Stations',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.kitchenStations,
  },
  {
    id: 7,
    type: 'floors',
    label: 'Floors',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.floors,
  },
  {
    id: 8,
    type: 'sections',
    label: 'Sections',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.sections,
  },
  {
    id: 9,
    type: 'tables',
    label: 'Tables',
    getItemsFn: (template) => RESTAURANT_TEMPLATES[template].displayNames.tables,
  },
];

// For backwards compatibility
export const STORE_TEMPLATES = RESTAURANT_TEMPLATES;

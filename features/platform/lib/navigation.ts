import {
  Package,
  Users,
  Tag,
  Gift,
  BarChart3,
  Ticket,
  Utensils,
  LucideIcon,
  UtensilsCrossed,
  ChefHat,
  ClipboardList,
  FileText,
  Boxes,
  DollarSign,
  CreditCard,
  MapPin,
  Store,
  RefreshCw,
  Building,
  Key,
  CalendarDays,
  BookOpen,
  Trash2
} from 'lucide-react'

export interface PlatformNavItem {
  title: string
  href: string
  color: string
  description: string
  icon: LucideIcon
  group?: string
}

export interface PlatformNavGroup {
  id: string
  title: string
  icon: LucideIcon
  items: PlatformNavItem[]
}

// Core platform navigation items organized by logical groups
export const platformNavItems: PlatformNavItem[] = [
  // Standalone Items
  {
    title: 'Orders',
    href: '/platform/orders',
    color: 'blue',
    description: 'Manage customer orders, delivery, and dine-in.',
    icon: Ticket,
    group: 'standalone'
  },
  {
    title: 'KDS',
    href: '/platform/kds',
    color: 'orange',
    description: 'Kitchen Display System for order fulfillment.',
    icon: ChefHat,
    group: 'standalone'
  },
  {
    title: 'Analytics',
    href: '/platform/reports',
    color: 'indigo',
    description: 'View sales reports, customer insights, and performance metrics.',
    icon: BarChart3,
    group: 'standalone'
  },
  {
    title: 'Reservations',
    href: '/platform/reservations',
    color: 'purple',
    description: 'Manage table reservations and booking schedule.',
    icon: CalendarDays,
    group: 'standalone'
  },
  {
    title: 'Store Settings',
    href: '/platform/store-settings',
    color: 'slate',
    description: 'Configure restaurant settings, hours, and branding.',
    icon: Store,
    group: 'standalone'
  },

  // Menu & Catalog
  {
    title: 'Menu Items',
    href: '/platform/menu-items',
    color: 'green',
    description: 'Create and manage your menu items, pricing, and availability.',
    icon: Utensils,
    group: 'menu'
  },
  {
    title: 'Categories',
    href: '/platform/menu-categories',
    color: 'lime',
    description: 'Organize menu items into categories.',
    icon: BookOpen,
    group: 'menu'
  },
  {
    title: 'Modifiers',
    href: '/platform/menu-modifiers',
    color: 'amber',
    description: 'Create modifiers for customization options.',
    icon: UtensilsCrossed,
    group: 'menu'
  },

  // Inventory
  {
    title: 'Ingredients',
    href: '/platform/ingredients',
    color: 'emerald',
    description: 'Manage ingredients and inventory tracking.',
    icon: Boxes,
    group: 'inventory'
  },
  {
    title: 'Purchase Orders',
    href: '/platform/inventory/purchase-orders',
    color: 'blue',
    description: 'Manage inventory replenishment.',
    icon: FileText,
    group: 'inventory'
  },
  {
    title: 'Waste Log',
    href: '/platform/inventory/waste',
    color: 'red',
    description: 'Track food waste and loss.',
    icon: Trash2,
    group: 'inventory'
  },

  // Operations
  {
    title: 'Operations',
    href: '/platform/operations',
    color: 'orange',
    description: 'Daily operations dashboard and performance signals.',
    icon: ClipboardList,
    group: 'operations'
  },
  {
    title: 'Tables & Sections',
    href: '/platform/tables',
    color: 'cyan',
    description: 'Manage dining room layout, tables, and sections.',
    icon: MapPin,
    group: 'operations'
  },
  {
    title: 'Staff',
    href: '/platform/users',
    color: 'purple',
    description: 'Manage staff accounts, roles, and permissions.',
    icon: Users,
    group: 'operations'
  },

  // Marketing & Growth
  {
    title: 'Discounts',
    href: '/platform/discounts',
    color: 'pink',
    description: 'Manage discount codes and promotional campaigns.',
    icon: Tag,
    group: 'marketing'
  },
  {
    title: 'Gift Cards',
    href: '/platform/gift-cards',
    color: 'rose',
    description: 'Manage gift card creation and redemption.',
    icon: Gift,
    group: 'marketing'
  },

  // Integrations
  {
    title: 'Payment Providers',
    href: '/platform/payment-providers',
    color: 'slate',
    description: 'Configure payment gateways and provider settings.',
    icon: CreditCard,
    group: 'integrations'
  },
  {
    title: 'API Keys',
    href: '/platform/api-keys',
    color: 'violet',
    description: 'Manage API keys for programmatic access.',
    icon: Key,
    group: 'integrations'
  }
]

export const platformStandaloneItems = platformNavItems.filter(
  (item) => item.group === 'standalone'
)

export const platformNavGroups: PlatformNavGroup[] = [
  {
    id: 'menu',
    title: 'Menu',
    icon: Utensils,
    items: platformNavItems.filter((item) => item.group === 'menu'),
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: Boxes,
    items: platformNavItems.filter((item) => item.group === 'inventory'),
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: ClipboardList,
    items: platformNavItems.filter((item) => item.group === 'operations'),
  },
  {
    id: 'marketing',
    title: 'Marketing',
    icon: BarChart3,
    items: platformNavItems.filter((item) => item.group === 'marketing'),
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: RefreshCw,
    items: platformNavItems.filter((item) => item.group === 'integrations'),
  },
]

export function getPlatformNavItemsWithBasePath(basePath: string) {
  return platformNavItems.map((item) => ({
    ...item,
    href: `${basePath}${item.href}`,
  }))
}

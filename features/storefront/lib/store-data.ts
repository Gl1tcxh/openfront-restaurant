export interface MenuItem {
  id: string
  name: string
  description: string | { document: any }
  price: number | string
  image?: { url: string; width?: number; height?: number } | string
  category?: { id: string; name: string } | string
  categoryId?: string
  calories?: number
  popular?: boolean
  featured?: boolean
  available?: boolean
  prepTime?: number
  kitchenStation?: string
  allergens?: string[]
  dietaryFlags?: string[]
  mealPeriods?: string[]
  modifiers?: MenuItemModifier[]
}

export interface MenuItemModifier {
  id: string
  name: string
  modifierGroup?: string
  modifierGroupLabel?: string
  priceAdjustment: number | string
  calories?: number
  defaultSelected?: boolean
  required?: boolean
  minSelections?: number
  maxSelections?: number
}

export interface ModifierGroup {
  id: string
  name: string
  required: boolean
  min: number
  max: number
  modifiers: Modifier[]
}

export interface Modifier {
  id: string
  name: string
  price: number
  calories?: number
  default?: boolean
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  icon?: string
  mealPeriods?: string[]
  sortOrder?: number
}

export interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  modifiers: SelectedModifier[]
  specialInstructions?: string
}

export interface SelectedModifier {
  groupId: string
  modifierId: string
  name: string
  price: number
}

export interface StoreInfo {
  name: string
  tagline: string
  address: string
  phone: string
  hours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  deliveryFee: number
  deliveryMinimum: number
  pickupDiscount: number
  estimatedDelivery: string
  estimatedPickup: string
  heroHeadline?: string
  heroSubheadline?: string
  heroTagline?: string
  promoBanner?: string
  rating?: number
  reviewCount?: number
}

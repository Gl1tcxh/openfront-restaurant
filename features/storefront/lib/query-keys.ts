// Centralized query key factory for type safety and consistency
export const queryKeys = {
  // Cart operations
  cart: {
    all: ['cart'] as const,
    active: () => [...queryKeys.cart.all, 'active'] as const,
    byId: (cartId: string) => [...queryKeys.cart.all, cartId] as const,
  },

  // Menu operations
  menu: {
    all: ['menu'] as const,
    lists: () => [...queryKeys.menu.all, 'list'] as const,
    list: (params: {
      categoryId?: string;
      limit?: number;
      featured?: boolean;
    }) => [...queryKeys.menu.lists(), params] as const,
    categories: () => [...queryKeys.menu.all, 'categories'] as const,
    items: (categoryId?: string) => [...queryKeys.menu.all, 'items', categoryId] as const,
    featured: (take: number = 12) => [...queryKeys.menu.all, 'featured', take] as const,
    item: (id: string) => [...queryKeys.menu.all, 'item', id] as const,
  },

  // User operations
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    orders: () => [...queryKeys.user.all, 'orders'] as const,
    order: (orderId: string) => [...queryKeys.user.orders(), orderId] as const,
    addresses: () => [...queryKeys.user.all, 'addresses'] as const,
  },

  // Store configuration
  store: {
    all: ['store'] as const,
    settings: () => [...queryKeys.store.all, 'settings'] as const,
    paymentConfig: () => [...queryKeys.store.all, 'paymentConfig'] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (orderId: string) => [...queryKeys.orders.details(), orderId] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;

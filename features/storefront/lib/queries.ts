import { keystoneContext } from "@/features/keystone/context";

export async function getStoreSettings() {
  const settings = await keystoneContext.query.StoreSettings.findOne({
    where: { id: '1' },
    query: `
      id
      name
      tagline
      address
      phone
      email
      currencyCode
      locale
      timezone
      countryCode
      hours
      deliveryFee
      deliveryMinimum
      pickupDiscount
      estimatedDelivery
      estimatedPickup
      heroHeadline
      heroSubheadline
      heroTagline
      promoBanner
      rating
      reviewCount
    `
  });

  return settings || null;
}

export async function getMenuCategories() {
  return keystoneContext.query.MenuCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    query: `
      id
      name
      description
      mealPeriods
      sortOrder
      menuItems(where: { available: { equals: true } }, orderBy: { name: asc }) {
        id
        name
        description { document }
        price
        prepTime
        kitchenStation
        allergens
        dietaryFlags
        mealPeriods
        image {
          url
          width
          height
        }
        modifiers {
          id
          name
          modifierGroup
          priceAdjustment
          defaultSelected
        }
      }
    `
  });
}

export async function getMenuCategory(id: string) {
  return keystoneContext.query.MenuCategory.findOne({
    where: { id },
    query: `
      id
      name
      description
      mealPeriods
      menuItems(where: { available: { equals: true } }, orderBy: { name: asc }) {
        id
        name
        description { document }
        price
        prepTime
        kitchenStation
        allergens
        dietaryFlags
        mealPeriods
        image {
          url
          width
          height
        }
        modifiers {
          id
          name
          modifierGroup
          priceAdjustment
          defaultSelected
        }
      }
    `
  });
}

export async function getMenuItem(id: string) {
  return keystoneContext.query.MenuItem.findOne({
    where: { id },
    query: `
      id
      name
      description { document }
      price
      prepTime
      kitchenStation
      allergens
      dietaryFlags
      mealPeriods
      image {
        url
        width
        height
      }
      category {
        id
        name
      }
      modifiers {
        id
        name
        modifierGroup
        priceAdjustment
        defaultSelected
      }
    `
  });
}

export async function getTables() {
  return keystoneContext.query.Table.findMany({
    where: { status: { equals: 'available' } },
    orderBy: { tableNumber: 'asc' },
    query: `
      id
      tableNumber
      capacity
      section {
        id
        name
      }
    `
  });
}

export async function createOrder(data: {
  orderType: string;
  tableId?: string;
  guestCount?: number;
  specialInstructions?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number; // In cents
    specialInstructions?: string;
    modifierIds?: string[];
  }>;
}) {
  // Generate order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  // Calculate totals (in cents)
  const subtotal = data.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + tax;

  // Create the order
  const order = await keystoneContext.query.RestaurantOrder.createOne({
    data: {
      orderNumber,
      orderType: data.orderType,
      status: 'open',
      guestCount: data.guestCount || 1,
      specialInstructions: data.specialInstructions || '',
      subtotal,
      tax,
      total,
      tables: data.tableId ? { connect: { id: data.tableId } } : undefined,
    },
    query: 'id orderNumber'
  });

  // Create order items
  for (const item of data.items) {
    await keystoneContext.query.OrderItem.createOne({
      data: {
        quantity: item.quantity,
        price: item.price,
        specialInstructions: item.specialInstructions || '',
        order: { connect: { id: order.id } },
        menuItem: { connect: { id: item.menuItemId } },
        appliedModifiers: item.modifierIds?.length
          ? { connect: item.modifierIds.map(id => ({ id })) }
          : undefined,
      },
      query: 'id'
    });
  }

  return order;
}

export async function getOrder(id: string) {
  return keystoneContext.query.RestaurantOrder.findOne({
    where: { id },
    query: `
      id
      orderNumber
      orderType
      status
      guestCount
      specialInstructions
      subtotal
      tax
      tip
      total
      createdAt
      table {
        id
        tableNumber
      }
      items {
        id
        quantity
        price
        specialInstructions
        menuItem {
          id
          name
          description { document }
        }
        appliedModifiers {
          id
          name
          priceAdjustment
        }
      }
    `
  });
}

export async function getOrderByNumber(orderNumber: string) {
  const orders = await keystoneContext.query.RestaurantOrder.findMany({
    where: { orderNumber: { equals: orderNumber } },
    take: 1,
    query: `
      id
      orderNumber
      orderType
      status
      guestCount
      specialInstructions
      subtotal
      tax
      tip
      total
      createdAt
      table {
        id
        tableNumber
      }
      items {
        id
        quantity
        price
        specialInstructions
        menuItem {
          id
          name
          description { document }
        }
        appliedModifiers {
          id
          name
          priceAdjustment
        }
      }
    `
  });

  return orders[0] || null;
}

export async function getMenuItemsWithFilters({
  categoryId,
  dietaryFlags,
  mealPeriods,
  sortBy = 'name',
  page = 1,
  limit = 12,
}: {
  categoryId?: string;
  dietaryFlags?: string[];
  mealPeriods?: string[];
  sortBy?: 'name' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    available: { equals: true },
  };

  if (categoryId) {
    where.category = { id: { equals: categoryId } };
  }

  if (dietaryFlags && dietaryFlags.length > 0) {
    where.dietaryFlags = { hasSome: dietaryFlags };
  }

  if (mealPeriods && mealPeriods.length > 0) {
    where.mealPeriods = { hasSome: mealPeriods };
  }

  // Build orderBy clause
  let orderBy: any = { name: 'asc' };
  if (sortBy === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (sortBy === 'price_desc') {
    orderBy = { price: 'desc' };
  }

  const items = await keystoneContext.query.MenuItem.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    query: `
      id
      name
      description { document }
      price
      prepTime
      kitchenStation
      allergens
      dietaryFlags
      mealPeriods
      image {
        url
        width
        height
      }
      category {
        id
        name
      }
      modifiers {
        id
        name
        modifierGroup
        priceAdjustment
        defaultSelected
      }
    `
  });

  const totalCount = await keystoneContext.query.MenuItem.count({ where });

  return {
    items,
    totalCount,
    hasMore: skip + items.length < totalCount,
    currentPage: page,
  };
}

export async function getFeaturedMenuItems({ take = 8 }: { take?: number } = {}) {
  return keystoneContext.query.MenuItem.findMany({
    where: {
      available: { equals: true },
      featured: { equals: true },
    },
    orderBy: { name: 'asc' },
    take,
    query: `
      id
      name
      description { document }
      price
      prepTime
      allergens
      dietaryFlags
      image {
        url
        width
        height
      }
      category {
        id
        name
      }
    `
  });
}

import { startOfDay, endOfDay, subDays, subMonths, format, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  orderSource: string;
  status: string;
  guestCount: number;
  subtotal: string;
  tax: string;
  tip: string;
  discount: string;
  total: string;
  createdAt: string;
  table?: { id: string; tableNumber: string };
  server?: { id: string; name: string };
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menuItem?: {
    id: string;
    name: string;
    category?: { id: string; name: string };
  };
}

export interface Payment {
  id: string;
  amount: string;
  status: string;
  paymentMethod: string;
  tipAmount: string;
  createdAt: string;
}

export const getDateRange = (period: string) => {
  const endDate = endOfDay(new Date());
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = startOfDay(subDays(new Date(), 6));
      break;
    case '30d':
      startDate = startOfDay(subDays(new Date(), 29));
      break;
    case '90d':
      startDate = startOfDay(subDays(new Date(), 89));
      break;
    case '12m':
      startDate = startOfDay(subMonths(new Date(), 12));
      break;
    default:
      startDate = startOfDay(subDays(new Date(), 29));
  }

  return { 
    startDate: startDate.toISOString(), 
    endDate: endDate.toISOString() 
  };
};

export const getPreviousPeriodRange = (period: string, customStartDate?: string, customEndDate?: string) => {
  if (customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousEndDate = endOfDay(subDays(start, 1));
    const previousStartDate = startOfDay(subDays(start, diffDays));
    
    return {
      startDate: previousStartDate.toISOString(),
      endDate: previousEndDate.toISOString()
    };
  }

  const currentRange = getDateRange(period);
  const currentStart = new Date(currentRange.startDate);
  
  let previousStartDate: Date;
  let previousEndDate: Date;

  switch (period) {
    case '7d':
      previousEndDate = endOfDay(subDays(currentStart, 1));
      previousStartDate = startOfDay(subDays(currentStart, 7));
      break;
    case '30d':
      previousEndDate = endOfDay(subDays(currentStart, 1));
      previousStartDate = startOfDay(subDays(currentStart, 30));
      break;
    case '90d':
      previousEndDate = endOfDay(subDays(currentStart, 1));
      previousStartDate = startOfDay(subDays(currentStart, 90));
      break;
    case '12m':
      previousEndDate = endOfDay(subDays(currentStart, 1));
      previousStartDate = startOfDay(subMonths(currentStart, 12));
      break;
    default:
      previousEndDate = endOfDay(subDays(currentStart, 1));
      previousStartDate = startOfDay(subDays(currentStart, 30));
  }

  return {
    startDate: previousStartDate.toISOString(),
    endDate: previousEndDate.toISOString()
  };
};

export const calculatePercentageChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
  }
  
  const change = ((current - previous) / previous) * 100;
  return { 
    value: Math.abs(change), 
    isPositive: change >= 0 
  };
};

export const parseDecimal = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
};

export const calculateSalesMetrics = (orders: RestaurantOrder[], previousOrders?: RestaurantOrder[]) => {
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const totalRevenue = completedOrders.reduce((sum, order) => sum + parseDecimal(order.total), 0);
  const totalTax = completedOrders.reduce((sum, order) => sum + parseDecimal(order.tax), 0);
  const totalTips = completedOrders.reduce((sum, order) => sum + parseDecimal(order.tip), 0);
  const totalDiscounts = completedOrders.reduce((sum, order) => sum + parseDecimal(order.discount), 0);
  
  const totalGuests = completedOrders.reduce((sum, order) => sum + (order.guestCount || 1), 0);
  const averageCheckSize = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const revenuePerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0;

  const ordersByType = {
    dine_in: completedOrders.filter(o => o.orderType === 'dine_in').length,
    takeout: completedOrders.filter(o => o.orderType === 'takeout').length,
    delivery: completedOrders.filter(o => o.orderType === 'delivery').length,
  };

  const ordersBySource = {
    pos: completedOrders.filter(o => o.orderSource === 'pos').length,
    online: completedOrders.filter(o => o.orderSource === 'online').length,
    kiosk: completedOrders.filter(o => o.orderSource === 'kiosk').length,
    phone: completedOrders.filter(o => o.orderSource === 'phone').length,
  };

  const revenueByType = {
    dine_in: completedOrders.filter(o => o.orderType === 'dine_in').reduce((sum, o) => sum + parseDecimal(o.total), 0),
    takeout: completedOrders.filter(o => o.orderType === 'takeout').reduce((sum, o) => sum + parseDecimal(o.total), 0),
    delivery: completedOrders.filter(o => o.orderType === 'delivery').reduce((sum, o) => sum + parseDecimal(o.total), 0),
  };

  let previousRevenue = 0;
  let previousOrdersCount = 0;
  let previousAverageCheck = 0;
  let previousGuests = 0;

  if (previousOrders && previousOrders.length > 0) {
    const prevCompleted = previousOrders.filter(o => o.status === 'completed');
    previousOrdersCount = prevCompleted.length;
    previousRevenue = prevCompleted.reduce((sum, order) => sum + parseDecimal(order.total), 0);
    previousAverageCheck = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;
    previousGuests = prevCompleted.reduce((sum, order) => sum + (order.guestCount || 1), 0);
  }

  return {
    totalOrders,
    completedOrders: completedOrders.length,
    totalRevenue,
    totalTax,
    totalTips,
    totalDiscounts,
    totalGuests,
    averageCheckSize,
    revenuePerGuest,
    ordersByType,
    ordersBySource,
    revenueByType,
    previousRevenue,
    previousOrders: previousOrdersCount,
    previousAverageCheck,
    previousGuests,
  };
};

export const calculateDaypartMetrics = (orders: RestaurantOrder[]) => {
  const dayparts = {
    breakfast: { orders: 0, revenue: 0, startHour: 6, endHour: 11 },
    lunch: { orders: 0, revenue: 0, startHour: 11, endHour: 15 },
    dinner: { orders: 0, revenue: 0, startHour: 15, endHour: 22 },
    lateNight: { orders: 0, revenue: 0, startHour: 22, endHour: 6 },
  };

  orders.filter(o => o.status === 'completed').forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    const revenue = parseDecimal(order.total);
    
    if (hour >= 6 && hour < 11) {
      dayparts.breakfast.orders++;
      dayparts.breakfast.revenue += revenue;
    } else if (hour >= 11 && hour < 15) {
      dayparts.lunch.orders++;
      dayparts.lunch.revenue += revenue;
    } else if (hour >= 15 && hour < 22) {
      dayparts.dinner.orders++;
      dayparts.dinner.revenue += revenue;
    } else {
      dayparts.lateNight.orders++;
      dayparts.lateNight.revenue += revenue;
    }
  });

  return dayparts;
};

export const calculatePaymentMethodBreakdown = (payments: Payment[]) => {
  const breakdown: Record<string, { count: number; total: number }> = {};

  payments.filter(p => p.status === 'succeeded').forEach(payment => {
    const method = payment.paymentMethod || 'unknown';
    if (!breakdown[method]) {
      breakdown[method] = { count: 0, total: 0 };
    }
    breakdown[method].count++;
    breakdown[method].total += parseDecimal(payment.amount);
  });

  return breakdown;
};

export const generateTimeSeriesData = (
  orders: RestaurantOrder[], 
  startDate: string | Date, 
  endDate: string | Date, 
  interval: 'day' | 'month' = 'day'
) => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const dates = interval === 'day' 
    ? eachDayOfInterval({ start, end })
    : eachMonthOfInterval({ start, end });

  const dataMap = orders.reduce((acc, order) => {
    const key = format(new Date(order.createdAt), interval === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM');
    if (!acc[key]) {
      acc[key] = { revenue: 0, orders: 0, guests: 0 };
    }
    
    acc[key].revenue += parseDecimal(order.total);
    acc[key].orders += 1;
    acc[key].guests += order.guestCount || 1;
    return acc;
  }, {} as Record<string, { revenue: number; orders: number; guests: number }>);

  return dates.map(date => {
    const key = format(date, interval === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM');
    const data = dataMap[key] || { revenue: 0, orders: 0, guests: 0 };
    
    return {
      date: format(date, interval === 'day' ? 'MMM d' : 'MMM yyyy'),
      dateKey: key,
      revenue: data.revenue,
      orders: data.orders,
      guests: data.guests,
    };
  });
};

export const formatCurrency = (amount: number, config?: { currencyCode?: string; locale?: string }) => {
  const currencyCode = config?.currencyCode || 'USD';
  const locale = config?.locale || 'en-US';
  
  // Basic no-division currency check - mirrored from storefront/lib/currency
  const NO_DIVISION_CURRENCIES = [
    "krw", "jpy", "vnd", "clp", "pyg", "xaf", "xof", "bif", "djf", "gnf", "kmf", "mga", "rwf", "xpf", "htg", "vuv", "xag", "xdr", "xau"
  ];
  
  const shouldDivideBy100 = !NO_DIVISION_CURRENCIES.includes(currencyCode.toLowerCase());
  const value = shouldDivideBy100 ? amount / 100 : amount;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export interface MenuItemPerformance {
  id: string;
  name: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  percentageOfSales: number;
}

export interface CategoryPerformance {
  id: string;
  name: string;
  revenue: number;
  itemsSold: number;
  itemCount: number;
  percentageOfSales: number;
}

export const calculateMenuItemPerformance = (orderItems: any[]): MenuItemPerformance[] => {
  const itemMap = new Map<string, {
    id: string;
    name: string;
    categoryName: string;
    quantitySold: number;
    revenue: number;
  }>();

  orderItems.forEach(item => {
    if (!item.menuItem) return;
    
    const id = item.menuItem.id;
    const existing = itemMap.get(id);
    const itemRevenue = parseDecimal(item.price) * (item.quantity || 1);
    
    if (existing) {
      existing.quantitySold += item.quantity || 1;
      existing.revenue += itemRevenue;
    } else {
      itemMap.set(id, {
        id,
        name: item.menuItem.name || 'Unknown',
        categoryName: item.menuItem.category?.name || 'Uncategorized',
        quantitySold: item.quantity || 1,
        revenue: itemRevenue,
      });
    }
  });

  const items = Array.from(itemMap.values());
  const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0);

  return items
    .map(item => ({
      ...item,
      percentageOfSales: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
};

export const calculateCategoryPerformance = (orderItems: any[]): CategoryPerformance[] => {
  const categoryMap = new Map<string, {
    id: string;
    name: string;
    revenue: number;
    itemsSold: number;
    productIds: Set<string>;
  }>();

  orderItems.forEach(item => {
    if (!item.menuItem?.category) return;
    
    const categoryId = item.menuItem.category.id;
    const categoryName = item.menuItem.category.name;
    const existing = categoryMap.get(categoryId);
    const itemRevenue = parseDecimal(item.price) * (item.quantity || 1);
    
    if (existing) {
      existing.itemsSold += item.quantity || 1;
      existing.revenue += itemRevenue;
      existing.productIds.add(item.menuItem.id);
    } else {
      const productIds = new Set<string>();
      productIds.add(item.menuItem.id);
      categoryMap.set(categoryId, {
        id: categoryId,
        name: categoryName,
        itemsSold: item.quantity || 1,
        revenue: itemRevenue,
        productIds,
      });
    }
  });

  const categories = Array.from(categoryMap.values());
  const totalRevenue = categories.reduce((sum, cat) => sum + cat.revenue, 0);

  return categories
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      revenue: cat.revenue,
      itemsSold: cat.itemsSold,
      itemCount: cat.productIds.size,
      percentageOfSales: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
};

import type { Context } from ".keystone/types";
import { permissions } from "../access";
import { calculateRestaurantTotals } from "../../lib/restaurant-order-pricing";

interface POSOrderItemInput {
  menuItemId: string;
  quantity: number;
  courseNumber?: number;
}

interface CreatePOSOrderArgs {
  orderType: "dine_in" | "takeout";
  guestCount?: number;
  tableIds?: string[];
  isUrgent?: boolean;
  specialInstructions?: string | null;
  items: POSOrderItemInput[];
}

function generateOrderNumber(): string {
  const now = new Date();
  return `${now.toISOString().slice(2, 10).replace(/-/g, "")}-${now.getTime().toString().slice(-4)}`;
}

function getCourseType(courseNumber: number) {
  if (courseNumber === 1) return "appetizers";
  if (courseNumber === 2) return "mains";
  if (courseNumber === 3) return "desserts";
  return "mains";
}

export default async function createPOSOrder(
  root: any,
  args: CreatePOSOrderArgs,
  context: Context
) {
  if (!permissions.canManageOrders({ session: context.session })) {
    throw new Error("Not authorized to create POS orders");
  }

  const orderType = args.orderType || "dine_in";
  const items = (args.items || []).filter((item) => item?.menuItemId && (item.quantity || 0) > 0);
  const tableIds = args.tableIds || [];

  if (items.length === 0) {
    throw new Error("Order must include at least one item");
  }

  if (orderType === "dine_in" && tableIds.length === 0) {
    throw new Error("Dine-in orders require at least one table");
  }

  const sudo = context.sudo();

  const [storeSettings, menuItems] = await Promise.all([
    sudo.query.StoreSettings.findOne({
      where: { id: "1" },
      query: "currencyCode taxRate",
    }),
    sudo.query.MenuItem.findMany({
      where: { id: { in: items.map((item) => item.menuItemId) } },
      query: "id price available",
    }),
  ]);

  const menuItemMap = new Map(menuItems.map((item: any) => [item.id, item]));

  const normalizedItems = items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItemId}`);
    }
    if (!menuItem.available) {
      throw new Error("One or more selected menu items are unavailable");
    }

    return {
      menuItemId: item.menuItemId,
      quantity: Math.max(1, item.quantity),
      courseNumber: item.courseNumber || 1,
      price: Number(menuItem.price || 0),
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currencyCode = storeSettings?.currencyCode || "USD";
  const { tax, total } = calculateRestaurantTotals({
    subtotal,
    orderType,
    taxRate: storeSettings?.taxRate,
    currencyCode,
  });

  const order = await sudo.db.RestaurantOrder.createOne({
    data: {
      orderNumber: generateOrderNumber(),
      orderType,
      orderSource: "pos",
      status: "open",
      guestCount: Math.max(1, args.guestCount || 1),
      subtotal,
      tax,
      total,
      isUrgent: Boolean(args.isUrgent),
      specialInstructions: args.specialInstructions || "",
      currencyCode,
      tables: tableIds.length ? { connect: tableIds.map((id) => ({ id })) } : undefined,
      server: context.session?.itemId ? { connect: { id: context.session.itemId } } : undefined,
      createdBy: context.session?.itemId ? { connect: { id: context.session.itemId } } : undefined,
    },
  });

  const courseMap = new Map<number, string>();

  for (const item of normalizedItems) {
    if (!courseMap.has(item.courseNumber)) {
      const course = await sudo.db.OrderCourse.createOne({
        data: {
          order: { connect: { id: order.id } },
          courseNumber: item.courseNumber,
          courseType: getCourseType(item.courseNumber),
          status: "pending",
        },
      });
      courseMap.set(item.courseNumber, course.id);
    }

    await sudo.db.OrderItem.createOne({
      data: {
        order: { connect: { id: order.id } },
        course: { connect: { id: courseMap.get(item.courseNumber)! } },
        menuItem: { connect: { id: item.menuItemId } },
        quantity: item.quantity,
        price: item.price,
        courseNumber: item.courseNumber,
      },
    });
  }

  return sudo.query.RestaurantOrder.findOne({
    where: { id: order.id },
    query: "id orderNumber status subtotal tax total",
  });
}

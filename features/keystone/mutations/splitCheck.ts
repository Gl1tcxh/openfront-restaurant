import type { Context } from ".keystone/types";
import { calculateRestaurantTotals } from "../../lib/restaurant-order-pricing";
import { permissions } from "../access";
import { getStoreDeliverySettings } from "../utils/deliveryValidation";

interface SplitCheckByItemArgs {
  orderId: string;
  itemIds: string[];
}

interface SplitCheckByGuestArgs {
  orderId: string;
  guestCount: number;
}

interface SplitCheckResult {
  success: boolean;
  newOrderIds: string[];
  error: string | null;
}

function cents(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

async function calculateTotalsFromItems(
  items: Array<{ quantity?: number | null; price?: number | null }>,
  orderType: string | null | undefined,
  context: Context
) {
  const settings = await getStoreDeliverySettings(context);
  const subtotal = items.reduce((sum, item) => {
    return sum + cents(item.price) * (item.quantity || 0);
  }, 0);
  const { tax, total } = calculateRestaurantTotals({
    subtotal,
    orderType,
    taxRate: settings?.taxRate,
    currencyCode: settings?.currencyCode || "USD",
  });
  return { subtotal, tax, total };
}

function buildSplitOrderNumber(suffix: string) {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const timePart = now.getTime().toString().slice(-4);
  return `${datePart}-${timePart}-${suffix}`;
}

// Split check by moving selected items to a new order
export async function splitCheckByItem(
  root: any,
  args: SplitCheckByItemArgs,
  context: Context
): Promise<SplitCheckResult> {
  if (!permissions.canManageOrders({ session: context.session })) {
    return {
      success: false,
      newOrderIds: [],
      error: "Not authorized to split check",
    };
  }

  const { orderId, itemIds } = args;

  if (!itemIds || itemIds.length === 0) {
    return {
      success: false,
      newOrderIds: [],
      error: "Must select at least one item to split",
    };
  }

  try {
    const originalOrder = await context.query.RestaurantOrder.findOne({
      where: { id: orderId },
      query: 'id orderNumber orderType orderSource status specialInstructions server { id } tables { id }',
    });

    if (!originalOrder) {
      return {
        success: false,
        newOrderIds: [],
        error: "Order not found",
      };
    }

    const itemsToMove = await context.query.OrderItem.findMany({
      where: {
        id: { in: itemIds },
        order: { id: { equals: orderId } },
      },
      query: 'id quantity price',
    });

    if (itemsToMove.length === 0) {
      return {
        success: false,
        newOrderIds: [],
        error: "No valid items found to split",
      };
    }

    const newTotals = await calculateTotalsFromItems(itemsToMove as any, originalOrder.orderType, context);

    const newOrder = await context.db.RestaurantOrder.createOne({
      data: {
        orderNumber: buildSplitOrderNumber('S'),
        orderType: originalOrder.orderType || 'dine_in',
        orderSource: originalOrder.orderSource || 'pos',
        status: originalOrder.status || 'open',
        guestCount: 1,
        subtotal: newTotals.subtotal,
        tax: newTotals.tax,
        total: newTotals.total,
        specialInstructions: originalOrder.specialInstructions
          ? `${originalOrder.specialInstructions} | Split from ${originalOrder.orderNumber}`
          : `Split from ${originalOrder.orderNumber}`,
        tables: (originalOrder.tables || []).length
          ? { connect: (originalOrder.tables || []).map((t: any) => ({ id: t.id })) }
          : undefined,
        server: originalOrder.server?.id
          ? { connect: { id: originalOrder.server.id } }
          : undefined,
      },
    });

    for (const item of itemsToMove) {
      await context.db.OrderItem.updateOne({
        where: { id: item.id },
        data: {
          order: { connect: { id: newOrder.id } },
        },
      });
    }

    const remainingItems = await context.query.OrderItem.findMany({
      where: {
        order: { id: { equals: orderId } },
      },
      query: 'id quantity price',
    });

    const remainingTotals = await calculateTotalsFromItems(remainingItems as any, originalOrder.orderType, context);

    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        subtotal: remainingTotals.subtotal,
        tax: remainingTotals.tax,
        total: remainingTotals.total,
      },
    });

    return {
      success: true,
      newOrderIds: [newOrder.id],
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error splitting check by item: ${errorMessage}`);

    return {
      success: false,
      newOrderIds: [],
      error: errorMessage,
    };
  }
}

// Split check evenly by guest count
export async function splitCheckByGuest(
  root: any,
  args: SplitCheckByGuestArgs,
  context: Context
): Promise<SplitCheckResult> {
  if (!permissions.canManageOrders({ session: context.session })) {
    return {
      success: false,
      newOrderIds: [],
      error: "Not authorized to split check",
    };
  }

  const { orderId, guestCount } = args;

  if (guestCount < 2) {
    return {
      success: false,
      newOrderIds: [],
      error: "Guest count must be at least 2 to split",
    };
  }

  try {
    const originalOrder = await context.query.RestaurantOrder.findOne({
      where: { id: orderId },
      query: 'id orderNumber orderType orderSource status specialInstructions total subtotal tax server { id } tables { id }',
    });

    if (!originalOrder) {
      return {
        success: false,
        newOrderIds: [],
        error: "Order not found",
      };
    }

    const totalAmount = cents(originalOrder.total);
    const totalSubtotal = cents(originalOrder.subtotal);
    const totalTax = cents(originalOrder.tax);

    const splitTotalBase = Math.floor(totalAmount / guestCount);
    const splitSubtotalBase = Math.floor(totalSubtotal / guestCount);
    const splitTaxBase = Math.floor(totalTax / guestCount);

    let totalRemainder = totalAmount - splitTotalBase * guestCount;
    let subtotalRemainder = totalSubtotal - splitSubtotalBase * guestCount;
    let taxRemainder = totalTax - splitTaxBase * guestCount;

    const newOrderIds: string[] = [];

    for (let i = 1; i < guestCount; i++) {
      const thisTotal = splitTotalBase + (totalRemainder > 0 ? 1 : 0);
      const thisSubtotal = splitSubtotalBase + (subtotalRemainder > 0 ? 1 : 0);
      const thisTax = splitTaxBase + (taxRemainder > 0 ? 1 : 0);

      if (totalRemainder > 0) totalRemainder -= 1;
      if (subtotalRemainder > 0) subtotalRemainder -= 1;
      if (taxRemainder > 0) taxRemainder -= 1;

      const newOrder = await context.db.RestaurantOrder.createOne({
        data: {
          orderNumber: buildSplitOrderNumber(`G${i + 1}`),
          orderType: originalOrder.orderType || 'dine_in',
          orderSource: originalOrder.orderSource || 'pos',
          status: originalOrder.status || 'open',
          guestCount: 1,
          subtotal: thisSubtotal,
          tax: thisTax,
          total: thisTotal,
          specialInstructions: `Split from order ${originalOrder.orderNumber} (Guest ${i + 1} of ${guestCount})`,
          tables: (originalOrder.tables || []).length
            ? { connect: (originalOrder.tables || []).map((t: any) => ({ id: t.id })) }
            : undefined,
          server: originalOrder.server?.id
            ? { connect: { id: originalOrder.server.id } }
            : undefined,
        },
      });

      newOrderIds.push(newOrder.id);
    }

    const originalTotal = splitTotalBase + (totalRemainder > 0 ? 1 : 0);
    const originalSubtotal = splitSubtotalBase + (subtotalRemainder > 0 ? 1 : 0);
    const originalTax = splitTaxBase + (taxRemainder > 0 ? 1 : 0);

    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        guestCount: 1,
        subtotal: originalSubtotal,
        tax: originalTax,
        total: originalTotal,
        specialInstructions: originalOrder.specialInstructions
          ? `${originalOrder.specialInstructions} | Split check (Guest 1 of ${guestCount})`
          : `Split check (Guest 1 of ${guestCount})`,
      },
    });

    return {
      success: true,
      newOrderIds,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error splitting check by guest: ${errorMessage}`);

    return {
      success: false,
      newOrderIds: [],
      error: errorMessage,
    };
  }
}

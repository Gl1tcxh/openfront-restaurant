import type { Context } from ".keystone/types";
import { calculateRestaurantTotals } from "../../lib/restaurant-order-pricing";
import { permissions } from "../access";
import { getStoreDeliverySettings } from "../utils/deliveryValidation";

interface VoidItemArgs {
  orderItemId: string;
  reason: string;
}

interface CompItemArgs {
  orderItemId: string;
  reason: string;
  compAmount?: number; // Partial comp amount in cents, or null for full comp
}

interface VoidOrderArgs {
  orderId: string;
  reason: string;
}

interface VoidCompResult {
  success: boolean;
  requiresManagerApproval: boolean;
  adjustedAmount: number | null;
  error: string | null;
}

function canManageOrders(context: Context): boolean {
  return permissions.canManageOrders({ session: context.session });
}

async function recalculateOrderTotals({
  order,
  subtotal,
  context,
}: {
  order: any;
  subtotal: number;
  context: Context;
}) {
  const settings = await getStoreDeliverySettings(context);
  const safeSubtotal = Math.max(0, subtotal);
  const { tax } = calculateRestaurantTotals({
    subtotal: safeSubtotal,
    orderType: order.orderType,
    taxRate: settings?.taxRate,
    currencyCode: settings?.currencyCode || order.currencyCode || "USD",
  });

  const tip = Math.max(0, order.tip || 0);
  const discount = Math.max(0, order.discount || 0);
  const total = Math.max(0, safeSubtotal + tax + tip - discount);

  return {
    subtotal: safeSubtotal,
    tax: Math.max(0, tax),
    total,
  };
}

// Void an individual order item
export async function voidOrderItem(
  root: any,
  args: VoidItemArgs,
  context: Context
): Promise<VoidCompResult> {
  if (!canManageOrders(context)) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Not authorized to void items",
    };
  }

  const { orderItemId, reason } = args;

  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for void",
    };
  }

  try {
    const orderItem = await context.db.OrderItem.findOne({
      where: { id: orderItemId },
    });

    if (!orderItem) {
      return {
        success: false,
        requiresManagerApproval: false,
        adjustedAmount: null,
        error: "Order item not found",
      };
    }

    const voidAmount = (orderItem.price || 0) * (orderItem.quantity || 0);

    await context.db.OrderItem.deleteOne({
      where: { id: orderItemId },
    });

    if (orderItem.orderId) {
      const order = await context.db.RestaurantOrder.findOne({
        where: { id: orderItem.orderId },
      });

      if (order) {
        const totals = await recalculateOrderTotals({
          order,
          subtotal: (order.subtotal || 0) - voidAmount,
          context,
        });

        await context.db.RestaurantOrder.updateOne({
          where: { id: orderItem.orderId },
          data: {
            ...totals,
            specialInstructions: order.specialInstructions
              ? `${order.specialInstructions} | VOID: ${reason}`
              : `VOID: ${reason}`,
          },
        });
      }
    }

    return {
      success: true,
      requiresManagerApproval: false,
      adjustedAmount: voidAmount,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error voiding item: ${errorMessage}`);

    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: errorMessage,
    };
  }
}

// Comp an individual order item (full or partial)
export async function compOrderItem(
  root: any,
  args: CompItemArgs,
  context: Context
): Promise<VoidCompResult> {
  if (!canManageOrders(context)) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Not authorized to comp items",
    };
  }

  const { orderItemId, reason, compAmount } = args;

  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for comp",
    };
  }

  try {
    const orderItem = await context.db.OrderItem.findOne({
      where: { id: orderItemId },
    });

    if (!orderItem) {
      return {
        success: false,
        requiresManagerApproval: false,
        adjustedAmount: null,
        error: "Order item not found",
      };
    }

    const itemTotal = (orderItem.price || 0) * (orderItem.quantity || 0);
    const actualCompAmount = compAmount !== undefined && compAmount !== null
      ? Math.min(compAmount, itemTotal)
      : itemTotal;

    const perItemComp = Math.floor(actualCompAmount / (orderItem.quantity || 1));
    const newPrice = (orderItem.price || 0) - perItemComp;

    if (newPrice <= 0) {
      await context.db.OrderItem.deleteOne({
        where: { id: orderItemId },
      });
    } else {
      await context.db.OrderItem.updateOne({
        where: { id: orderItemId },
        data: {
          price: newPrice,
          specialInstructions: orderItem.specialInstructions
            ? `${orderItem.specialInstructions} | COMP: ${reason}`
            : `COMP: ${reason}`,
        },
      });
    }

    if (orderItem.orderId) {
      const order = await context.db.RestaurantOrder.findOne({
        where: { id: orderItem.orderId },
      });

      if (order) {
        const totals = await recalculateOrderTotals({
          order,
          subtotal: (order.subtotal || 0) - actualCompAmount,
          context,
        });

        await context.db.RestaurantOrder.updateOne({
          where: { id: orderItem.orderId },
          data: {
            ...totals,
            specialInstructions: order.specialInstructions
              ? `${order.specialInstructions} | COMP: ${reason}`
              : `COMP: ${reason}`,
          },
        });
      }
    }

    return {
      success: true,
      requiresManagerApproval: false,
      adjustedAmount: actualCompAmount,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error comping item: ${errorMessage}`);

    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: errorMessage,
    };
  }
}

// Void entire order
export async function voidOrder(
  root: any,
  args: VoidOrderArgs,
  context: Context
): Promise<VoidCompResult> {
  if (!canManageOrders(context)) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Not authorized to void orders",
    };
  }

  const { orderId, reason } = args;

  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for void",
    };
  }

  try {
    const order = await context.db.RestaurantOrder.findOne({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        requiresManagerApproval: false,
        adjustedAmount: null,
        error: "Order not found",
      };
    }

    const voidAmount = order.total || 0;

    const orderItems = await context.db.OrderItem.findMany({
      where: { order: { id: { equals: orderId } } },
    });

    for (const item of orderItems) {
      await context.db.OrderItem.deleteOne({
        where: { id: item.id },
      });
    }

    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        status: "cancelled",
        subtotal: 0,
        tax: 0,
        total: 0,
        specialInstructions: order.specialInstructions
          ? `${order.specialInstructions} | VOIDED: ${reason}`
          : `VOIDED: ${reason}`,
      },
    });

    return {
      success: true,
      requiresManagerApproval: false,
      adjustedAmount: voidAmount,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error voiding order: ${errorMessage}`);

    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: errorMessage,
    };
  }
}

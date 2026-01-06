import type { Context } from ".keystone/types";

interface VoidItemArgs {
  orderItemId: string;
  reason: string;
  managerApproval?: boolean;
  managerId?: string;
}

interface CompItemArgs {
  orderItemId: string;
  reason: string;
  compAmount?: number; // Partial comp amount in cents, or null for full comp
  managerApproval?: boolean;
  managerId?: string;
}

interface VoidOrderArgs {
  orderId: string;
  reason: string;
  managerApproval?: boolean;
  managerId?: string;
}

interface VoidCompResult {
  success: boolean;
  requiresManagerApproval: boolean;
  adjustedAmount: number | null;
  error: string | null;
}

// Check if user has manager permissions
async function hasManagerPermission(context: Context): Promise<boolean> {
  if (!context.session?.itemId) return false;

  const user = await context.db.User.findOne({
    where: { id: context.session.itemId },
  });

  if (!user || !user.roleId) return false;

  const role = await context.db.Role.findOne({
    where: { id: user.roleId },
  });

  // Manager needs canManageAllTodos permission (or we could add specific void/comp permissions)
  return role?.canManageAllTodos === true;
}

// Void an individual order item
export async function voidOrderItem(
  root: any,
  args: VoidItemArgs,
  context: Context
): Promise<VoidCompResult> {
  if (!context.session?.itemId) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Must be signed in to void items",
    };
  }

  const { orderItemId, reason, managerApproval, managerId } = args;

  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for void",
    };
  }

  try {
    // Get the order item
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

    // Check if manager approval is needed
    const isManager = await hasManagerPermission(context);

    if (!isManager && !managerApproval) {
      return {
        success: false,
        requiresManagerApproval: true,
        adjustedAmount: null,
        error: "Manager approval required for void",
      };
    }

    // Calculate the void amount
    const voidAmount = parseFloat(String(orderItem.price)) * (orderItem.quantity as number);

    // Delete the order item
    await context.db.OrderItem.deleteOne({
      where: { id: orderItemId },
    });

    // Update the order totals
    if (orderItem.orderId) {
      const order = await context.db.RestaurantOrder.findOne({
        where: { id: orderItem.orderId },
      });

      if (order) {
        const currentSubtotal = parseFloat(String(order.subtotal)) - voidAmount;
        const newTax = currentSubtotal * 0.08;
        const newTotal = currentSubtotal + newTax;

        await context.db.RestaurantOrder.updateOne({
          where: { id: orderItem.orderId },
          data: {
            subtotal: Math.max(0, currentSubtotal).toFixed(2),
            tax: Math.max(0, newTax).toFixed(2),
            total: Math.max(0, newTotal).toFixed(2),
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
      adjustedAmount: Math.round(voidAmount * 100), // Return in cents
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
  if (!context.session?.itemId) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Must be signed in to comp items",
    };
  }

  const { orderItemId, reason, compAmount, managerApproval, managerId } = args;

  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for comp",
    };
  }

  try {
    // Get the order item
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

    // Check if manager approval is needed
    const isManager = await hasManagerPermission(context);

    if (!isManager && !managerApproval) {
      return {
        success: false,
        requiresManagerApproval: true,
        adjustedAmount: null,
        error: "Manager approval required for comp",
      };
    }

    // Calculate the comp amount
    const itemTotal = parseFloat(String(orderItem.price)) * (orderItem.quantity as number);
    const actualCompAmount = compAmount
      ? Math.min(compAmount / 100, itemTotal) // Convert cents to dollars, cap at item total
      : itemTotal; // Full comp

    // Update the order item price to reflect comp
    const newPrice = parseFloat(String(orderItem.price)) - (actualCompAmount / (orderItem.quantity as number));

    if (newPrice <= 0) {
      // Full comp - delete the item
      await context.db.OrderItem.deleteOne({
        where: { id: orderItemId },
      });
    } else {
      // Partial comp - update the price
      await context.db.OrderItem.updateOne({
        where: { id: orderItemId },
        data: {
          price: newPrice.toFixed(2),
          specialInstructions: orderItem.specialInstructions
            ? `${orderItem.specialInstructions} | COMP: ${reason}`
            : `COMP: ${reason}`,
        },
      });
    }

    // Update the order totals
    if (orderItem.orderId) {
      const order = await context.db.RestaurantOrder.findOne({
        where: { id: orderItem.orderId },
      });

      if (order) {
        const currentSubtotal = parseFloat(String(order.subtotal)) - actualCompAmount;
        const newTax = currentSubtotal * 0.08;
        const newTotal = currentSubtotal + newTax;

        await context.db.RestaurantOrder.updateOne({
          where: { id: orderItem.orderId },
          data: {
            subtotal: Math.max(0, currentSubtotal).toFixed(2),
            tax: Math.max(0, newTax).toFixed(2),
            total: Math.max(0, newTotal).toFixed(2),
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
      adjustedAmount: Math.round(actualCompAmount * 100), // Return in cents
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
  if (!context.session?.itemId) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Must be signed in to void orders",
    };
  }

  const { orderId, reason, managerApproval, managerId } = args;

  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for void",
    };
  }

  try {
    // Get the order
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

    // Check if manager approval is needed
    const isManager = await hasManagerPermission(context);

    if (!isManager && !managerApproval) {
      return {
        success: false,
        requiresManagerApproval: true,
        adjustedAmount: null,
        error: "Manager approval required for void",
      };
    }

    const voidAmount = parseFloat(String(order.total));

    // Delete all order items
    const orderItems = await context.db.OrderItem.findMany({
      where: { order: { id: { equals: orderId } } },
    });

    for (const item of orderItems) {
      await context.db.OrderItem.deleteOne({
        where: { id: item.id },
      });
    }

    // Update order status to cancelled
    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        status: "cancelled",
        subtotal: "0.00",
        tax: "0.00",
        total: "0.00",
        specialInstructions: order.specialInstructions
          ? `${order.specialInstructions} | VOIDED: ${reason}`
          : `VOIDED: ${reason}`,
      },
    });

    return {
      success: true,
      requiresManagerApproval: false,
      adjustedAmount: Math.round(voidAmount * 100), // Return in cents
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

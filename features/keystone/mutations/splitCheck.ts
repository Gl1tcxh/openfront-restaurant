import type { Context } from ".keystone/types";

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

// Split check by moving selected items to a new order
export async function splitCheckByItem(
  root: any,
  args: SplitCheckByItemArgs,
  context: Context
): Promise<SplitCheckResult> {
  if (!context.session?.itemId) {
    return {
      success: false,
      newOrderIds: [],
      error: "Must be signed in to split check",
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
    // Get the original order
    const originalOrder = await context.db.RestaurantOrder.findOne({
      where: { id: orderId },
    });

    if (!originalOrder) {
      return {
        success: false,
        newOrderIds: [],
        error: "Order not found",
      };
    }

    // Get the items to be moved
    const itemsToMove = await context.db.OrderItem.findMany({
      where: {
        id: { in: itemIds },
        order: { id: { equals: orderId } },
      },
    });

    if (itemsToMove.length === 0) {
      return {
        success: false,
        newOrderIds: [],
        error: "No valid items found to split",
      };
    }

    // Calculate totals for the new order
    let newSubtotal = 0;
    for (const item of itemsToMove) {
      newSubtotal += parseFloat(String(item.price)) * (item.quantity as number);
    }
    const newTax = newSubtotal * 0.08;
    const newTotal = newSubtotal + newTax;

    // Generate new order number
    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
    const timePart = now.getTime().toString().slice(-4);
    const newOrderNumber = `${datePart}-${timePart}-S`;

    // Create new order
    const newOrder = await context.db.RestaurantOrder.createOne({
      data: {
        orderNumber: newOrderNumber,
        orderType: originalOrder.orderType,
        status: originalOrder.status,
        guestCount: 1,
        subtotal: newSubtotal.toFixed(2),
        tax: newTax.toFixed(2),
        total: newTotal.toFixed(2),
        table: originalOrder.tableId
          ? { connect: { id: originalOrder.tableId } }
          : undefined,
        server: originalOrder.serverId
          ? { connect: { id: originalOrder.serverId } }
          : undefined,
      },
    });

    // Move items to new order
    for (const item of itemsToMove) {
      await context.db.OrderItem.updateOne({
        where: { id: item.id },
        data: {
          order: { connect: { id: newOrder.id } },
        },
      });
    }

    // Update original order totals
    const remainingItems = await context.db.OrderItem.findMany({
      where: {
        order: { id: { equals: orderId } },
      },
    });

    let remainingSubtotal = 0;
    for (const item of remainingItems) {
      remainingSubtotal += parseFloat(String(item.price)) * (item.quantity as number);
    }
    const remainingTax = remainingSubtotal * 0.08;
    const remainingTotal = remainingSubtotal + remainingTax;

    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        subtotal: remainingSubtotal.toFixed(2),
        tax: remainingTax.toFixed(2),
        total: remainingTotal.toFixed(2),
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
  if (!context.session?.itemId) {
    return {
      success: false,
      newOrderIds: [],
      error: "Must be signed in to split check",
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
    // Get the original order
    const originalOrder = await context.db.RestaurantOrder.findOne({
      where: { id: orderId },
    });

    if (!originalOrder) {
      return {
        success: false,
        newOrderIds: [],
        error: "Order not found",
      };
    }

    const totalAmount = parseFloat(String(originalOrder.total));
    const splitAmount = totalAmount / guestCount;
    const splitTax = splitAmount * 0.08 / 1.08; // Extract tax from total
    const splitSubtotal = splitAmount - splitTax;

    const newOrderIds: string[] = [];

    // Create new orders for guests 2 through N
    // Guest 1 keeps the original order with reduced amount
    for (let i = 1; i < guestCount; i++) {
      const now = new Date();
      const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
      const timePart = (now.getTime() + i).toString().slice(-4);
      const newOrderNumber = `${datePart}-${timePart}-G${i + 1}`;

      const newOrder = await context.db.RestaurantOrder.createOne({
        data: {
          orderNumber: newOrderNumber,
          orderType: originalOrder.orderType,
          status: originalOrder.status,
          guestCount: 1,
          subtotal: splitSubtotal.toFixed(2),
          tax: splitTax.toFixed(2),
          total: splitAmount.toFixed(2),
          specialInstructions: `Split from order ${originalOrder.orderNumber} (Guest ${i + 1} of ${guestCount})`,
          table: originalOrder.tableId
            ? { connect: { id: originalOrder.tableId } }
            : undefined,
          server: originalOrder.serverId
            ? { connect: { id: originalOrder.serverId } }
            : undefined,
        },
      });

      newOrderIds.push(newOrder.id);
    }

    // Update original order with split amount (for guest 1)
    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        guestCount: 1,
        subtotal: splitSubtotal.toFixed(2),
        tax: splitTax.toFixed(2),
        total: splitAmount.toFixed(2),
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

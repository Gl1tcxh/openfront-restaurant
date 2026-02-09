import type { Context } from ".keystone/types";

interface TransferTableArgs {
  orderId: string;
  fromTableId: string;
  toTableId: string;
}

interface CombineTablesArgs {
  orderId: string;
  tableIds: string[];
}

interface TableManagementResult {
  success: boolean;
  error: string | null;
}

export async function transferTable(
  root: any,
  args: TransferTableArgs,
  context: Context
): Promise<TableManagementResult> {
  if (!context.session?.itemId) {
    return { success: false, error: "Must be signed in" };
  }

  const { orderId, fromTableId, toTableId } = args;
  const sudo = context.sudo();

  try {
    // 1. Move the order to the new table
    await sudo.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        tables: {
          disconnect: [{ id: fromTableId }],
          connect: [{ id: toTableId }]
        }
      }
    });

    // 2. Update table statuses
    // Check if fromTableId still has other active orders
    const fromTableOrders = await sudo.query.RestaurantOrder.count({
      where: {
        tables: { some: { id: { equals: fromTableId } } },
        status: { notIn: ['completed', 'cancelled'] }
      }
    });

    if (fromTableOrders === 0) {
      await sudo.db.Table.updateOne({
        where: { id: fromTableId },
        data: { status: 'cleaning' }
      });
    }

    // Mark target table as occupied
    await sudo.db.Table.updateOne({
      where: { id: toTableId },
      data: { status: 'occupied' }
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function combineTables(
  root: any,
  args: CombineTablesArgs,
  context: Context
): Promise<TableManagementResult> {
  if (!context.session?.itemId) {
    return { success: false, error: "Must be signed in" };
  }

  const { orderId, tableIds } = args;
  const sudo = context.sudo();

  try {
    // 1. Connect all tables to the order
    await sudo.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        tables: {
          connect: tableIds.map(id => ({ id }))
        }
      }
    });

    // 2. Mark all tables as occupied
    await Promise.all(
      tableIds.map(id =>
        sudo.db.Table.updateOne({
          where: { id },
          data: { status: 'occupied' }
        })
      )
    );

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

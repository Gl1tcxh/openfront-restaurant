import type { Context } from ".keystone/types";

/**
 * getCustomerOrders — List orders for the currently authenticated user.
 * Uses sudo() to bypass access control, then filters by customer.id === session.itemId.
 */
export default async function getCustomerOrders(
  root: any,
  { limit = 10, offset = 0 }: { limit?: number; offset?: number },
  context: Context
) {
  if (!context.session?.itemId) {
    throw new Error("Not authenticated");
  }

  const sudoContext = context.sudo();

  const orders = await sudoContext.query.RestaurantOrder.findMany({
    where: {
      customer: { id: { equals: context.session.itemId } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    query: `
      id
      orderNumber
      orderType
      status
      total
      createdAt
      customerName
      orderItems {
        id
        quantity
        price
        menuItem {
          id
          name
        }
      }
    `,
  });

  return orders;
}

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
  const sessionUserId = context.session?.itemId;

  if (!sessionUserId) {
    throw new Error("Not authenticated");
  }

  const sudoContext = context.sudo();
  const currentUser = await sudoContext.query.User.findOne({
    where: { id: sessionUserId },
    query: `email`,
  });
  const whereClauses: any[] = [{ customer: { id: { equals: sessionUserId } } }];

  if (currentUser?.email) {
    whereClauses.push({
      customerEmail: { equals: currentUser.email },
    });
  }

  const orders = await sudoContext.query.RestaurantOrder.findMany({
    where: {
      OR: whereClauses,
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

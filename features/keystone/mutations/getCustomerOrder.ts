import { Context } from ".keystone/types";

export default async function getCustomerOrder(
  root: any,
  { orderId, secretKey }: { orderId: string; secretKey?: string },
  context: Context
) {
  const sudoContext = context.sudo();

  const order = await sudoContext.query.RestaurantOrder.findOne({
    where: { id: orderId },
    query: `
      id
      orderNumber
      orderType
      orderSource
      status
      guestCount
      specialInstructions
      subtotal
      tax
      tip
      discount
      total
      customerName
      customerEmail
      customerPhone
      deliveryAddress
      deliveryCity
      deliveryZip
      secretKey
      createdAt
      updatedAt
      customer {
        id
      }
      orderItems {
        id
        thumbnail
        quantity
        unitPrice
        totalPrice
        specialInstructions
        menuItem {
          id
          name
          price
          thumbnail
        }
        modifiers: appliedModifiers {
          id
          name
          priceAdjustment
        }
      }
      payments {
        id
        amount
        paymentMethod
        status
        createdAt
      }
    `,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // If secretKey is provided, verify it matches
  if (secretKey) {
    if (order.secretKey !== secretKey) {
      throw new Error("Invalid secret key");
    }
    return order;
  }

  // If no secretKey, check user authentication
  if (!context.session?.itemId) {
    throw new Error("Not authenticated");
  }

  // Verify the order belongs to the user
  if (order.customer?.id !== context.session.itemId) {
    throw new Error("Order not found");
  }

  return order;
}

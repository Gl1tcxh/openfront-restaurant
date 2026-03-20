import { Context } from ".keystone/types";

export default async function activeCart(root: any, { cartId }: { cartId?: string }, context: Context) {
  const sudoContext = context.sudo();
  
  if (!cartId) {
    throw new Error("Cart ID is required");
  }

  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      orderType
      subtotal
      email
      customerName
      customerPhone
      deliveryAddress
      deliveryCity
      deliveryZip
      tipPercent
      items {
        id
        quantity
        specialInstructions
        menuItem {
          id
          name
          price
          menuItemImages(take: 1) {
            id
            image {
              url
            }
            imagePath
            altText
          }
        }
        modifiers {
          id
          name
          priceAdjustment
        }
      }
      paymentCollection {
        id
        paymentSessions {
          id
          isSelected
          isInitiated
          amount
          data
          paymentProvider {
            id
            code
          }
        }
      }
      order {
        id
      }
    `
  });

  if (!cart) {
    return null;
  }

  const settings = await sudoContext.query.StoreSettings.findOne({
    where: { id: "1" },
    query: `currencyCode`,
  });

  return {
    ...cart,
    currencyCode: settings?.currencyCode || "USD",
  };
}

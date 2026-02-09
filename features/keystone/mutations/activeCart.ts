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
    `
  });

  return cart || null;
}

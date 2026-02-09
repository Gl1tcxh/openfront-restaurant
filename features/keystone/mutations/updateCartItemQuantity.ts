import { Context } from ".keystone/types";

export default async function updateCartItemQuantity(
  root: any, 
  { cartItemId, quantity }: { cartItemId: string, quantity: number }, 
  context: Context
) {
  const sudoContext = context.sudo();

  // Update cart item quantity
  await sudoContext.db.CartItem.updateOne({
    where: { id: cartItemId },
    data: { quantity }
  });

  // Find the cart this item belongs to
  const cartItem = await sudoContext.query.CartItem.findOne({
    where: { id: cartItemId },
    query: 'cart { id }'
  });

  if (!cartItem?.cart?.id) {
    throw new Error("Cart not found for this item");
  }

  // Return the updated cart
  return await sudoContext.db.Cart.findOne({
    where: { id: cartItem.cart.id }
  });
}

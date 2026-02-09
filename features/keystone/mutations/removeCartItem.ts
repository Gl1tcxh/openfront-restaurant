import { Context } from ".keystone/types";

export default async function removeCartItem(
  root: any, 
  { cartItemId }: { cartItemId: string }, 
  context: Context
) {
  const sudoContext = context.sudo();

  // Find the cart this item belongs to before deleting
  const cartItem = await sudoContext.query.CartItem.findOne({
    where: { id: cartItemId },
    query: 'cart { id }'
  });

  if (!cartItem?.cart?.id) {
    throw new Error("Cart not found for this item");
  }

  const cartId = cartItem.cart.id;

  // Delete cart item
  await sudoContext.db.CartItem.deleteOne({
    where: { id: cartItemId }
  });

  // Return the updated cart
  return await sudoContext.db.Cart.findOne({
    where: { id: cartId }
  });
}

import { Context } from ".keystone/types";
import { assertCanAccessCartItem } from "../utils/cartAccess";

export default async function removeCartItem(
  root: any, 
  { cartItemId }: { cartItemId: string }, 
  context: Context
) {
  const sudoContext = context.sudo();

  const cartItem = await assertCanAccessCartItem(context, cartItemId, "write");
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

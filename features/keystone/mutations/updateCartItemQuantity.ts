import { Context } from ".keystone/types";
import { assertCanAccessCartItem } from "../utils/cartAccess";

export default async function updateCartItemQuantity(
  root: any, 
  { cartItemId, quantity }: { cartItemId: string, quantity: number }, 
  context: Context
) {
  const sudoContext = context.sudo();
  const cartItem = await assertCanAccessCartItem(context, cartItemId, "write");

  // Update cart item quantity
  await sudoContext.db.CartItem.updateOne({
    where: { id: cartItemId },
    data: { quantity }
  });

  // Return the updated cart
  return await sudoContext.db.Cart.findOne({
    where: { id: cartItem.cart.id }
  });
}

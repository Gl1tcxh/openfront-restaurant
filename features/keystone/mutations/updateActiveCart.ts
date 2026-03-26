import { Context } from ".keystone/types";
import { assertCanAccessCart } from "../utils/cartAccess";

export default async function updateActiveCart(root: any, { cartId, data }: { cartId: string, data: any }, context: Context) {
  const sudoContext = context.sudo();

  await assertCanAccessCart(context, cartId, "write");

  // Update cart with modified data
  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data,
  });
}

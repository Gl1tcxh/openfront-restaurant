import { Context } from ".keystone/types";

export default async function updateActiveCart(root: any, { cartId, data }: { cartId: string, data: any }, context: Context) {
  const sudoContext = context.sudo();

  // Update cart with modified data
  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data,
  });
}

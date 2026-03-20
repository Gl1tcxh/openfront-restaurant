import { Context } from ".keystone/types";

export default async function updateActiveCart(root: any, { cartId, data }: { cartId: string, data: any }, context: Context) {
  const sudoContext = context.sudo();

  // First verify this cart exists (like OpenFront)
  const existingCart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `id`,
  });

  if (!existingCart) {
    throw new Error("Cart not found");
  }

  // Update cart with modified data
  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data,
  });
}

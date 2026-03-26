import * as cookie from "cookie";
import type { Context } from ".keystone/types";
import { permissions } from "../access";

type CartAccessMode = "read" | "write";

function getRequestCartId(context: Context): string | undefined {
  const cookieHeader = context.req?.headers?.cookie;
  if (!cookieHeader) return undefined;
  return cookie.parse(cookieHeader)._restaurant_cart_id;
}

function canBypassCartAccess(context: Context, mode: CartAccessMode) {
  if (permissions.canManageOrders({ session: context.session })) return true;
  if (mode === "read" && permissions.canReadOrders({ session: context.session })) return true;
  return false;
}

function assertOwnership({
  context,
  cartId,
  cartUserId,
  mode,
}: {
  context: Context;
  cartId: string;
  cartUserId?: string | null;
  mode: CartAccessMode;
}) {
  if (canBypassCartAccess(context, mode)) return;

  const requestCartId = getRequestCartId(context);
  const sessionItemId = context.session?.itemId;
  const ownsByUser = Boolean(sessionItemId && cartUserId && cartUserId === sessionItemId);
  const ownsByCookie = requestCartId === cartId;

  if (!ownsByUser && !ownsByCookie) {
    throw new Error("Access denied");
  }
}

export async function assertCanAccessCart(
  context: Context,
  cartId: string,
  mode: CartAccessMode = "write"
) {
  const cart = await context.sudo().query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      user {
        id
      }
    `,
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  assertOwnership({
    context,
    cartId: cart.id,
    cartUserId: cart.user?.id,
    mode,
  });

  return cart;
}

export async function assertCanAccessCartItem(
  context: Context,
  cartItemId: string,
  mode: CartAccessMode = "write"
) {
  const cartItem = await context.sudo().query.CartItem.findOne({
    where: { id: cartItemId },
    query: `
      id
      cart {
        id
        user {
          id
        }
      }
    `,
  });

  if (!cartItem?.cart?.id) {
    throw new Error("Cart not found for this item");
  }

  assertOwnership({
    context,
    cartId: cartItem.cart.id,
    cartUserId: cartItem.cart.user?.id,
    mode,
  });

  return cartItem;
}

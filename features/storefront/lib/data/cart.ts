"use server";

import { gql } from "graphql-request";
import { openfrontClient } from "../config";
import { getAuthHeaders } from "./cookies";

const CART_QUERY = gql`
  query GetCart($cartId: ID) {
    cart: activeCart(cartId: $cartId) {
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
    }
  }
`;

export async function fetchCart(cartId?: string) {
  if (!cartId) return null;
  const headers = await getAuthHeaders();
  const { cart } = await openfrontClient.request(CART_QUERY, { cartId }, headers);
  return cart;
}

export async function createCart(orderType: string = "pickup") {
  const CREATE_CART_MUTATION = gql`
    mutation CreateCart($data: CartCreateInput!) {
      createCart(data: $data) {
        id
      }
    }
  `;
  
  const headers = await getAuthHeaders();
  const { createCart } = await openfrontClient.request(CREATE_CART_MUTATION, {
    data: { orderType }
  }, headers);
  
  return createCart;
}

export async function addToCart(params: {
  cartId: string;
  menuItemId: string;
  quantity: number;
  modifierIds?: string[];
  specialInstructions?: string;
}) {
  const ADD_TO_CART_MUTATION = gql`
    mutation AddToCart($cartId: ID!, $data: CartUpdateInput!) {
      updateActiveCart(cartId: $cartId, data: $data) {
        id
      }
    }
  `;

  const headers = await getAuthHeaders();
  const { updateActiveCart } = await openfrontClient.request(
    ADD_TO_CART_MUTATION,
    {
      cartId: params.cartId,
      data: {
        items: {
          create: [
            {
              menuItem: { connect: { id: params.menuItemId } },
              quantity: params.quantity,
              modifiers: params.modifierIds ? { connect: params.modifierIds.map((id: string) => ({ id })) } : undefined,
              specialInstructions: params.specialInstructions,
            },
          ],
        },
      },
    },
    headers
  );
  return updateActiveCart;
}

export async function updateLineItem(params: {
  cartId: string;
  lineId: string;
  quantity: number;
}) {
  const UPDATE_LINE_ITEM_MUTATION = gql`
    mutation UpdateCartItemQuantity($cartItemId: ID!, $quantity: Int!) {
      updateCartItemQuantity(cartItemId: $cartItemId, quantity: $quantity) {
        id
      }
    }
  `;

  const headers = await getAuthHeaders();
  const { updateCartItemQuantity } = await openfrontClient.request(
    UPDATE_LINE_ITEM_MUTATION,
    {
      cartItemId: params.lineId,
      quantity: params.quantity,
    },
    headers
  );
  return updateCartItemQuantity;
}

export async function removeLineItem(params: {
  cartId: string;
  lineId: string;
}) {
  const REMOVE_LINE_ITEM_MUTATION = gql`
    mutation RemoveCartItem($cartItemId: ID!) {
      removeCartItem(cartItemId: $cartItemId) {
        id
      }
    }
  `;

  const headers = await getAuthHeaders();
  const { removeCartItem } = await openfrontClient.request(
    REMOVE_LINE_ITEM_MUTATION,
    {
      cartItemId: params.lineId,
    },
    headers
  );
  return removeCartItem;
}

// Aliases to match cart-client.ts names for flexibility
export async function updateCartItemQuantity(params: { cartItemId: string; quantity: number }) {
  return updateLineItem({ cartId: "", lineId: params.cartItemId, quantity: params.quantity });
}

export async function removeCartItem(cartItemId: string) {
  return removeLineItem({ cartId: "", lineId: cartItemId });
}

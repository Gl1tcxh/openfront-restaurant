"use client";

import { gql } from "graphql-request";
import { openfrontClient } from "../config";

const CART_QUERY = gql`
  query GetCart($cartId: ID!) {
    activeCart(cartId: $cartId)
  }
`;

const getCartId = () => {
  if (typeof window === "undefined") return null;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("_restaurant_cart_id="))
    ?.split("=")[1];
};

export async function fetchCart(cartId?: string) {
  try {
    const resolvedCartId = cartId || getCartId();
    if (!resolvedCartId) return null;

    const { activeCart } = await openfrontClient.request<{ activeCart: any }>(
      CART_QUERY,
      { cartId: resolvedCartId }
    );

    if (!activeCart) {
      if (typeof window !== "undefined") {
        document.cookie = "_restaurant_cart_id=; path=/; max-age=-1";
      }
      return null;
    }

    return activeCart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    if (typeof window !== "undefined") {
      document.cookie = "_restaurant_cart_id=; path=/; max-age=-1";
    }
    return null;
  }
}

export async function createCart(orderType: string = "pickup") {
  const CREATE_CART_MUTATION = gql`
    mutation CreateCart($data: CartCreateInput!) {
      createCart(data: $data) {
        id
      }
    }
  `;

  try {
    const { createCart } = await openfrontClient.request<{ createCart: any }>(
      CREATE_CART_MUTATION,
      { data: { orderType } }
    );
    return createCart;
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
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
        items {
          id
          quantity
          menuItem {
            id
            name
            price
          }
        }
      }
    }
  `;

  try {
    const { updateActiveCart } = await openfrontClient.request<{ updateActiveCart: any }>(
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
      }
    );
    return updateActiveCart;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export async function updateCartItemQuantity(params: {
  cartItemId: string;
  quantity: number;
}) {
  const UPDATE_CART_ITEM_MUTATION = gql`
    mutation UpdateCartItemQuantity($cartItemId: ID!, $quantity: Int!) {
      updateCartItemQuantity(cartItemId: $cartItemId, quantity: $quantity) {
        id
      }
    }
  `;

  try {
    const { updateCartItemQuantity } = await openfrontClient.request<{ updateCartItemQuantity: any }>(
      UPDATE_CART_ITEM_MUTATION,
      {
        cartItemId: params.cartItemId,
        quantity: params.quantity,
      }
    );
    return updateCartItemQuantity;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
}

export async function removeCartItem(cartItemId: string) {
  const REMOVE_CART_ITEM_MUTATION = gql`
    mutation RemoveCartItem($cartItemId: ID!) {
      removeCartItem(cartItemId: $cartItemId) {
        id
      }
    }
  `;

  try {
    const { removeCartItem } = await openfrontClient.request<{ removeCartItem: any }>(
      REMOVE_CART_ITEM_MUTATION,
      { cartItemId }
    );
    return removeCartItem;
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
}

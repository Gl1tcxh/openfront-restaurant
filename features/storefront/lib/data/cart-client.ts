"use client";

import { gql } from "graphql-request";

// This file is safe to import in Client Components.
// It talks to the local GraphQL endpoint directly so it does not pull
// server-only endpoint resolution into the client bundle.

async function requestGraphQL<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  })

  const result = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "GraphQL request failed")
  }

  return result.data
}

export const CART_QUERY = gql`
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
    const data = await requestGraphQL<{ cart: any }>(CART_QUERY, { cartId: resolvedCartId });
    return data.cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
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
    const data = await requestGraphQL<{ createCart: any }>(CREATE_CART_MUTATION, {
      data: { orderType }
    });
    return data.createCart;
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
      }
    }
  `;

  try {
    const data = await requestGraphQL<{ updateActiveCart: any }>(ADD_TO_CART_MUTATION, {
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
    });
    return data.updateActiveCart;
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
    const data = await requestGraphQL<{ updateCartItemQuantity: any }>(UPDATE_CART_ITEM_MUTATION, {
      cartItemId: params.cartItemId,
      quantity: params.quantity,
    });
    return data.updateCartItemQuantity;
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
    const data = await requestGraphQL<{ removeCartItem: any }>(REMOVE_CART_ITEM_MUTATION, {
      cartItemId,
    });
    return data.removeCartItem;
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
}

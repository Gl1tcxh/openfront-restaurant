"use server";

import { gql } from "graphql-request";
import { openfrontClient } from "./config";
import { getCartId, getAuthHeaders } from "./data/cookies";

export async function fetchCart() {
  try {
    const cartId = await getCartId();
    if (!cartId) return null;

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

    const headers = await getAuthHeaders();
    const { cart } = await openfrontClient.request(CART_QUERY, { cartId }, headers);
    return cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}

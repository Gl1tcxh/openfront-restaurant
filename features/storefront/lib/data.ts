import { gql } from "graphql-request";
import { openfrontClient } from "./config";
import { getCartId, getAuthHeaders } from "./data/cookies";

// Fetch cart using activeCart query (like OpenFront)
// The server-side query returns all needed fields
export async function fetchCart() {
  try {
    const cartId = await getCartId();
    if (!cartId) return null;

    const CART_QUERY = gql`
      query GetCart($cartId: ID!) {
        activeCart(cartId: $cartId)
      }
    `;

    const headers = await getAuthHeaders();
    const { activeCart } = await openfrontClient.request(CART_QUERY, { cartId }, headers);
    return activeCart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}

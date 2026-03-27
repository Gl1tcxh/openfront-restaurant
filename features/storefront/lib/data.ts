import { gql } from "graphql-request";
import { openfrontClient } from "./config";
import { getCartId, getAuthHeaders } from "./data/cookies";
import { getMenuCategories, getMenuItems, getStoreSettings } from "./data/menu";
import { getUser } from "./data/user";

interface FetchMenuItemsParams {
  categoryId?: string;
  limit?: number;
  featured?: boolean;
}

export async function fetchMenuItems(params: FetchMenuItemsParams = {}) {
  const { categoryId, limit = 12, featured = false } = params;

  if (featured) {
    const GET_FEATURED_MENU_ITEMS_QUERY = gql`
      query GetFeaturedMenuItems($take: Int!) {
        menuItems(
          take: $take
          where: {
            available: { equals: true }
            featured: { equals: true }
          }
          orderBy: [{ name: asc }]
        ) {
          id
          name
          thumbnail
          description {
            document
          }
          price
          available
          featured
          popular
          calories
          prepTime
          kitchenStation
          allergens
          dietaryFlags
          mealPeriods
          category {
            id
            name
          }
          modifiers {
            id
            name
            modifierGroup
            modifierGroupLabel
            priceAdjustment
            calories
            defaultSelected
            required
            minSelections
            maxSelections
          }
        }
      }
    `;

    try {
      const { menuItems } = await openfrontClient.request(GET_FEATURED_MENU_ITEMS_QUERY, {
        take: limit,
      });

      return menuItems || [];
    } catch (error) {
      console.error("Error fetching featured menu items:", error);
      return [];
    }
  }

  const menuItems = await getMenuItems(categoryId);
  return typeof limit === "number" ? menuItems.slice(0, limit) : menuItems;
}

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
    const { activeCart } = await openfrontClient.request(
      CART_QUERY,
      { cartId },
      headers
    );

    return activeCart;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
}

export async function fetchUser() {
  try {
    return await getUser();
  } catch (error) {
    return null;
  }
}

export async function fetchStoreSettings() {
  try {
    return await getStoreSettings();
  } catch (error) {
    console.error("Error fetching store settings:", error);
    return null;
  }
}

export async function fetchMenuCategories() {
  try {
    return await getMenuCategories();
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    return [];
  }
}

"use server"
import { gql } from "graphql-request"
import { openfrontClient } from "../config"
import { cache } from "react"

export const getStoreSettings = cache(async function () {
  const GET_STORE_SETTINGS_QUERY = gql`
    query GetStoreSettings {
      storeSettings {
        id
        name
        tagline
        address
        phone
        email
        hours
        deliveryFee
        deliveryMinimum
        pickupDiscount
        estimatedDelivery
        estimatedPickup
        heroHeadline
        heroSubheadline
        heroTagline
        promoBanner
        rating
        reviewCount
      }
    }
  `;

  const data = await openfrontClient.request(GET_STORE_SETTINGS_QUERY);
  return data.storeSettings || null;
});

export const getMenuCategories = cache(async function () {
  const GET_MENU_CATEGORIES_QUERY = gql`
    query GetMenuCategories {
      menuCategories(orderBy: { sortOrder: asc }) {
        id
        name
        description
        mealPeriods
        sortOrder
        icon
      }
    }
  `;

  const data = await openfrontClient.request(GET_MENU_CATEGORIES_QUERY);
  return data.menuCategories || [];
});

export const getMenuItems = cache(async function (categoryId?: string) {
  // Build different queries based on whether categoryId is provided
  if (categoryId) {
    const GET_MENU_ITEMS_BY_CATEGORY_QUERY = gql`
      query GetMenuItemsByCategory($categoryId: ID!) {
        menuItems(
          where: {
            available: { equals: true }
            category: { id: { equals: $categoryId } }
          }
          orderBy: { name: asc }
        ) {
          id
          name
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
          image {
            url
            width
            height
          }
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

    const data = await openfrontClient.request(GET_MENU_ITEMS_BY_CATEGORY_QUERY, { categoryId });
    return data.menuItems || [];
  }

  const GET_ALL_MENU_ITEMS_QUERY = gql`
    query GetAllMenuItems {
      menuItems(
        where: { available: { equals: true } }
        orderBy: { name: asc }
      ) {
        id
        name
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
        image {
          url
          width
          height
        }
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

  const data = await openfrontClient.request(GET_ALL_MENU_ITEMS_QUERY);
  return data.menuItems || [];
});

export const getFeaturedMenuItems = cache(async function (take = 8) {
  const GET_FEATURED_ITEMS_QUERY = gql`
    query GetFeaturedItems($take: Int!) {
      menuItems(
        take: $take
        where: {
          available: { equals: true }
          featured: { equals: true }
        }
        orderBy: { name: asc }
      ) {
        id
        name
        description {
          document
        }
        price
        calories
        prepTime
        allergens
        dietaryFlags
        image {
          url
          width
          height
        }
        category {
          id
          name
        }
      }
    }
  `;

  const data = await openfrontClient.request(GET_FEATURED_ITEMS_QUERY, { take });
  return data.menuItems || [];
});

export const getMenuItem = cache(async function (id: string) {
  const GET_MENU_ITEM_QUERY = gql`
    query GetMenuItem($id: ID!) {
      menuItem(where: { id: $id }) {
        id
        name
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
        image {
          url
          width
          height
        }
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

  const data = await openfrontClient.request(GET_MENU_ITEM_QUERY, { id });
  return data.menuItem;
});

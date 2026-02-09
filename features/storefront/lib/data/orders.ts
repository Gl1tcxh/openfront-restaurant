"use server";

import { gql } from "graphql-request";
import { openfrontClient } from "../config";
import { getAuthHeaders } from "./cookies";
import { cache } from "react";

export const retrieveOrder = cache(async function (
  id: string,
  secretKey?: string | null
) {
  try {
    const query = gql`
      query GetCustomerOrder($id: ID!, $secretKey: String) {
        getCustomerOrder(orderId: $id, secretKey: $secretKey)
      }
    `;

    const headers = await getAuthHeaders();
    const { getCustomerOrder } = await openfrontClient.request<{
      getCustomerOrder: any;
    }>(query, { id, secretKey }, headers);

    return getCustomerOrder;
  } catch (error) {
    console.error("Error retrieving order:", error);
    return null;
  }
});

export const retrieveOrderByNumber = cache(async function (
  orderNumber: string
) {
  try {
    // Note: This might need a specialized query or checking access
    const query = gql`
      query GetOrderByNumber($orderNumber: String!) {
        restaurantOrders(where: { orderNumber: { equals: $orderNumber } }, take: 1) {
          id
          orderNumber
          status
          total
          createdAt
        }
      }
    `;

    const headers = await getAuthHeaders();
    const { restaurantOrders } = await openfrontClient.request<{
      restaurantOrders: any[];
    }>(query, { orderNumber }, headers);

    return restaurantOrders?.[0] || null;
  } catch (error) {
    console.error("Error retrieving order by number:", error);
    return null;
  }
});

export const listCustomerOrders = cache(async function (
  limit: number = 10,
  offset: number = 0
) {
  try {
    const query = gql`
      query GetCustomerOrders($take: Int, $skip: Int) {
        restaurantOrders(
          take: $take
          skip: $skip
          orderBy: [{ createdAt: desc }]
        ) {
          id
          orderNumber
          status
          total
          createdAt
          orderType
        }
      }
    `;

    const headers = await getAuthHeaders();
    const { restaurantOrders } = await openfrontClient.request<{
      restaurantOrders: any[];
    }>(query, { take: limit, skip: offset }, headers);

    return restaurantOrders;
  } catch (error) {
    console.error("Error listing orders:", error);
    return null;
  }
});

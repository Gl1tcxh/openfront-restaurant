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

export const listCustomerOrders = cache(async function (
  limit: number = 10,
  offset: number = 0
) {
  try {
    const headers = await getAuthHeaders();
    const query = gql`
      query GetCustomerOrders($limit: Int, $offset: Int) {
        getCustomerOrders(limit: $limit, offset: $offset)
      }
    `;

    const { getCustomerOrders } = await openfrontClient.request<{
      getCustomerOrders: any[];
    }>(query, { limit, offset }, headers);

    return getCustomerOrders || [];
  } catch (error) {
    console.error("Error listing orders:", error);
    return null;
  }
});

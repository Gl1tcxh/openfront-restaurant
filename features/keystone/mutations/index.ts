import { mergeSchemas } from "@graphql-tools/schema";
import type { GraphQLSchema } from 'graphql';
import redirectToInit from "./redirectToInit";
import updateActiveUser from "./updateActiveUser";
import processPayment, { capturePaymentMutation, getPaymentStatus } from "./processPayment";
import { splitCheckByItem, splitCheckByGuest } from "./splitCheck";
import { voidOrderItem, compOrderItem, voidOrder } from "./voidComp";

const graphql = String.raw;

export function extendGraphqlSchema(baseSchema: GraphQLSchema) {
  return mergeSchemas({
    schemas: [baseSchema],
    typeDefs: graphql`
      input UserUpdateProfileInput {
        email: String
        name: String
        phone: String
        password: String
        onboardingStatus: String
      }

      type Query {
        redirectToInit: Boolean
        getPaymentStatus(paymentIntentId: String!): GetPaymentStatusResult
      }

      type Mutation {
        updateActiveUser(data: UserUpdateProfileInput!): User

        processPayment(
          orderId: String!
          amount: Int!
          paymentMethod: String!
          tipAmount: Int
        ): ProcessPaymentResult

        capturePayment(
          paymentIntentId: String!
        ): CapturePaymentResult

        splitCheckByItem(
          orderId: String!
          itemIds: [String!]!
        ): SplitCheckResult

        splitCheckByGuest(
          orderId: String!
          guestCount: Int!
        ): SplitCheckResult

        voidOrderItem(
          orderItemId: String!
          reason: String!
          managerApproval: Boolean
          managerId: String
        ): VoidCompResult

        compOrderItem(
          orderItemId: String!
          reason: String!
          compAmount: Int
          managerApproval: Boolean
          managerId: String
        ): VoidCompResult

        voidOrder(
          orderId: String!
          reason: String!
          managerApproval: Boolean
          managerId: String
        ): VoidCompResult
      }

      type ProcessPaymentResult {
        success: Boolean!
        paymentId: String
        clientSecret: String
        error: String
      }

      type CapturePaymentResult {
        success: Boolean!
        status: String
        error: String
      }

      type GetPaymentStatusResult {
        status: String
        amount: Int
        error: String
      }

      type SplitCheckResult {
        success: Boolean!
        newOrderIds: [String!]!
        error: String
      }

      type VoidCompResult {
        success: Boolean!
        requiresManagerApproval: Boolean!
        adjustedAmount: Int
        error: String
      }
    `,
    resolvers: {
      Query: {
        redirectToInit,
        getPaymentStatus,
      },
      Mutation: {
        updateActiveUser,
        processPayment,
        capturePayment: capturePaymentMutation,
        splitCheckByItem,
        splitCheckByGuest,
        voidOrderItem,
        compOrderItem,
        voidOrder,
      },
    },
  });
}
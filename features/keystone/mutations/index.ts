import { mergeSchemas } from "@graphql-tools/schema";
import type { GraphQLSchema } from 'graphql';
import redirectToInit from "./redirectToInit";
import updateActiveUser from "./updateActiveUser";
import processPayment, { capturePaymentMutation, getPaymentStatus } from "./processPayment";
import { splitCheckByItem, splitCheckByGuest } from "./splitCheck";
import { voidOrderItem, compOrderItem, voidOrder } from "./voidComp";
import initiatePaymentSession from "./initiatePaymentSession";
import completeActiveCart from "./completeActiveCart";
import activeCart from "./activeCart";
import updateActiveCart from "./updateActiveCart";
import updateCartItemQuantity from "./updateCartItemQuantity";
import removeCartItem from "./removeCartItem";
import getCustomerOrder from "./getCustomerOrder";
import getCustomerOrders from "./getCustomerOrders";
import activeCartPaymentProviders from "../queries/activeCartPaymentProviders";
import { transferTable, combineTables } from "./tableManagement";
import { fireCourse, recallCourse } from "./courseManagement";
import { syncKitchenTickets, updateKitchenTicketStatus, fulfillKitchenTicketItem } from "./kdsTickets";
import handlePaymentProviderWebhook from "./handlePaymentProviderWebhook";

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
        activeCart(cartId: ID!): JSON
        activeCartPaymentProviders: [PaymentProvider!]
        getCustomerOrder(orderId: ID!, secretKey: String): JSON
        getCustomerOrders(limit: Int, offset: Int): JSON
      }

      type Mutation {
        updateActiveUser(data: UserUpdateProfileInput!): User
        updateActiveCart(cartId: ID!, data: CartUpdateInput!): Cart
        updateCartItemQuantity(cartItemId: ID!, quantity: Int!): Cart
        removeCartItem(cartItemId: ID!): Cart

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

        initiatePaymentSession(
          cartId: ID!
          paymentProviderId: String!
        ): InitiatePaymentSessionResult

        completeActiveCart(
          cartId: ID!
          paymentSessionId: ID
        ): RestaurantOrder

        transferTable(
          orderId: String!
          fromTableId: String!
          toTableId: String!
        ): TableManagementResult

        combineTables(
          orderId: String!
          tableIds: [String!]!
        ): TableManagementResult

        fireCourse(
          courseId: String!
        ): CourseManagementResult

        recallCourse(
          courseId: String!
        ): CourseManagementResult

        syncKitchenTickets: SyncKitchenTicketsResult

        updateKitchenTicketStatus(
          ticketId: String!
          status: String!
        ): KitchenTicketMutationResult

        fulfillKitchenTicketItem(
          ticketId: String!
          itemId: String!
          fulfilled: Boolean!
        ): KitchenTicketMutationResult

        handlePaymentProviderWebhook(
          providerCode: String!
          event: JSON!
          headers: JSON!
        ): HandleWebhookResult
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

      type InitiatePaymentSessionResult {
        id: ID!
        data: JSON
        amount: Int
      }

      type TableManagementResult {
        success: Boolean!
        error: String
      }

      type CourseManagementResult {
        success: Boolean!
        error: String
      }

      type SyncKitchenTicketsResult {
        success: Boolean!
        created: Int!
        updated: Int!
        error: String
      }

      type KitchenTicketMutationResult {
        success: Boolean!
        error: String
      }

      type HandleWebhookResult {
        success: Boolean!
        error: String
      }
    `,
    resolvers: {
      Query: {
        redirectToInit,
        getPaymentStatus,
        activeCart,
        activeCartPaymentProviders,
        getCustomerOrder,
        getCustomerOrders,
      },
      Mutation: {
        updateActiveUser,
        updateActiveCart,
        updateCartItemQuantity,
        removeCartItem,
        processPayment,
        capturePayment: capturePaymentMutation,
        splitCheckByItem,
        splitCheckByGuest,
        voidOrderItem,
        compOrderItem,
        voidOrder,
        initiatePaymentSession,
        completeActiveCart,
        transferTable,
        combineTables,
        fireCourse,
        recallCourse,
        syncKitchenTickets,
        updateKitchenTicketStatus,
        fulfillKitchenTicketItem,
        handlePaymentProviderWebhook,
      },
    },
  });
}

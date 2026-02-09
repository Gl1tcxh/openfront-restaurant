import { mergeSchemas } from "@graphql-tools/schema";
import type { GraphQLSchema } from 'graphql';
import redirectToInit from "./redirectToInit";
import updateActiveUser from "./updateActiveUser";
import processPayment, { capturePaymentMutation, getPaymentStatus } from "./processPayment";
import { splitCheckByItem, splitCheckByGuest } from "./splitCheck";
import { voidOrderItem, compOrderItem, voidOrder } from "./voidComp";
import createStorefrontOrder from "./createStorefrontOrder";
import completeStorefrontOrder from "./completeStorefrontOrder";
import activeCart from "./activeCart";
import updateActiveCart from "./updateActiveCart";
import updateCartItemQuantity from "./updateCartItemQuantity";
import removeCartItem from "./removeCartItem";
import getCustomerOrder from "./getCustomerOrder";
import { transferTable, combineTables } from "./tableManagement";
import { fireCourse, recallCourse } from "./courseManagement";
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

      input CustomerInfoInput {
        name: String!
        email: String!
        phone: String!
      }

      input DeliveryAddressInput {
        address: String!
        city: String!
        zip: String!
      }

      input StorefrontOrderItemInput {
        menuItemId: String!
        quantity: Int!
        price: Int!
        specialInstructions: String
        modifierIds: [String!]
      }

      type Query {
        redirectToInit: Boolean
        getPaymentStatus(paymentIntentId: String!): GetPaymentStatusResult
        activeCart(cartId: ID): Cart
        getCustomerOrder(orderId: ID!, secretKey: String): JSON
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

        createStorefrontOrder(
          orderType: String!
          customerInfo: CustomerInfoInput!
          deliveryAddress: DeliveryAddressInput
          items: [StorefrontOrderItemInput!]!
          subtotal: Int!
          tax: Int!
          tip: Int!
          total: Int!
          specialInstructions: String
        ): CreateStorefrontOrderResult

        completeStorefrontOrder(
          orderId: String!
        ): CompleteStorefrontOrderResult

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

      type CreateStorefrontOrderResult {
        success: Boolean!
        orderId: String
        orderNumber: String
        clientSecret: String
        secretKey: String
        error: String
      }

      type CompleteStorefrontOrderResult {
        success: Boolean!
        orderNumber: String
        error: String
      }

      type TableManagementResult {
        success: Boolean!
        error: String
      }

      type CourseManagementResult {
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
        getCustomerOrder,
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
        createStorefrontOrder,
        completeStorefrontOrder,
        transferTable,
        combineTables,
        fireCourse,
        recallCourse,
        handlePaymentProviderWebhook,
      },
    },
  });
}

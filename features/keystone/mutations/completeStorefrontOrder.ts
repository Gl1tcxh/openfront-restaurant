import type { Context } from ".keystone/types";
import { getPaymentStatus, capturePayment } from "../utils/paymentProviderAdapter";

interface CompleteStorefrontOrderArgs {
  orderId: string;
}

interface CompleteStorefrontOrderResult {
  success: boolean;
  orderNumber: string | null;
  error: string | null;
}

export default async function completeStorefrontOrder(
  root: any,
  args: CompleteStorefrontOrderArgs,
  context: Context
): Promise<CompleteStorefrontOrderResult> {
  const sudoContext = context.sudo();

  try {
    const { orderId } = args;

    // Get the order
    const order = await sudoContext.query.RestaurantOrder.findOne({
      where: { id: orderId },
      query: "id orderNumber status",
    });

    if (!order) {
      return {
        success: false,
        orderNumber: null,
        error: "Order not found",
      };
    }

    // Get the payment record for this order (with provider info)
    const payments = await sudoContext.query.Payment.findMany({
      where: { order: { id: { equals: orderId } } },
      query: `
        id 
        status 
        stripePaymentIntentId 
        paymentProvider { 
          id 
          code 
          capturePaymentFunction 
          getPaymentStatusFunction 
        }
      `,
    });

    const payment = payments[0];
    if (!payment || !payment.stripePaymentIntentId) {
      return {
        success: false,
        orderNumber: null,
        error: "Payment record not found",
      };
    }

    if (!payment.paymentProvider) {
      return {
        success: false,
        orderNumber: null,
        error: "Payment provider not found",
      };
    }

    // Verify payment with provider (like OpenFront's captureStripePayment)
    const paymentStatus = await getPaymentStatus({
      provider: payment.paymentProvider,
      paymentId: payment.stripePaymentIntentId,
    });

    let paymentSucceeded = false;

    if (paymentStatus.status === "succeeded") {
      paymentSucceeded = true;
    } else if (paymentStatus.status === "requires_capture") {
      // Capture the payment (like OpenFront does)
      const captureResult = await capturePayment({
        provider: payment.paymentProvider,
        paymentId: payment.stripePaymentIntentId,
      });
      paymentSucceeded = captureResult.status === "succeeded";
    }

    if (!paymentSucceeded) {
      // Update payment to failed
      await sudoContext.query.Payment.updateOne({
        where: { id: payment.id },
        data: {
          status: "failed",
          errorMessage: `Payment status: ${paymentStatus.status}`,
        },
      });

      return {
        success: false,
        orderNumber: null,
        error: `Payment not successful. Status: ${paymentStatus.status}`,
      };
    }

    // Payment succeeded - update records
    await sudoContext.query.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: "succeeded",
        processedAt: new Date().toISOString(),
        stripeChargeId: paymentStatus.data?.latest_charge || "",
      },
    });

    // Update order status to sent_to_kitchen (so it appears in KDS)
    await sudoContext.query.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        status: "sent_to_kitchen",
      },
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      error: null,
    };
  } catch (error) {
    console.error("Error completing storefront order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      orderNumber: null,
      error: errorMessage,
    };
  }
}

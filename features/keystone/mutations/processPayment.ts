import type { Context } from ".keystone/types";
import { createPaymentIntent, capturePayment, getPaymentIntent } from "../../../lib/stripe";
import {
  createPayment as createProviderPayment,
  capturePayment as captureProviderPayment,
  getPaymentStatus as getProviderPaymentStatus,
} from "../utils/paymentProviderAdapter";

interface ProcessPaymentArgs {
  orderId: string;
  amount: number; // Amount in cents
  paymentMethod: string;
  tipAmount?: number;
}

interface ProcessPaymentResult {
  success: boolean;
  paymentId: string | null;
  clientSecret: string | null;
  error: string | null;
}

export default async function processPayment(
  root: any,
  args: ProcessPaymentArgs,
  context: Context
): Promise<ProcessPaymentResult> {
  // Check if user is signed in
  if (!context.session?.itemId) {
    return {
      success: false,
      paymentId: null,
      clientSecret: null,
      error: "Must be signed in to process payment",
    };
  }

  const { orderId, amount, paymentMethod, tipAmount = 0 } = args;
  const currency = "usd";

  try {
    // Verify the order exists and get its details
    const order = await context.db.RestaurantOrder.findOne({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        paymentId: null,
        clientSecret: null,
        error: "Order not found",
      };
    }

    // Check if order is already completed
    if (order.status === "completed") {
      return {
        success: false,
        paymentId: null,
        clientSecret: null,
        error: "Order is already completed",
      };
    }

    const providerCode =
      paymentMethod === "cash"
        ? "pp_manual"
        : ["credit_card", "debit_card", "apple_pay", "google_pay"].includes(
            paymentMethod
          )
          ? "pp_stripe"
          : null;

    const provider = providerCode
      ? await context.db.PaymentProvider.findOne({
          where: { code: providerCode },
        })
      : null;

    let clientSecret: string | null = null;
    let providerPaymentId: string | null = null;
    let paymentStatus = "pending";
    let usesStripe = false;

    if (provider && provider.isInstalled) {
      const providerResponse = await createProviderPayment({
        provider,
        order,
        amount,
        currency,
      });

      clientSecret = providerResponse?.clientSecret || null;
      providerPaymentId =
        providerResponse?.paymentIntentId ||
        providerResponse?.orderId ||
        providerResponse?.paymentId ||
        null;
      paymentStatus = providerResponse?.status || "pending";
      usesStripe = provider.code === "pp_stripe" && !!providerPaymentId;
    } else {
      // Create the Stripe PaymentIntent (legacy fallback)
      const paymentIntent = await createPaymentIntent({
        amount,
        orderId,
        metadata: {
          orderNumber: order.orderNumber || "",
          paymentMethod,
        },
      });

      clientSecret = paymentIntent.client_secret;
      providerPaymentId = paymentIntent.id;
      usesStripe = true;
    }

    // Create Payment record in database
    const payment = await context.db.Payment.createOne({
      data: {
        amount: amount, 
        status: paymentStatus,
        paymentMethod,
        stripePaymentIntentId: usesStripe ? providerPaymentId : null,
        providerPaymentId,
        paymentProvider: provider
          ? { connect: { id: provider.id } }
          : undefined,
        tipAmount: tipAmount,
        order: { connect: { id: orderId } },
        processedBy: { connect: { id: context.session.itemId } },
      },
    });

    return {
      success: true,
      paymentId: payment.id,
      clientSecret,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error processing payment: ${errorMessage}`);

    return {
      success: false,
      paymentId: null,
      clientSecret: null,
      error: errorMessage,
    };
  }
}

// Capture an authorized payment
interface CapturePaymentArgs {
  paymentIntentId: string;
  amount?: number | null;
}

interface CapturePaymentResult {
  success: boolean;
  status: string | null;
  error: string | null;
}

export async function capturePaymentMutation(
  root: any,
  args: CapturePaymentArgs,
  context: Context
): Promise<CapturePaymentResult> {
  if (!context.session?.itemId) {
    return {
      success: false,
      status: null,
      error: "Must be signed in to capture payment",
    };
  }

  const { paymentIntentId } = args;

  try {
    const sudoContext = context.sudo();
    const payments = await sudoContext.query.Payment.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: { equals: paymentIntentId } },
          { providerPaymentId: { equals: paymentIntentId } },
        ],
      },
      query:
        "id providerPaymentId stripePaymentIntentId order { id } paymentProvider { id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction credentials metadata }",
    });

    const payment = payments[0];
    if (!payment) {
      return {
        success: false,
        status: null,
        error: "Payment not found",
      };
    }

    const provider = payment.paymentProvider;
    const capturedPayment = provider
      ? await captureProviderPayment({
          provider,
          paymentId: payment.providerPaymentId || paymentIntentId,
          amount: args.amount ?? undefined,
        })
      : await capturePayment(paymentIntentId);

    await context.db.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: capturedPayment.status === "succeeded" ? "succeeded" : "processing",
        processedAt: new Date().toISOString(),
      },
    });

    // Update order status if payment succeeded
    if (capturedPayment.status === "succeeded" && payment.order?.id) {
      await context.db.RestaurantOrder.updateOne({
        where: { id: payment.order.id },
        data: { status: "completed" },
      });
    }

    return {
      success: true,
      status: capturedPayment.status,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error capturing payment: ${errorMessage}`);

    return {
      success: false,
      status: null,
      error: errorMessage,
    };
  }
}

// Get payment status
interface GetPaymentStatusArgs {
  paymentIntentId: string;
}

interface GetPaymentStatusResult {
  status: string | null;
  amount: number | null;
  error: string | null;
}

export async function getPaymentStatus(
  root: any,
  args: GetPaymentStatusArgs,
  context: Context
): Promise<GetPaymentStatusResult> {
  if (!context.session?.itemId) {
    return {
      status: null,
      amount: null,
      error: "Must be signed in to check payment status",
    };
  }

  try {
    const sudoContext = context.sudo();
    const payments = await sudoContext.query.Payment.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: { equals: args.paymentIntentId } },
          { providerPaymentId: { equals: args.paymentIntentId } },
        ],
      },
      query:
        "id providerPaymentId stripePaymentIntentId paymentProvider { id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction credentials metadata }",
    });

    const payment = payments[0];
    if (!payment) {
      return {
        status: null,
        amount: null,
        error: "Payment not found",
      };
    }

    const provider = payment.paymentProvider;
    const paymentStatus = provider
      ? await getProviderPaymentStatus({
          provider,
          paymentId: payment.providerPaymentId || args.paymentIntentId,
        })
      : await getPaymentIntent(args.paymentIntentId);

    return {
      status: paymentStatus.status,
      amount: paymentStatus.amount ?? null,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return {
      status: null,
      amount: null,
      error: errorMessage,
    };
  }
}

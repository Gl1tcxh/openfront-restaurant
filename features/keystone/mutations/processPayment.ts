import type { Context } from ".keystone/types";
import { createPaymentIntent, capturePayment, getPaymentIntent } from "../../../lib/stripe";
import { permissions } from "../access";
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

function cents(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

async function applyTipToOrder(orderId: string, tipAmount: number, context: Context) {
  const sudo = context.sudo();
  const order = await sudo.query.RestaurantOrder.findOne({
    where: { id: orderId },
    query: "id total tip",
  });

  if (!order) {
    return null;
  }

  const currentTip = cents(order.tip);
  const nextTip = Math.max(currentTip, cents(tipAmount));

  if (nextTip !== currentTip) {
    const baseTotal = Math.max(0, cents(order.total) - currentTip);
    const nextTotal = baseTotal + nextTip;

    await sudo.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        tip: nextTip,
        total: nextTotal,
      },
    });

    return {
      ...order,
      tip: nextTip,
      total: nextTotal,
    };
  }

  return order;
}

async function maybeCompleteOrder(orderId: string, context: Context) {
  const sudo = context.sudo();
  const [order, payments] = await Promise.all([
    sudo.query.RestaurantOrder.findOne({
      where: { id: orderId },
      query: "id status total",
    }),
    sudo.query.Payment.findMany({
      where: {
        order: { id: { equals: orderId } },
        status: { equals: "succeeded" },
      },
      query: "id amount",
    }),
  ]);

  if (!order) {
    return;
  }

  const totalPaid = payments.reduce((sum: number, payment: any) => sum + cents(payment.amount), 0);
  const totalDue = cents(order.total);

  if (totalPaid >= totalDue && order.status !== "completed") {
    await sudo.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: { status: "completed" },
    });
  }
}

export default async function processPayment(
  root: any,
  args: ProcessPaymentArgs,
  context: Context
): Promise<ProcessPaymentResult> {
  if (!permissions.canManagePayments({ session: context.session })) {
    return {
      success: false,
      paymentId: null,
      clientSecret: null,
      error: "Not authorized to process payment",
    };
  }

  const { orderId, amount, paymentMethod, tipAmount = 0 } = args;

  try {
    const sudo = context.sudo();

    // Get store settings for currency
    const settings = await sudo.query.StoreSettings.findOne({
      where: { id: '1' },
      query: 'currencyCode'
    });
    const currency = (settings?.currencyCode || "USD").toLowerCase();

    // Verify the order exists and get its details
    const order = await sudo.query.RestaurantOrder.findOne({
      where: { id: orderId },
      query: 'id orderNumber status total tip'
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

    await applyTipToOrder(orderId, tipAmount, context);

    const isImmediateSettlement = ["cash", "gift_card"].includes(paymentMethod);
    const providerCode =
      paymentMethod === "cash"
        ? "pp_system_default"
        : ["credit_card", "debit_card", "apple_pay", "google_pay"].includes(paymentMethod)
          ? "pp_stripe_stripe"
          : null;

    const providers = providerCode
      ? await context.query.PaymentProvider.findMany({
          where: {
            code: { equals: providerCode },
            isInstalled: { equals: true },
          },
          query: "id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction credentials metadata",
        })
      : [];

    const provider = providers[0] || null;

    let clientSecret: string | null = null;
    let providerPaymentId: string | null = null;
    let paymentStatus = isImmediateSettlement ? "succeeded" : "pending";

    if (!isImmediateSettlement && provider && provider.isInstalled) {
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
    } else if (!isImmediateSettlement) {
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
    }

    // Create Payment record in database (store provider data in JSON)
    const payment = await context.db.Payment.createOne({
      data: {
        amount: amount,
        status: paymentStatus,
        paymentMethod,
        currencyCode: currency.toUpperCase(),
        providerPaymentId,
        data: {
          paymentIntentId: providerPaymentId,
          clientSecret,
        },
        paymentProvider: provider
          ? { connect: { id: provider.id } }
          : undefined,
        tipAmount: tipAmount,
        processedAt: paymentStatus === "succeeded" ? new Date().toISOString() : undefined,
        order: { connect: { id: orderId } },
        processedBy: { connect: { id: context.session.itemId } },
      },
    });

    if (paymentStatus === "succeeded") {
      await maybeCompleteOrder(orderId, context);
    }

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
  if (!permissions.canManagePayments({ session: context.session })) {
    return {
      success: false,
      status: null,
      error: "Not authorized to capture payment",
    };
  }

  const { paymentIntentId } = args;

  try {
    const sudoContext = context.sudo();
    const payments = await sudoContext.query.Payment.findMany({
      where: {
        providerPaymentId: { equals: paymentIntentId },
      },
      query:
        "id providerPaymentId data order { id } paymentProvider { id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction credentials metadata }",
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

    const didSucceed = ["succeeded", "captured"].includes(capturedPayment.status);

    await context.db.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: didSucceed ? "succeeded" : "processing",
        processedAt: didSucceed ? new Date().toISOString() : undefined,
      },
    });

    if (didSucceed && payment.order?.id) {
      await maybeCompleteOrder(payment.order.id, context);
    }

    return {
      success: true,
      status: didSucceed ? "succeeded" : capturedPayment.status,
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
  if (!(permissions.canReadPayments({ session: context.session }) || permissions.canManagePayments({ session: context.session }))) {
    return {
      status: null,
      amount: null,
      error: "Not authorized to check payment status",
    };
  }

  try {
    const sudoContext = context.sudo();
    const payments = await sudoContext.query.Payment.findMany({
      where: {
        providerPaymentId: { equals: args.paymentIntentId },
      },
      query:
        "id providerPaymentId data paymentProvider { id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction credentials metadata }",
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

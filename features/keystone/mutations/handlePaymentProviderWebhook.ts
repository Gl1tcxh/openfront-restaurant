import type { Context } from ".keystone/types";
import { handleWebhook } from "../utils/paymentProviderAdapter";

function normalizeHeaders(headers: any) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[String(key).toLowerCase()] = Array.isArray(value)
      ? String(value[0] || "")
      : String(value ?? "");
  }
  return normalized;
}

function getCandidateProviderPaymentIds(type: string, resource: any) {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim()) ids.add(value.trim());
  };

  add(resource?.id);
  add(resource?.payment_intent);
  add(resource?.supplementary_data?.related_ids?.order_id);
  add(resource?.supplementary_data?.related_ids?.capture_id);

  if (type.startsWith("PAYMENT.CAPTURE.")) {
    add(resource?.supplementary_data?.related_ids?.order_id);
    add(resource?.id);
  }

  return Array.from(ids);
}

async function findPaymentByProviderIds(providerPaymentIds: string[], context: Context) {
  const sudo = context.sudo();

  for (const providerPaymentId of providerPaymentIds) {
    const payments = await sudo.query.Payment.findMany({
      where: { providerPaymentId: { equals: providerPaymentId } },
      query: 'id status data order { id status }',
      take: 1,
    });

    if (payments.length > 0) {
      return { payment: payments[0], providerPaymentId };
    }
  }

  return null;
}

export default async function handlePaymentProviderWebhook(
  root: any,
  { providerCode, event, headers }: { providerCode: string; event: any; headers: any },
  context: Context
) {
  const sudoContext = context.sudo();

  if (!providerCode || !/^[a-z0-9_\-]+$/i.test(providerCode)) {
    throw new Error("Invalid provider code");
  }

  if (!event || typeof event !== "object") {
    throw new Error("Webhook event payload is required");
  }

  const normalizedHeaders = normalizeHeaders(headers);

  const providers = await sudoContext.query.PaymentProvider.findMany({
    where: { code: { equals: providerCode } },
    query: `
      id
      code
      isInstalled
      createPaymentFunction
      capturePaymentFunction
      refundPaymentFunction
      getPaymentStatusFunction
      generatePaymentLinkFunction
      handleWebhookFunction
      credentials
      metadata
    `,
    take: 1,
  });

  const provider = providers[0];

  if (!provider || !provider.isInstalled) {
    throw new Error(`Payment provider ${providerCode} not found or not installed`);
  }

  if (!provider.handleWebhookFunction || provider.handleWebhookFunction === "manual") {
    throw new Error(`Provider ${providerCode} does not support authenticated webhook handling`);
  }

  const parsed = await handleWebhook({ provider, event, headers: normalizedHeaders });
  if (!parsed?.isValid || !parsed?.type) {
    throw new Error("Webhook verification failed");
  }

  const type = String(parsed.type);
  const resource = parsed.resource || {};
  const candidateIds = getCandidateProviderPaymentIds(type, resource);
  const matched = candidateIds.length > 0 ? await findPaymentByProviderIds(candidateIds, context) : null;

  if (!matched) {
    return { success: true, error: null };
  }

  const { payment } = matched;

  if (
    ["payment_intent.succeeded", "charge.succeeded", "CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"].includes(type)
  ) {
    await sudoContext.db.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: 'succeeded',
        processedAt: new Date().toISOString(),
        errorMessage: null,
        data: {
          ...(payment.data || {}),
          webhookType: type,
          webhookResourceId: resource.id || null,
          chargeId: resource.latest_charge || resource.id || null,
        },
      },
    });

    if (payment.order?.id && !['completed', 'cancelled'].includes(payment.order.status || '')) {
      await sudoContext.db.RestaurantOrder.updateOne({
        where: { id: payment.order.id },
        data: {
          status: 'sent_to_kitchen',
        },
      });
    }
  } else if (
    ["payment_intent.payment_failed", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.DECLINED"].includes(type)
  ) {
    await sudoContext.db.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: 'failed',
        errorMessage:
          resource.last_payment_error?.message ||
          resource.status_details?.reason ||
          'Payment failed',
        data: {
          ...(payment.data || {}),
          webhookType: type,
          webhookResourceId: resource.id || null,
        },
      },
    });
  } else if (["payment_intent.canceled", "PAYMENT.CAPTURE.REVERSED", "CHECKOUT.ORDER.VOIDED"].includes(type)) {
    await sudoContext.db.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: 'cancelled',
        data: {
          ...(payment.data || {}),
          webhookType: type,
          webhookResourceId: resource.id || null,
        },
      },
    });
  }

  return { success: true, error: null };
}

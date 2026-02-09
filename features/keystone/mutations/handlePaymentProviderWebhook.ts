import type { Context } from ".keystone/types";
import { capturePayment, handleWebhook } from "../utils/paymentProviderAdapter";

export default async function handlePaymentProviderWebhook(
  root: any,
  { providerCode, event, headers }: { providerCode: string; event: any; headers: any },
  context: Context
) {
  const sudoContext = context.sudo();

  // Get the payment provider by code (since routes are often by code)
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
  });

  const provider = providers[0];

  if (!provider || !provider.isInstalled) {
    throw new Error(`Payment provider ${providerCode} not found or not installed`);
  }

  // Verify and parse webhook using the adapter
  const { type, resource } = await handleWebhook({ provider, event, headers });

  // Handle the event based on type patterns
  // Pattern for successful payment (Stripe payment_intent.succeeded)
  if (type === 'payment_intent.succeeded' || type === 'charge.succeeded') {
    const stripePaymentIntentId = resource.id || resource.payment_intent;
    
    // Find the payment record
    const payments = await sudoContext.query.Payment.findMany({
      where: { 
        OR: [
          { stripePaymentIntentId: { equals: stripePaymentIntentId } },
          { providerPaymentId: { equals: stripePaymentIntentId } }
        ]
      },
      query: 'id order { id }',
    });

    if (payments.length > 0) {
      const payment = payments[0];
      
      // Update payment status
      await sudoContext.db.Payment.updateOne({
        where: { id: payment.id },
        data: {
          status: 'succeeded',
          processedAt: new Date().toISOString(),
          stripeChargeId: resource.latest_charge || resource.id,
        },
      });

      // Update order status if exists
      if (payment.order?.id) {
        await sudoContext.db.RestaurantOrder.updateOne({
          where: { id: payment.order.id },
          data: {
            status: 'sent_to_kitchen',
          },
        });
      }
    }
  } else if (type === 'payment_intent.payment_failed') {
    const stripePaymentIntentId = resource.id;
    
    const payments = await sudoContext.query.Payment.findMany({
      where: { stripePaymentIntentId: { equals: stripePaymentIntentId } },
      query: 'id',
    });

    if (payments.length > 0) {
      await sudoContext.db.Payment.updateOne({
        where: { id: payments[0].id },
        data: {
          status: 'failed',
          errorMessage: resource.last_payment_error?.message || 'Payment failed',
        },
      });
    }
  } else if (type === 'payment_intent.canceled') {
    const stripePaymentIntentId = resource.id;
    
    const payments = await sudoContext.query.Payment.findMany({
      where: { stripePaymentIntentId: { equals: stripePaymentIntentId } },
      query: 'id order { id }',
    });

    if (payments.length > 0) {
      const payment = payments[0];
      await sudoContext.db.Payment.updateOne({
        where: { id: payment.id },
        data: { status: 'cancelled' },
      });

      if (payment.order?.id) {
        await sudoContext.db.RestaurantOrder.updateOne({
          where: { id: payment.order.id },
          data: { status: 'cancelled' },
        });
      }
    }
  }

  return { success: true };
}

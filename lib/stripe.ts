import Stripe from 'stripe';

// Ensure the Stripe secret key is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Webhook secret for verifying webhook signatures
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Helper function to create a payment intent for a restaurant order
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  orderId,
  customerId,
  metadata = {},
}: {
  amount: number; // Amount in cents
  currency?: string;
  orderId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata: {
      orderId,
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

// Helper function to capture an authorized payment
export async function capturePayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

// Helper function to cancel a payment intent
export async function cancelPayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  return paymentIntent;
}

// Helper function to refund a payment
export async function refundPayment({
  paymentIntentId,
  amount,
  reason,
}: {
  paymentIntentId: string;
  amount?: number; // Amount in cents (optional for partial refund)
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });

  return refund;
}

// Helper function to retrieve payment intent details
export async function getPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

// Type exports for convenience
export type { Stripe };

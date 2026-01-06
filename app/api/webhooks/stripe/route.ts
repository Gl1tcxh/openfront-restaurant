import { NextRequest, NextResponse } from 'next/server';
import { stripe, webhookSecret } from '@/lib/stripe';
import Stripe from 'stripe';

// Disable body parsing so we can access the raw body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error processing webhook: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Handler for successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('Payment intent missing orderId in metadata');
    return;
  }

  console.log(`Payment succeeded for order ${orderId}`);

  // TODO: Update Payment record in database
  // - Set status to 'succeeded'
  // - Set processedAt to current timestamp
  // - Set stripeChargeId from paymentIntent.latest_charge
  // - Update associated order status to 'paid'

  // Example implementation (requires database context):
  // await prisma.payment.updateMany({
  //   where: { stripePaymentIntentId: paymentIntent.id },
  //   data: {
  //     status: 'succeeded',
  //     processedAt: new Date(),
  //     stripeChargeId: paymentIntent.latest_charge as string,
  //   },
  // });

  // await prisma.restaurantOrder.update({
  //   where: { id: orderId },
  //   data: { status: 'paid' },
  // });
}

// Handler for failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('Payment intent missing orderId in metadata');
    return;
  }

  console.log(`Payment failed for order ${orderId}`);

  const lastError = paymentIntent.last_payment_error;
  const errorMessage = lastError?.message || 'Payment failed';

  // TODO: Update Payment record in database
  // - Set status to 'failed'
  // - Set errorMessage

  // Example implementation:
  // await prisma.payment.updateMany({
  //   where: { stripePaymentIntentId: paymentIntent.id },
  //   data: {
  //     status: 'failed',
  //     errorMessage,
  //   },
  // });
}

// Handler for canceled payment
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  console.log(`Payment canceled for order ${orderId || 'unknown'}`);

  // TODO: Update Payment record in database
  // - Set status to 'cancelled'

  // Example implementation:
  // await prisma.payment.updateMany({
  //   where: { stripePaymentIntentId: paymentIntent.id },
  //   data: { status: 'cancelled' },
  // });
}

// Handler for refunded charge
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  console.log(`Charge refunded for payment intent ${paymentIntentId}`);

  const isFullRefund = charge.amount_refunded === charge.amount;

  // TODO: Update Payment record in database
  // - Set status to 'refunded' or 'partially_refunded'
  // - Set stripeRefundId

  // Example implementation:
  // await prisma.payment.updateMany({
  //   where: { stripePaymentIntentId: paymentIntentId },
  //   data: {
  //     status: isFullRefund ? 'refunded' : 'partially_refunded',
  //     stripeRefundId: charge.refunds?.data[0]?.id,
  //   },
  // });
}

// Handler for dispute created
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log(`Dispute created: ${dispute.id}`);

  // TODO: Handle dispute
  // - Notify management
  // - Update records
  // - Gather evidence
}

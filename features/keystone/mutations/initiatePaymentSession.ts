/**
 * initiatePaymentSession — Restaurant version of OpenFront's initiatePaymentSession.
 *
 * OpenFront stores session data in PaymentCollection → PaymentSession models.
 * The restaurant stores it directly on Cart.paymentData (simpler, same effect).
 *
 * Flow:
 *   1. Load cart, compute total
 *   2. Load payment provider by code
 *   3. Call createPayment via adapter → get clientSecret / paymentIntentId
 *   4. Store result in cart.paymentData
 *   5. Return { id, data, amount } (same shape as OpenFront PaymentSession)
 */
import type { Context } from ".keystone/types";
import { createPayment } from "../utils/paymentProviderAdapter";

interface InitiatePaymentSessionArgs {
  cartId: string;
  paymentProviderId: string; // e.g. "pp_stripe", "pp_paypal", "pp_manual"
}

export default async function initiatePaymentSession(
  root: any,
  { cartId, paymentProviderId }: InitiatePaymentSessionArgs,
  context: Context
) {
  const sudoContext = context.sudo();

  // 1. Load cart with total
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      subtotal
      orderType
      paymentData
    `,
  });

  if (!cart) throw new Error("Cart not found");

  // 2. Load payment provider
  const provider = await sudoContext.query.PaymentProvider.findOne({
    where: { code: paymentProviderId },
    query: `
      id code isInstalled
      createPaymentFunction capturePaymentFunction
      refundPaymentFunction getPaymentStatusFunction
      generatePaymentLinkFunction credentials
    `,
  });

  if (!provider || !provider.isInstalled) {
    throw new Error(`Payment provider ${paymentProviderId} not found or not installed`);
  }

  const amount = cart.subtotal || 0;

  // Get currency from store settings
  const settings = await sudoContext.query.StoreSettings.findOne({
    where: { id: "1" },
    query: "currencyCode",
  });
  const currency = (settings?.currencyCode || "USD").toLowerCase();

  // 3. For cash / manual providers, no external call needed
  const isManualProvider =
    paymentProviderId === "pp_manual" || paymentProviderId === "pp_system_default";

  let sessionData: any;

  if (isManualProvider) {
    sessionData = { providerCode: paymentProviderId };
  } else {
    // Call adapter (Stripe → creates PaymentIntent, PayPal → creates order, etc.)
    sessionData = await createPayment({
      provider,
      order: { id: cartId }, // pass cartId as order context for adapter metadata
      amount,
      currency,
    });
    sessionData.providerCode = paymentProviderId;
  }

  // 4. Store on cart (replaces any previous session — one active session at a time)
  await sudoContext.query.Cart.updateOne({
    where: { id: cartId },
    data: {
      paymentData: sessionData,
      paymentProvider: { connect: { id: provider.id } },
    },
  });

  // 5. Return same shape as OpenFront PaymentSession
  return {
    id: cartId, // using cartId as session identifier
    data: sessionData,
    amount,
  };
}

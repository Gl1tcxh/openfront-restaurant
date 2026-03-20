import type { Context } from ".keystone/types";
import { createPayment } from "../utils/paymentProviderAdapter";

interface InitiatePaymentSessionArgs {
  cartId: string;
  paymentProviderId: string;
}

export default async function initiatePaymentSession(
  root: any,
  { cartId, paymentProviderId }: InitiatePaymentSessionArgs,
  context: Context
) {
  const sudoContext = context.sudo();

  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      subtotal
      paymentCollection {
        id
        amount
        paymentSessions {
          id
          isSelected
          isInitiated
          paymentProvider {
            id
            code
          }
          data
        }
      }
    `,
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const provider = await sudoContext.query.PaymentProvider.findOne({
    where: { code: paymentProviderId },
    query: `
      id
      code
      isInstalled
      createPaymentFunction
      capturePaymentFunction
      refundPaymentFunction
      getPaymentStatusFunction
      generatePaymentLinkFunction
      credentials
    `,
  });

  if (!provider || !provider.isInstalled) {
    throw new Error(`Payment provider ${paymentProviderId} not found or not installed`);
  }

  if (!cart.paymentCollection) {
    cart.paymentCollection = await sudoContext.query.PaymentCollection.createOne({
      data: {
        cart: { connect: { id: cart.id } },
        amount: cart.subtotal || 0,
        description: "default",
      },
      query: "id",
    });
  }

  const existingSession = cart.paymentCollection?.paymentSessions?.find(
    (s: any) => s.paymentProvider.code === provider.code && !s.isInitiated
  );

  if (existingSession) {
    const otherSessions = cart.paymentCollection.paymentSessions.filter(
      (s: any) => s.id !== existingSession.id && s.isSelected
    );

    for (const session of otherSessions) {
      await sudoContext.query.PaymentSession.updateOne({
        where: { id: session.id },
        data: { isSelected: false },
      });
    }

    await sudoContext.query.PaymentSession.updateOne({
      where: { id: existingSession.id },
      data: { isSelected: true },
    });

    return existingSession;
  }

  const amount = cart.subtotal || 0;
  const settings = await sudoContext.query.StoreSettings.findOne({
    where: { id: "1" },
    query: `currencyCode`,
  });
  const currency = (settings?.currencyCode || "USD").toLowerCase();

  const isManualProvider = provider.code === "pp_system_default";

  let sessionData: Record<string, any> = { providerCode: provider.code };

  if (!isManualProvider) {
    const createdSessionData = await createPayment({
      provider,
      cart,
      amount,
      currency,
    });
    sessionData = {
      ...createdSessionData,
      providerCode: provider.code,
    };
  }

  const existingSelectedSessions = cart.paymentCollection.paymentSessions?.filter(
    (s: any) => s.isSelected
  ) || [];

  for (const session of existingSelectedSessions) {
    await sudoContext.query.PaymentSession.updateOne({
      where: { id: session.id },
      data: { isSelected: false },
    });
  }

  const newSession = await sudoContext.query.PaymentSession.createOne({
    data: {
      paymentCollection: { connect: { id: cart.paymentCollection.id } },
      paymentProvider: { connect: { id: provider.id } },
      amount,
      isSelected: true,
      isInitiated: false,
      data: sessionData,
    },
    query: `
      id
      data
      amount
      isInitiated
      isSelected
      paymentProvider {
        id
        code
      }
    `,
  });

  return newSession;
}

import type { Context } from ".keystone/types";
import { createPayment } from "../utils/paymentProviderAdapter";
import { calculateRestaurantTotals } from "../../lib/restaurant-order-pricing";
import { assertCanAccessCart } from "../utils/cartAccess";
import {
  assertDeliveryAddressComplete,
  assertDeliveryAddressEligible,
  getStoreDeliverySettings,
} from "../utils/deliveryValidation";

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

  await assertCanAccessCart(context, cartId, "write");

  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      orderType
      subtotal
      deliveryAddress
      deliveryCity
      deliveryCountryCode
      deliveryZip
      tipPercent
      paymentCollection {
        id
        amount
        paymentSessions {
          id
          isSelected
          isInitiated
          amount
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

  const settings = await getStoreDeliverySettings(context);
  const currency = settings?.currencyCode || "USD";

  assertDeliveryAddressComplete({
    orderType: cart.orderType,
    deliveryAddress: cart.deliveryAddress,
    deliveryCity: cart.deliveryCity,
    deliveryCountryCode: cart.deliveryCountryCode,
    deliveryZip: cart.deliveryZip,
  });

  assertDeliveryAddressEligible({
    orderType: cart.orderType,
    storeSettings: settings,
    deliveryCountryCode: cart.deliveryCountryCode,
    deliveryZip: cart.deliveryZip,
  });

  const pricing = calculateRestaurantTotals({
    subtotal: cart.subtotal || 0,
    orderType: cart.orderType,
    tipPercent: cart.tipPercent,
    deliveryFee: settings?.deliveryFee,
    deliveryMinimum: settings?.deliveryMinimum,
    pickupDiscountPercent: settings?.pickupDiscount,
    taxRate: settings?.taxRate,
    currencyCode: currency,
  });

  if (pricing.deliveryMinimumNotMet) {
    throw new Error(`Delivery orders require a minimum subtotal of ${settings?.deliveryMinimum || "0.00"}.`);
  }

  const amount = pricing.total;

  if (!cart.paymentCollection) {
    cart.paymentCollection = await sudoContext.query.PaymentCollection.createOne({
      data: {
        cart: { connect: { id: cart.id } },
        amount,
        description: "default",
      },
      query: "id",
    });
  } else if ((cart.paymentCollection.amount || 0) !== amount) {
    await sudoContext.query.PaymentCollection.updateOne({
      where: { id: cart.paymentCollection.id },
      data: { amount },
    });
  }

  const existingSession = cart.paymentCollection?.paymentSessions?.find(
    (s: any) => s.paymentProvider.code === provider.code && s.amount === amount
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

    return await sudoContext.query.PaymentSession.findOne({
      where: { id: existingSession.id },
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
  }

  const normalizedCurrency = currency.toLowerCase();

  const isManualProvider = provider.code === "pp_system_default";

  let sessionData: Record<string, any> = { providerCode: provider.code };

  if (!isManualProvider) {
    const createdSessionData = await createPayment({
      provider,
      cart,
      amount,
      currency: normalizedCurrency,
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
      isInitiated: true,
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

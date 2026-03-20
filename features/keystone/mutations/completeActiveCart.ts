/**
 * completeActiveCart aligned to the active selected payment-session flow.
 * Selected PaymentSession is the only payment source of truth.
 */
import type { Context } from ".keystone/types";
import { getPaymentStatus, capturePayment } from "../utils/paymentProviderAdapter";

interface CompleteActiveCartArgs {
  cartId: string;
  paymentSessionId?: string;
}

export default async function completeActiveCart(
  root: any,
  { cartId, paymentSessionId }: CompleteActiveCartArgs,
  context: Context
) {
  const sudoContext = context.sudo();

  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      orderType
      subtotal
      email
      customerName
      customerPhone
      deliveryAddress
      deliveryCity
      deliveryZip
      tipPercent
      user { id }
      paymentCollection {
        id
        amount
        paymentSessions {
          id
          isSelected
          isInitiated
          amount
          data
          paymentProvider {
            id
            code
            capturePaymentFunction
            getPaymentStatusFunction
          }
        }
      }
      items {
        id
        quantity
        specialInstructions
        menuItem {
          id
          name
          price
          menuItemImages(take: 1) {
            id
            image { url }
            imagePath
          }
        }
        modifiers {
          id
          name
          priceAdjustment
        }
      }
    `,
  });

  if (!cart) throw new Error("Cart not found");
  if (!cart.items?.length) throw new Error("Cart is empty");

  const selectedSession = paymentSessionId
    ? cart.paymentCollection?.paymentSessions?.find(
        (session: any) => session.id === paymentSessionId
      )
    : cart.paymentCollection?.paymentSessions?.find((session: any) => session.isSelected);

  if (!selectedSession) {
    throw new Error("No selected payment session found for this cart.");
  }

  const sessionData = (selectedSession.data || {}) as Record<string, any>;
  const paymentData = selectedSession.data || null;

  const providerCode = selectedSession.paymentProvider?.code || sessionData?.providerCode;
  const providerPaymentId = sessionData?.paymentIntentId || sessionData?.orderId;
  const paymentProvider = selectedSession.paymentProvider;

  if (!paymentProvider) {
    throw new Error("Selected payment session is missing payment provider information.");
  }

  const isManual = providerCode === "pp_system_default";
  let paymentResult: { status: string; paymentIntentId: string | null } = {
    status: "manual_pending",
    paymentIntentId: null,
  };

  if (!isManual) {
    if (!providerPaymentId) {
      throw new Error("Selected payment session is missing provider payment data.");
    }

    const status = await getPaymentStatus({
      provider: paymentProvider,
      paymentId: providerPaymentId,
    });

    if (status.status === "succeeded") {
      paymentResult = { status: "succeeded", paymentIntentId: providerPaymentId };
    } else if (status.status === "requires_capture") {
      const captured = await capturePayment({
        provider: paymentProvider,
        paymentId: providerPaymentId,
      });
      paymentResult = {
        status: captured.status === "succeeded" ? "succeeded" : "failed",
        paymentIntentId: providerPaymentId,
      };
    } else {
      throw new Error(`Payment not successful. Status: ${status.status}`);
    }

    if (paymentResult.status === "failed") {
      throw new Error("Payment capture failed");
    }
  }

  const subtotal = cart.subtotal || 0;
  const tipPercent = parseInt(cart.tipPercent || "0", 10);
  const tip = Math.round(subtotal * (tipPercent / 100));

  const settings = await sudoContext.query.StoreSettings.findOne({
    where: { id: "1" },
    query: "taxRate currencyCode pickupDiscount",
  });
  const taxRate = parseFloat(settings?.taxRate || "8.75");
  const currencyCode = settings?.currencyCode || "USD";
  const storePickupDiscount = parseInt(settings?.pickupDiscount || "10", 10);
  const tax = Math.round(subtotal * (taxRate / 100));
  const pickupDiscount = cart.orderType === "pickup" ? Math.round(subtotal * (storePickupDiscount / 100)) : 0;
  const total = subtotal - pickupDiscount + tax + tip;

  const orderTypeMap: Record<string, string> = {
    pickup: "takeout",
    delivery: "delivery",
  };

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const customerId = cart.user?.id;
  const secretKey = !customerId
    ? require("crypto").randomBytes(32).toString("hex")
    : undefined;

  const order = await sudoContext.query.RestaurantOrder.createOne({
    data: {
      orderNumber,
      orderType: orderTypeMap[cart.orderType || "pickup"] || "takeout",
      orderSource: "online",
      status: isManual ? "open" : "sent_to_kitchen",
      guestCount: 1,
      subtotal,
      tax,
      tip,
      total,
      currencyCode,
      customer: customerId ? { connect: { id: customerId } } : undefined,
      customerName: cart.customerName || "",
      customerEmail: cart.email || "",
      customerPhone: cart.customerPhone || "",
      deliveryAddress: cart.deliveryAddress || undefined,
      deliveryCity: cart.deliveryCity || undefined,
      deliveryZip: cart.deliveryZip || undefined,
      secretKey,
    },
    query: "id orderNumber secretKey status",
  });

  for (const item of cart.items) {
    const modTotal =
      item.modifiers?.reduce(
        (s: number, m: any) => s + (m.priceAdjustment || 0),
        0
      ) || 0;
    const unitPrice = (item.menuItem?.price || 0) + modTotal;

    await sudoContext.query.OrderItem.createOne({
      data: {
        quantity: item.quantity,
        price: Math.round(unitPrice),
        specialInstructions: item.specialInstructions || "",
        order: { connect: { id: order.id } },
        menuItem: { connect: { id: item.menuItem.id } },
        appliedModifiers: item.modifiers?.length
          ? { connect: item.modifiers.map((m: any) => ({ id: m.id })) }
          : undefined,
      },
    });
  }

  const paymentMethodMap: Record<string, string> = {
    pp_stripe_stripe: "credit_card",
    pp_paypal_paypal: "paypal",
    pp_system_default: "cash",
  };

  const payment = await sudoContext.query.Payment.createOne({
    data: {
      amount: total,
      status: paymentResult.status === "succeeded" ? "succeeded" : "pending",
      paymentMethod: paymentMethodMap[providerCode || "pp_system_default"] || "cash",
      currencyCode,
      tipAmount: tip,
      providerPaymentId: paymentResult.paymentIntentId || undefined,
      data: paymentData || {},
      processedAt:
        paymentResult.status === "succeeded"
          ? new Date().toISOString()
          : undefined,
      order: { connect: { id: order.id } },
      paymentProvider: { connect: { id: paymentProvider.id } },
    },
  });

  if (cart.paymentCollection?.id) {
    await sudoContext.query.PaymentCollection.updateOne({
      where: { id: cart.paymentCollection.id },
      data: {
        payments: { connect: [{ id: payment.id }] },
      },
    });
  }

  await sudoContext.query.Cart.updateOne({
    where: { id: cartId },
    data: {
      order: { connect: { id: order.id } },
    },
  });

  return await sudoContext.query.RestaurantOrder.findOne({
    where: { id: order.id },
    query: "id orderNumber secretKey status",
  });
}

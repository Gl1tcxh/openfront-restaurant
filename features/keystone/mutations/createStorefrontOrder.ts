import type { Context } from ".keystone/types";
import { createPayment } from "../utils/paymentProviderAdapter";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface DeliveryAddress {
  address: string;
  city: string;
  zip: string;
}

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  modifierIds?: string[];
}

interface CreateStorefrontOrderArgs {
  orderType: string;
  customerInfo: CustomerInfo;
  deliveryAddress?: DeliveryAddress;
  items: OrderItemInput[];
  subtotal: string;
  tax: string;
  tip: string;
  total: string;
  currencyCode?: string;
  specialInstructions?: string;
  paymentMethod?: string;
}

interface CreateStorefrontOrderResult {
  success: boolean;
  orderId: string | null;
  orderNumber: string | null;
  clientSecret: string | null;
  secretKey: string | null;
  error: string | null;
}

const PAYMENT_METHOD_PROVIDER_MAP: Record<string, string> = {
  card: "pp_stripe",
  paypal: "pp_paypal",
  cash: "pp_manual",
};

// Providers that handle payment client-side and don't need a server payment intent
const CLIENT_SIDE_PROVIDERS = new Set(["paypal", "cash"]);

export default async function createStorefrontOrder(
  root: any,
  args: CreateStorefrontOrderArgs,
  context: Context
): Promise<CreateStorefrontOrderResult> {
  const sudoContext = context.sudo();

  try {
    const {
      orderType,
      customerInfo,
      deliveryAddress,
      items,
      subtotal,
      tax,
      tip,
      total,
      currencyCode,
      specialInstructions,
      paymentMethod = "card",
    } = args;

    console.log({customerInfo})

    // Validate required fields
    if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        clientSecret: null,
        secretKey: null,
        error: "Customer information is required",
      };
    }

    if (!items || items.length === 0) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        clientSecret: null,
        secretKey: null,
        error: "Order must contain at least one item",
      };
    }

    // Map frontend payment method to provider code
    const providerCode = PAYMENT_METHOD_PROVIDER_MAP[paymentMethod] || "pp_stripe";

    // Get the correct payment provider
    const providers = await sudoContext.query.PaymentProvider.findMany({
      where: { code: { equals: providerCode }, isInstalled: { equals: true } },
      query: "id code isInstalled createPaymentFunction capturePaymentFunction",
    });

    const paymentProvider = providers[0];
    if (!paymentProvider) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        clientSecret: null,
        secretKey: null,
        error: `${providerCode} payment provider not configured`,
      };
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Map frontend orderType to database values
    const orderTypeMap: Record<string, string> = {
      pickup: "takeout",
      delivery: "delivery",
    };
    const dbOrderType = orderTypeMap[orderType] || "takeout";

    // Build special instructions including customer info
    const customerNote = `Customer: ${customerInfo.name}, Email: ${customerInfo.email}, Phone: ${customerInfo.phone}`;
    const deliveryNote = deliveryAddress
      ? `\nDelivery: ${deliveryAddress.address}, ${deliveryAddress.city} ${deliveryAddress.zip}`
      : "";
    const fullInstructions = `${customerNote}${deliveryNote}${specialInstructions ? "\n" + specialInstructions : ""}`;

    // Link customer if signed in
    const customerId = context.session?.itemId;

    // Map payment method to DB payment method string
    const dbPaymentMethodMap: Record<string, string> = {
      card: "credit_card",
      paypal: "paypal",
      cash: "cash",
    };
    const dbPaymentMethod = dbPaymentMethodMap[paymentMethod] || "credit_card";

    // Create the order with status 'open' (payment pending)
    const order = await sudoContext.query.RestaurantOrder.createOne({
      data: {
        orderNumber,
        orderType: dbOrderType,
        orderSource: "online",
        status: "open",
        guestCount: 1,
        specialInstructions: fullInstructions,
        subtotal: parseInt(subtotal),
        tax: parseInt(tax),
        tip: parseInt(tip),
        total: parseInt(total),
        currencyCode: currencyCode || "USD",
        customer: customerId ? { connect: { id: customerId } } : undefined,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        deliveryAddress: deliveryAddress?.address,
        deliveryCity: deliveryAddress?.city,
        deliveryZip: deliveryAddress?.zip,
      },
      query: "id orderNumber secretKey",
    });

    // Create order items
    for (const item of items) {
      await sudoContext.query.OrderItem.createOne({
        data: {
          quantity: item.quantity,
          price: Math.round(item.price),
          specialInstructions: item.specialInstructions || "",
          order: { connect: { id: order.id } },
          menuItem: { connect: { id: item.menuItemId } },
          appliedModifiers: item.modifierIds?.length
            ? { connect: item.modifierIds.map((id: string) => ({ id })) }
            : undefined,
        },
        query: "id",
      });
    }

    const amountInCents = parseInt(total);
    const normalizedCurrency = (currencyCode || "USD").toLowerCase();

    let clientSecret: string | null = null;

    if (CLIENT_SIDE_PROVIDERS.has(paymentMethod)) {
      // Cash / PayPal: create a Payment record but skip server payment intent.
      // Cash is settled in-person; PayPal is authorised client-side by the SDK.
      await sudoContext.query.Payment.createOne({
        data: {
          amount: amountInCents,
          status: "pending",
          paymentMethod: dbPaymentMethod,
          currencyCode: currencyCode || "USD",
          tipAmount: parseInt(tip),
          data: {},
          order: { connect: { id: order.id } },
          paymentProvider: { connect: { id: paymentProvider.id } },
        },
        query: "id",
      });
    } else {
      // Card: create a real Stripe payment intent
      const sessionData = await createPayment({
        provider: paymentProvider,
        order,
        amount: amountInCents,
        currency: normalizedCurrency,
      });

      clientSecret = sessionData.clientSecret;

      // Store Stripe data in JSON field (like OpenFront does)
      await sudoContext.query.Payment.createOne({
        data: {
          amount: amountInCents,
          status: "pending",
          paymentMethod: dbPaymentMethod,
          currencyCode: currencyCode || "USD",
          tipAmount: parseInt(tip),
          data: {
            paymentIntentId: sessionData.paymentIntentId,
            clientSecret: sessionData.clientSecret,
          },
          providerPaymentId: sessionData.paymentIntentId,
          order: { connect: { id: order.id } },
          paymentProvider: { connect: { id: paymentProvider.id } },
        },
        query: "id",
      });
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret,
      secretKey: order.secretKey,
      error: null,
    };
  } catch (error) {
    console.error("Error creating storefront order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      orderId: null,
      orderNumber: null,
      clientSecret: null,
      secretKey: null,
      error: errorMessage,
    };
  }
}

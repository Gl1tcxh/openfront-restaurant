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
}

interface CreateStorefrontOrderResult {
  success: boolean;
  orderId: string | null;
  orderNumber: string | null;
  clientSecret: string | null;
  secretKey: string | null;
  error: string | null;
}

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
    } = args;

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

    // Get the Stripe payment provider
    const providers = await sudoContext.query.PaymentProvider.findMany({
      where: { code: { equals: "pp_stripe" }, isInstalled: { equals: true } },
      query: "id code isInstalled createPaymentFunction capturePaymentFunction",
    });

    const stripeProvider = providers[0];
    if (!stripeProvider) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        clientSecret: null,
        secretKey: null,
        error: "Stripe payment provider not configured",
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
          price: Math.round(item.price), // Assuming price comes in cents or we should handle it
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

    // Use store-configured currency when creating payment intents/orders
    const amountInCents = parseInt(total);
    const normalizedCurrency = (currencyCode || "USD").toLowerCase();

    const sessionData = await createPayment({
      provider: stripeProvider,
      order,
      amount: amountInCents,
      currency: normalizedCurrency,
    });

    // Create Payment record with pending status
    await sudoContext.query.Payment.createOne({
      data: {
        amount: amountInCents,
        status: "pending",
        paymentMethod: "credit_card",
        currencyCode: currencyCode || "USD",
        stripePaymentIntentId: sessionData.paymentIntentId,
        tipAmount: parseInt(tip),
        order: { connect: { id: order.id } },
        paymentProvider: { connect: { id: stripeProvider.id } },
      },
      query: "id",
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: sessionData.clientSecret,
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

import { NextResponse } from "next/server";
import { keystoneContext } from "@/features/keystone/context";
import { createPaymentIntent } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.customerInfo?.name || !data.customerInfo?.email || !data.customerInfo?.phone) {
      return NextResponse.json(
        { error: "Customer information is required" },
        { status: 400 }
      );
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Parse totals
    const subtotal = parseFloat(data.subtotal);
    const tax = parseFloat(data.tax);
    const tip = parseFloat(data.tip || "0");
    const total = parseFloat(data.total);

    // Map frontend orderType to database values
    // Frontend uses "pickup" or "delivery", database uses "takeout" or "delivery"
    const orderTypeMap: Record<string, string> = {
      "pickup": "takeout",
      "delivery": "delivery",
    };
    const dbOrderType = orderTypeMap[data.orderType] || "takeout";

    // Build special instructions including customer info for online orders
    const customerNote = `Customer: ${data.customerInfo.name}, Email: ${data.customerInfo.email}, Phone: ${data.customerInfo.phone}`;
    const deliveryNote = data.deliveryAddress 
      ? `\nDelivery: ${data.deliveryAddress.address}, ${data.deliveryAddress.city} ${data.deliveryAddress.zip}`
      : '';
    const fullInstructions = `${customerNote}${deliveryNote}${data.specialInstructions ? '\n' + data.specialInstructions : ''}`;

    // Create the order with status 'open' (valid status in the model)
    const order = await keystoneContext.sudo().query.RestaurantOrder.createOne({
      data: {
        orderNumber,
        orderType: dbOrderType,
        orderSource: 'online',
        status: 'open',
        guestCount: data.guestCount || 1,
        specialInstructions: fullInstructions,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        tip: tip.toFixed(2),
        total: total.toFixed(2),
        table: data.tableId ? { connect: { id: data.tableId } } : undefined,
      },
      query: 'id orderNumber'
    });

    // Create order items
    for (const item of data.items) {
      await keystoneContext.sudo().query.OrderItem.createOne({
        data: {
          quantity: item.quantity,
          price: item.price.toString(),
          specialInstructions: item.specialInstructions || '',
          order: { connect: { id: order.id } },
          menuItem: { connect: { id: item.menuItemId } },
          appliedModifiers: item.modifierIds?.length
            ? { connect: item.modifierIds.map((id: string) => ({ id })) }
            : undefined,
        },
        query: 'id'
      });
    }

    // Create payment intent with Stripe
    const amountInCents = Math.round(total * 100);

    let clientSecret = null;

    try {
      const paymentIntent = await createPaymentIntent({
        amount: amountInCents,
        orderId: order.id,
        metadata: {
          orderNumber: order.orderNumber || "",
          customerName: data.customerInfo.name,
          customerEmail: data.customerInfo.email,
          customerPhone: data.customerInfo.phone,
          orderType: data.orderType,
        },
      });

      clientSecret = paymentIntent.client_secret;

      // Create Payment record in database with correct payment method value
      await keystoneContext.sudo().query.Payment.createOne({
        data: {
          amount: total.toFixed(2),
          status: "pending",
          paymentMethod: "credit_card",
          stripePaymentIntentId: paymentIntent.id,
          tipAmount: tip.toFixed(2),
          order: { connect: { id: order.id } },
        },
        query: 'id'
      });
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      // Continue without payment intent - customer can pay at counter
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      clientSecret,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

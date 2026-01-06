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

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Parse totals
    const subtotal = parseFloat(data.subtotal);
    const tax = parseFloat(data.tax);
    const tip = parseFloat(data.tip || "0");
    const total = parseFloat(data.total);

    // Create the order
    const order = await keystoneContext.sudo().query.RestaurantOrder.createOne({
      data: {
        orderNumber,
        orderType: data.orderType,
        status: 'pending', // Will be updated to 'paid' when payment succeeds
        guestCount: data.guestCount || 1,
        specialInstructions: data.specialInstructions || '',
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
          price: item.price,
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

      // Create Payment record in database
      await keystoneContext.sudo().query.Payment.createOne({
        data: {
          amount: total.toFixed(2),
          status: "pending",
          paymentMethod: "card",
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

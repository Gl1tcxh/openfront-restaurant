import { NextRequest, NextResponse } from "next/server";
import { keystoneContext } from "@/features/keystone/context";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // In a real app, you would link orders to customer accounts
    // For now, we'll return an empty array since we don't store email with orders
    // You would need to add a customer email field to the RestaurantOrder model

    const orders = await keystoneContext.query.RestaurantOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      query: `
        id
        orderNumber
        orderType
        status
        total
        createdAt
        items {
          id
          quantity
          price
          menuItem {
            id
            name
          }
        }
      `
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Calculate totals
    const subtotal = data.items.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // Create the order
    const order = await keystoneContext.sudo().query.RestaurantOrder.createOne({
      data: {
        orderNumber,
        orderType: data.orderType,
        status: 'open',
        guestCount: data.guestCount || 1,
        specialInstructions: data.specialInstructions || '',
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
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

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

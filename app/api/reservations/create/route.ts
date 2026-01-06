import { NextResponse } from "next/server";
import { keystoneContext } from "@/features/keystone/context";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.date || !data.time || !data.partySize) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Combine date and time into a single DateTime
    const reservationDateTime = new Date(`${data.date}T${data.time}`);

    // Create the reservation
    const reservation = await keystoneContext.sudo().query.Reservation.createOne({
      data: {
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        reservationDate: reservationDateTime.toISOString(),
        partySize: parseInt(data.partySize),
        duration: 90, // Default 90 minutes
        status: "confirmed",
        specialRequests: data.specialRequests || "",
        createdAt: new Date().toISOString(),
      },
      query: 'id customerName customerEmail reservationDate partySize'
    });

    // TODO: Send confirmation email
    // You could integrate with a service like SendGrid, Resend, or Nodemailer here

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        customerName: reservation.customerName,
        date: reservation.reservationDate,
        partySize: reservation.partySize,
      },
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

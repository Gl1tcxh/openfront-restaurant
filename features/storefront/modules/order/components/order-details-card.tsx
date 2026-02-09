"use client";

import { MapPin, Phone, Mail, User } from "lucide-react";

interface OrderDetailsCardProps {
  orderNumber: string;
  orderType: "dine_in" | "takeout" | "delivery";
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryZip?: string;
  specialInstructions?: string;
}

function formatOrderType(type: string): string {
  switch (type) {
    case "dine_in":
      return "Dine-in";
    case "takeout":
      return "Takeout";
    case "delivery":
      return "Delivery";
    default:
      return type;
  }
}

export function OrderDetailsCard({
  orderNumber,
  orderType,
  createdAt,
  customerName,
  customerEmail,
  customerPhone,
  deliveryAddress,
  deliveryCity,
  deliveryZip,
  specialInstructions,
}: OrderDetailsCardProps) {
  const formattedDate = new Date(createdAt).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Details</h3>
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Order #</span>
          <span className="font-medium">{orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span className="font-medium">{formatOrderType(orderType)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Placed</span>
          <span className="font-medium text-right text-sm">{formattedDate}</span>
        </div>

        {(customerName || customerEmail || customerPhone) && (
          <div className="border-t pt-3 space-y-2">
            {customerName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{customerName}</span>
              </div>
            )}
            {customerEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customerEmail}</span>
              </div>
            )}
            {customerPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customerPhone}</span>
              </div>
            )}
          </div>
        )}

        {orderType === "delivery" && deliveryAddress && (
          <div className="border-t pt-3">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p>{deliveryAddress}</p>
                {(deliveryCity || deliveryZip) && (
                  <p>
                    {deliveryCity}
                    {deliveryCity && deliveryZip && ", "}
                    {deliveryZip}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {specialInstructions && (
          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">Special Instructions:</p>
            <p className="text-sm mt-1">{specialInstructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}

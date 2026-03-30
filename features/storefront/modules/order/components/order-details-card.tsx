"use client";

interface OrderDetailsCardProps {
  orderNumber: string;
  orderType: "dine_in" | "takeout" | "delivery";
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryAddress2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryCountryCode?: string;
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
  deliveryAddress2,
  deliveryCity,
  deliveryState,
  deliveryZip,
  deliveryCountryCode,
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
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Order Details</h3>
      
      {/* Main details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <span className="text-muted-foreground">Order #</span>
        <span className="text-right font-medium">{orderNumber}</span>
        
        <span className="text-muted-foreground">Type</span>
        <span className="text-right font-medium">{formatOrderType(orderType)}</span>
        
        <span className="text-muted-foreground">Placed</span>
        <span className="text-right">{formattedDate}</span>
      </div>

      {/* Customer info */}
      {(customerName || customerEmail || customerPhone) && (
        <div className="border-t border-border pt-4 space-y-2">
          {customerName && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>{customerName}</span>
            </div>
          )}
          {customerEmail && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span>{customerEmail}</span>
            </div>
          )}
          {customerPhone && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span>{customerPhone}</span>
            </div>
          )}
        </div>
      )}

      {/* Delivery address */}
      {orderType === "delivery" && deliveryAddress && (
        <div className="border-t border-border pt-4">
          <div className="flex items-start gap-2 text-sm">
            <svg className="h-4 w-4 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <div>
              <p>{deliveryAddress}</p>
              {deliveryAddress2 ? <p>{deliveryAddress2}</p> : null}
              {(deliveryCity || deliveryState || deliveryZip || deliveryCountryCode) && (
                <p>
                  {[deliveryCity, deliveryState, deliveryZip, deliveryCountryCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Special instructions */}
      {specialInstructions && (
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Special Instructions</p>
          <p className="text-sm">{specialInstructions}</p>
        </div>
      )}
    </div>
  );
}

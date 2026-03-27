"use client";

import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/features/storefront/lib/currency";

interface OrderItem {
  id: string;
  thumbnail?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  modifiers?: {
    id: string;
    name: string;
    priceAdjustment: number;
  }[];
}

interface OrderItemsListProps {
  items: OrderItem[];
  currencyCode?: string;
  locale?: string;
}

export function OrderItemsList({ items, currencyCode = "USD", locale = "en-US" }: OrderItemsListProps) {
  const currencyConfig = { currencyCode, locale };
  if (!items || items.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">No items in this order.</div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Order Items</h3>
      <div className="divide-y">
        {items.map((item) => {
          const imagePath = item.thumbnail;

          return (
          <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            {imagePath && (
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <img
                  src={imagePath}
                  alt={item.menuItem.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{item.menuItem.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">{formatCurrency(item.totalPrice, currencyConfig)}</p>
              </div>
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mt-1">
                  {item.modifiers.map((mod) => (
                    <p key={mod.id} className="text-sm text-muted-foreground">
                      + {mod.name}{" "}
                      {mod.priceAdjustment > 0 && `(${formatCurrency(mod.priceAdjustment, currencyConfig)})`}
                    </p>
                  ))}
                </div>
              )}
              {item.specialInstructions && (
                <p className="mt-1 text-sm italic text-muted-foreground">
                  Note: {item.specialInstructions}
                </p>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

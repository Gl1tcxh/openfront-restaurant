"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { cn } from "@/lib/utils";

type Modifier = {
  id: string;
  name: string;
  priceAdjustment?: number;
};

type MenuItem = {
  id: string;
  name: string;
  price?: number;
  thumbnail?: string | null;
};

type LineItem = {
  id: string;
  quantity: number;
  thumbnail?: string | null;
  specialInstructions?: string;
  menuItem: MenuItem;
  modifiers?: Modifier[];
};

interface LineItemDisplayProps {
  item: LineItem;
  currencyCode: string;
  locale: string;
  editable?: boolean;
  onRemove?: (lineItemId: string) => void;
  onIncrease?: (lineItemId: string, quantity: number) => void;
  onDecrease?: (lineItemId: string, quantity: number) => void;
  isUpdating?: boolean;
  className?: string;
}

export default function LineItemDisplay({
  item,
  currencyCode,
  locale,
  editable = false,
  onRemove,
  onIncrease,
  onDecrease,
  isUpdating = false,
  className,
}: LineItemDisplayProps) {
  const modifiers = item.modifiers || [];
  const modifiersTotal = modifiers.reduce(
    (sum, modifier) => sum + (modifier.priceAdjustment || 0),
    0
  );
  const lineTotal = ((Number(item.menuItem?.price) || 0) + modifiersTotal) * item.quantity;
  const currencyConfig = { currencyCode, locale };
  const thumbnail = item.menuItem?.thumbnail || item.thumbnail || "/placeholder.jpg";

  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border border-border/40 bg-card p-4",
        className
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={thumbnail}
          alt={item.menuItem?.name || "Item"}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-medium text-foreground">
              {item.menuItem?.name}
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">Qty: {item.quantity}</p>
          </div>

          <div className="flex items-start gap-3">
            <span className="whitespace-nowrap text-sm font-medium tabular-nums text-foreground">
              {formatCurrency(lineTotal, currencyConfig)}
            </span>
            {editable && onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                disabled={isUpdating}
                className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                aria-label={`Remove ${item.menuItem?.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {modifiers.length > 0 ? (
          <div className="mt-1.5 space-y-0">
            {modifiers.map((modifier) => (
              <p key={modifier.id} className="text-xs text-muted-foreground">
                + {modifier.name}
                {(modifier.priceAdjustment || 0) > 0
                  ? ` (${formatCurrency(modifier.priceAdjustment || 0, currencyConfig)})`
                  : ""}
              </p>
            ))}
          </div>
        ) : null}

        {item.specialInstructions ? (
          <p className="mt-1.5 text-xs italic text-muted-foreground">
            Note: {item.specialInstructions}
          </p>
        ) : null}

        {editable && onIncrease && onDecrease ? (
          <div className="mt-4">
            <div className="inline-flex items-center overflow-hidden rounded-xl border border-border bg-background">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                onClick={() => onDecrease(item.id, item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                aria-label={`Decrease quantity of ${item.menuItem?.name}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums text-foreground">
                {item.quantity}
              </span>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                onClick={() => onIncrease(item.id, item.quantity + 1)}
                disabled={isUpdating}
                aria-label={`Increase quantity of ${item.menuItem?.name}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

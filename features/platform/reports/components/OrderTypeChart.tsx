"use client";

import { formatCurrency, formatNumber, formatPercentage } from "../lib/reportHelpers";

interface OrderTypeData {
  ordersByType: { dine_in: number; takeout: number; delivery: number };
  revenueByType: { dine_in: number; takeout: number; delivery: number };
}

interface OrderTypeChartProps {
  data: OrderTypeData;
  currencyCode?: string;
  locale?: string;
}

const orderTypeConfig = {
  dine_in:  { label: "Dine-in",  color: "bg-blue-500",  dot: "bg-blue-500" },
  takeout:  { label: "Takeout",  color: "bg-emerald-500", dot: "bg-emerald-500" },
  delivery: { label: "Delivery", color: "bg-amber-500", dot: "bg-amber-500" },
};

export function OrderTypeChart({ data, currencyCode = "USD", locale = "en-US" }: OrderTypeChartProps) {
  const currencyConfig = { currencyCode, locale };
  const totalOrders = Object.values(data.ordersByType).reduce((sum, n) => sum + n, 0);
  const totalRevenue = Object.values(data.revenueByType).reduce((sum, n) => sum + n, 0);

  const orderTypes = (Object.keys(data.ordersByType) as Array<keyof typeof data.ordersByType>)
    .map((key) => ({
      key,
      orders: data.ordersByType[key],
      revenue: data.revenueByType[key],
      orderPct: totalOrders > 0 ? (data.ordersByType[key] / totalOrders) * 100 : 0,
      revenuePct: totalRevenue > 0 ? (data.revenueByType[key] / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">Sales by Order Type</p>
      </div>

      {totalRevenue === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-xs text-muted-foreground">No data for this period</p>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-5">
          {orderTypes.map((type) => {
            const info = orderTypeConfig[type.key];
            return (
              <div key={type.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${info.dot}`} />
                    <span className="text-xs font-semibold">{info.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold">{formatCurrency(type.revenue, currencyConfig)}</span>
                    <span className="text-[11px] text-muted-foreground ml-2 tabular-nums">
                      {formatNumber(type.orders)} orders ({formatPercentage(type.orderPct)})
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Revenue share</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${info.color} rounded-full transition-all duration-500`} style={{ width: `${type.revenuePct}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Order share</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${info.color} opacity-50 rounded-full transition-all duration-500`} style={{ width: `${type.orderPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercentage } from "../lib/reportHelpers";

interface OrderTypeData {
  ordersByType: {
    dine_in: number;
    takeout: number;
    delivery: number;
  };
  revenueByType: {
    dine_in: number;
    takeout: number;
    delivery: number;
  };
}

interface OrderTypeChartProps {
  data: OrderTypeData;
  currencyCode?: string;
  locale?: string;
}

const orderTypeLabels = {
  dine_in: { label: "Dine-in", color: "bg-blue-500" },
  takeout: { label: "Takeout", color: "bg-green-500" },
  delivery: { label: "Delivery", color: "bg-amber-500" },
};

export function OrderTypeChart({ data, currencyCode = "USD", locale = "en-US" }: OrderTypeChartProps) {
  const currencyConfig = { currencyCode, locale };
  const totalOrders = Object.values(data.ordersByType).reduce((sum, n) => sum + n, 0);
  const totalRevenue = Object.values(data.revenueByType).reduce((sum, n) => sum + n, 0);

  const orderTypes = (Object.keys(data.ordersByType) as Array<keyof typeof data.ordersByType>).map((key) => ({
    key,
    orders: data.ordersByType[key],
    revenue: data.revenueByType[key],
    orderPercentage: totalOrders > 0 ? (data.ordersByType[key] / totalOrders) * 100 : 0,
    revenuePercentage: totalRevenue > 0 ? (data.revenueByType[key] / totalRevenue) * 100 : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Order Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {orderTypes.map((type) => {
            const info = orderTypeLabels[type.key];
            return (
              <div key={type.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(type.revenue, currencyConfig)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(type.orders)} orders ({formatPercentage(type.orderPercentage)})
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Revenue Share</span>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${info.color} transition-all duration-500`}
                        style={{ width: `${type.revenuePercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order Share</span>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${info.color} opacity-60 transition-all duration-500`}
                        style={{ width: `${type.orderPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

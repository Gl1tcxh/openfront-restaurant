"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercentage } from "../lib/reportHelpers";

interface PaymentMethodData {
  [method: string]: {
    count: number;
    total: number;
  };
}

interface PaymentMethodChartProps {
  data: PaymentMethodData;
}

const methodLabels: Record<string, { label: string; icon: string; color: string }> = {
  credit_card: { label: "Credit Card", icon: "💳", color: "bg-blue-500" },
  debit_card: { label: "Debit Card", icon: "💳", color: "bg-cyan-500" },
  cash: { label: "Cash", icon: "💵", color: "bg-green-500" },
  gift_card: { label: "Gift Card", icon: "🎁", color: "bg-purple-500" },
  apple_pay: { label: "Apple Pay", icon: "🍎", color: "bg-gray-800" },
  google_pay: { label: "Google Pay", icon: "🔵", color: "bg-red-500" },
  unknown: { label: "Other", icon: "📋", color: "bg-gray-500" },
};

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const totalRevenue = Object.values(data).reduce((sum, d) => sum + d.total, 0);
  const totalTransactions = Object.values(data).reduce((sum, d) => sum + d.count, 0);

  const methods = Object.entries(data)
    .map(([method, value]) => ({
      method,
      ...value,
      percentage: totalRevenue > 0 ? (value.total / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  if (methods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No payment data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payment Methods</CardTitle>
          <span className="text-sm text-muted-foreground">
            {formatNumber(totalTransactions)} transactions
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {methods.map((method) => {
            const info = methodLabels[method.method] || methodLabels.unknown;
            return (
              <div key={method.method} className="flex items-center gap-3">
                <span className="text-xl w-8">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{info.label}</span>
                    <span className="font-semibold ml-2">{formatCurrency(method.total)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${info.color} transition-all duration-500`}
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatNumber(method.count)} transactions</span>
                    <span>{formatPercentage(method.percentage)}</span>
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

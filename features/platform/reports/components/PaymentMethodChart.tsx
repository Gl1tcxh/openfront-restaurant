"use client";

import { formatCurrency, formatNumber, formatPercentage } from "../lib/reportHelpers";

interface PaymentMethodData {
  [method: string]: { count: number; total: number };
}

interface PaymentMethodChartProps {
  data: PaymentMethodData;
  currencyCode?: string;
  locale?: string;
}

const methodConfig: Record<string, { label: string; color: string }> = {
  credit_card: { label: "Credit Card", color: "bg-blue-500" },
  debit_card:  { label: "Debit Card",  color: "bg-cyan-500" },
  cash:        { label: "Cash",        color: "bg-emerald-500" },
  gift_card:   { label: "Gift Card",   color: "bg-purple-500" },
  apple_pay:   { label: "Apple Pay",   color: "bg-zinc-800 dark:bg-zinc-300" },
  google_pay:  { label: "Google Pay",  color: "bg-red-500" },
  unknown:     { label: "Other",       color: "bg-zinc-400" },
};

export function PaymentMethodChart({ data, currencyCode = "USD", locale = "en-US" }: PaymentMethodChartProps) {
  const currencyConfig = { currencyCode, locale };
  const totalRevenue = Object.values(data).reduce((sum, d) => sum + d.total, 0);
  const totalTransactions = Object.values(data).reduce((sum, d) => sum + d.count, 0);

  const methods = Object.entries(data)
    .map(([method, value]) => ({
      method,
      ...value,
      percentage: totalRevenue > 0 ? (value.total / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">Payment Methods</p>
        {totalTransactions > 0 && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {formatNumber(totalTransactions)} transactions
          </p>
        )}
      </div>

      {methods.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-xs text-muted-foreground">No payment data for this period</p>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-3.5">
          {methods.map((method) => {
            const info = methodConfig[method.method] || methodConfig.unknown;
            return (
              <div key={method.method} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{info.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{formatCurrency(method.total, currencyConfig)}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatPercentage(method.percentage)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${info.color} rounded-full transition-all duration-500`}
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {formatNumber(method.count)} transactions
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

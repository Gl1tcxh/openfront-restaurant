"use client";

import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency, formatNumber } from "../lib/reportHelpers";

interface RevenueChartProps {
  timeSeriesData: Array<{
    date: string;
    dateKey: string;
    revenue: number;
    orders: number;
    guests: number;
  }>;
  totalRevenue: number;
  totalOrders: number;
  totalGuests: number;
  currencyCode?: string;
  locale?: string;
}

export function RevenueChart({
  timeSeriesData,
  totalRevenue,
  totalOrders,
  totalGuests,
  currencyCode = "USD",
  locale = "en-US",
}: RevenueChartProps) {
  const id = useId();
  const [metricView, setMetricView] = useState<"revenue" | "orders" | "guests">("revenue");
  const currencyConfig = { currencyCode, locale };

  const getDisplayValue = () => {
    switch (metricView) {
      case "revenue": return formatCurrency(totalRevenue, currencyConfig);
      case "orders": return formatNumber(totalOrders);
      case "guests": return formatNumber(totalGuests);
    }
  };

  const getMetricLabel = () => {
    switch (metricView) {
      case "revenue": return "Total Revenue";
      case "orders": return "Total Orders";
      case "guests": return "Total Guests";
    }
  };

  if (timeSeriesData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-[11px] uppercase tracking-wider font-semibold">Revenue Over Time</p>
        </div>
        <div className="px-5 py-12 text-center">
          <p className="text-xs text-muted-foreground">No data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header: metric value + toggle */}
      <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{getMetricLabel()}</p>
          <p className="text-2xl font-semibold mt-0.5 tabular-nums">{getDisplayValue()}</p>
        </div>
        <div className="flex items-center border border-border rounded overflow-hidden text-[10px] mt-1">
          <RadioGroup
            value={metricView}
            onValueChange={(v) => setMetricView(v as "revenue" | "orders" | "guests")}
            className="flex"
          >
            {[
              { value: "revenue", label: "Rev" },
              { value: "orders", label: "Orders" },
              { value: "guests", label: "Guests" },
            ].map((option, i) => (
              <label
                key={option.value}
                className={`relative z-10 inline-flex h-7 cursor-pointer items-center justify-center px-2.5 font-semibold uppercase tracking-wider whitespace-nowrap transition-colors select-none ${
                  i > 0 ? "border-l border-border" : ""
                } ${
                  metricView === option.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {option.label}
                <RadioGroupItem value={option.value} className="sr-only" />
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 pb-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(value) => {
                  if (metricView === "revenue") {
                    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                    return `$${value}`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = payload[0].value as number;
                  return (
                    <div className="rounded border border-border bg-background px-3 py-2 shadow-md">
                      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
                      <div className="text-sm font-semibold">
                        {metricView === "revenue" ? formatCurrency(value, currencyConfig) : formatNumber(value)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey={metricView}
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill={`url(#${id}-fill)`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

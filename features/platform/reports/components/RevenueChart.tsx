"use client";

import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function RevenueChart({
  timeSeriesData,
  totalRevenue,
  totalOrders,
  totalGuests,
}: RevenueChartProps) {
  const id = useId();
  const [metricView, setMetricView] = useState<"revenue" | "orders" | "guests">("revenue");

  const getDisplayValue = () => {
    switch (metricView) {
      case "revenue":
        return formatCurrency(totalRevenue);
      case "orders":
        return formatNumber(totalOrders);
      case "guests":
        return formatNumber(totalGuests);
    }
  };

  const getMetricLabel = () => {
    switch (metricView) {
      case "revenue":
        return "Total Revenue";
      case "orders":
        return "Total Orders";
      case "guests":
        return "Total Guests";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle>{getMetricLabel()}</CardTitle>
            <div className="font-semibold text-2xl">
              {getDisplayValue()}
            </div>
          </div>
          <div className="bg-muted inline-flex h-7 rounded-md p-0.5">
            <RadioGroup
              value={metricView}
              onValueChange={(v) => setMetricView(v as "revenue" | "orders" | "guests")}
              className="inline-flex gap-0"
            >
              {[
                { value: "revenue", label: "Revenue" },
                { value: "orders", label: "Orders" },
                { value: "guests", label: "Guests" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`relative z-10 inline-flex h-full cursor-pointer items-center justify-center px-3 text-xs font-medium whitespace-nowrap transition-colors select-none rounded-sm ${
                    metricView === option.value
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                  <RadioGroupItem
                    value={option.value}
                    className="sr-only"
                  />
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeSeriesData}
              margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={12}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
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
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="text-sm font-semibold">
                        {metricView === "revenue" ? formatCurrency(value) : formatNumber(value)}
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
      </CardContent>
    </Card>
  );
}

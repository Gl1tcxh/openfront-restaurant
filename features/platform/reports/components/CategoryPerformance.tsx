"use client";

import { formatCurrency, formatNumber, formatPercentage } from "../lib/reportHelpers";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart2 } from "lucide-react";

interface CategoryData {
  id: string;
  name: string;
  revenue: number;
  itemsSold: number;
  itemCount: number;
  percentageOfSales: number;
}

interface CategoryPerformanceProps {
  categories: CategoryData[];
  totalRevenue: number;
  currencyCode?: string;
  locale?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
];

export function CategoryPerformance({ categories, totalRevenue, currencyCode = "USD", locale = "en-US" }: CategoryPerformanceProps) {
  const currencyConfig = { currencyCode, locale };
  const chartData = categories.map((cat, index) => ({
    name: cat.name,
    value: cat.revenue,
    color: COLORS[index % COLORS.length],
  }));

  const empty = categories.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue by Category — pie chart */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">
            Revenue by Category
          </p>
        </div>
        {empty ? (
          <div className="px-5 py-14 flex flex-col items-center text-center">
            <BarChart2 size={22} className="text-muted-foreground/20 mb-2.5" />
            <p className="text-xs font-medium text-muted-foreground">No category data yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Revenue by category will appear once orders are completed.
            </p>
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, currencyConfig)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown — divide-y rows */}
      <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
        <div className="px-5 py-3 bg-muted/20">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">
            Category Breakdown
          </p>
        </div>

        {empty ? (
          <div className="px-5 py-14 flex flex-col items-center text-center">
            <BarChart2 size={22} className="text-muted-foreground/20 mb-2.5" />
            <p className="text-xs font-medium text-muted-foreground">No categories yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Add menu items with categories to see a breakdown here.
            </p>
          </div>
        ) : (
          categories.map((category, index) => (
            <div key={category.id} className="px-5 py-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs font-semibold">{category.name}</span>
                </div>
                <span className="text-xs font-semibold">
                  {formatCurrency(category.revenue, currencyConfig)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${category.percentageOfSales}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{formatNumber(category.itemsSold)} items sold</span>
                <span>{formatPercentage(category.percentageOfSales)} of total</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercentage } from "../lib/reportHelpers";
import { TrendingUp, TrendingDown, Star, AlertCircle } from "lucide-react";

interface MenuItemPerformanceData {
  id: string;
  name: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  cost?: number;
  profitMargin?: number;
  percentageOfSales: number;
}

interface MenuItemPerformanceProps {
  items: MenuItemPerformanceData[];
  totalRevenue: number;
  currencyCode?: string;
  locale?: string;
}

function getClassification(item: MenuItemPerformanceData): {
  label: string;
  dotColor: string;
  textColor: string;
  badgeColor: string;
} {
  const highVolume = item.percentageOfSales > 5;
  const highMargin = (item.profitMargin ?? 50) > 60;

  if (highVolume && highMargin)
    return {
      label: "Star",
      dotColor: "bg-amber-400",
      textColor: "text-amber-600 dark:text-amber-400",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    };
  if (highVolume && !highMargin)
    return {
      label: "Plow Horse",
      dotColor: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    };
  if (!highVolume && highMargin)
    return {
      label: "Puzzle",
      dotColor: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    };
  return {
    label: "Dog",
    dotColor: "bg-zinc-400",
    textColor: "text-muted-foreground",
    badgeColor: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
  };
}

export function MenuItemPerformance({
  items,
  totalRevenue,
  currencyCode = "USD",
  locale = "en-US",
}: MenuItemPerformanceProps) {
  const currencyConfig = { currencyCode, locale };
  const topItems = items.slice(0, 10);
  const bottomItems = items.slice(-5).reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Selling Items */}
      <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
        <div className="px-5 py-3 bg-muted/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">Top Selling</p>
          {topItems.length > 0 && (
            <span className="ml-auto text-[11px] text-muted-foreground">
              {topItems.length} items
            </span>
          )}
        </div>

        {topItems.length === 0 ? (
          <div className="px-5 py-14 flex flex-col items-center text-center">
            <TrendingUp size={22} className="text-muted-foreground/20 mb-2.5" />
            <p className="text-xs font-medium text-muted-foreground">No item sales yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Sales data will appear once orders are completed.
            </p>
          </div>
        ) : (
          topItems.map((item, index) => {
            const cls = getClassification(item);
            return (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-4 tabular-nums shrink-0 text-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-xs font-semibold truncate">{item.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls.badgeColor}`}>
                      <span className={`w-1 h-1 rounded-full ${cls.dotColor}`} />
                      {cls.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.categoryName} · {formatNumber(item.quantitySold)} sold
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold">{formatCurrency(item.revenue, currencyConfig)}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {formatPercentage(item.percentageOfSales)} of sales
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slow Moving Items */}
      <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
        <div className="px-5 py-3 bg-muted/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">Slow Moving</p>
          {bottomItems.length > 0 && (
            <span className="ml-auto text-[11px] text-muted-foreground">
              {bottomItems.length} items
            </span>
          )}
        </div>

        {bottomItems.length === 0 ? (
          <div className="px-5 py-14 flex flex-col items-center text-center">
            <TrendingDown size={22} className="text-muted-foreground/20 mb-2.5" />
            <p className="text-xs font-medium text-muted-foreground">No slow-moving items</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              All items are performing well in this period.
            </p>
          </div>
        ) : (
          <>
            {bottomItems.map((item) => {
              const cls = getClassification(item);
              return (
                <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-xs font-semibold truncate">{item.name}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls.badgeColor}`}>
                        <span className={`w-1 h-1 rounded-full ${cls.dotColor}`} />
                        {cls.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.categoryName} · {formatNumber(item.quantitySold)} sold
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold">{formatCurrency(item.revenue, currencyConfig)}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {formatPercentage(item.percentageOfSales)} of sales
                    </p>
                  </div>
                </div>
              );
            })}
            {/* Recommendation row */}
            <div className="px-5 py-3">
              <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                <span className="font-semibold">Tip:</span> Consider promoting these items or reviewing
                pricing and menu placement.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

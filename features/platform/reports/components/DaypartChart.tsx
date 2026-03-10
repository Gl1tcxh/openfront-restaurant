"use client";

import { formatCurrency, formatNumber } from "../lib/reportHelpers";

interface DaypartData {
  breakfast: { orders: number; revenue: number };
  lunch: { orders: number; revenue: number };
  dinner: { orders: number; revenue: number };
  lateNight: { orders: number; revenue: number };
}

interface DaypartChartProps {
  data: DaypartData;
  currencyCode?: string;
  locale?: string;
}

const daypartLabels: Record<keyof DaypartData, { label: string; time: string; color: string; dot: string }> = {
  breakfast: { label: "Breakfast", time: "6AM – 11AM", color: "bg-amber-400", dot: "bg-amber-400" },
  lunch:     { label: "Lunch",     time: "11AM – 3PM", color: "bg-orange-500", dot: "bg-orange-500" },
  dinner:    { label: "Dinner",    time: "3PM – 10PM",  color: "bg-red-500",    dot: "bg-red-500" },
  lateNight: { label: "Late Night",time: "10PM – 6AM", color: "bg-purple-500", dot: "bg-purple-500" },
};

export function DaypartChart({ data, currencyCode = "USD", locale = "en-US" }: DaypartChartProps) {
  const currencyConfig = { currencyCode, locale };
  const totalRevenue = Object.values(data).reduce((sum, d) => sum + d.revenue, 0);

  const sortedDayparts = (Object.entries(data) as Array<[keyof DaypartData, { orders: number; revenue: number }]>)
    .map(([key, value]) => ({
      key,
      ...value,
      percentage: totalRevenue > 0 ? (value.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">Sales by Daypart</p>
      </div>

      {totalRevenue === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-xs text-muted-foreground">No data for this period</p>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">
          {sortedDayparts.map((daypart) => {
            const info = daypartLabels[daypart.key];
            return (
              <div key={daypart.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${info.dot}`} />
                    <span className="text-xs font-semibold">{info.label}</span>
                    <span className="text-[11px] text-muted-foreground">{info.time}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold">{formatCurrency(daypart.revenue, currencyConfig)}</span>
                    <span className="text-[11px] text-muted-foreground ml-2 tabular-nums">
                      {formatNumber(daypart.orders)} orders
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${info.color} transition-all duration-500 rounded-full`}
                    style={{ width: `${daypart.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

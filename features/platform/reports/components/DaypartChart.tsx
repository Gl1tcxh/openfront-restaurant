"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "../lib/reportHelpers";

interface DaypartData {
  breakfast: { orders: number; revenue: number };
  lunch: { orders: number; revenue: number };
  dinner: { orders: number; revenue: number };
  lateNight: { orders: number; revenue: number };
}

interface DaypartChartProps {
  data: DaypartData;
}

const daypartLabels: Record<keyof DaypartData, { label: string; time: string; color: string }> = {
  breakfast: { label: "Breakfast", time: "6AM - 11AM", color: "bg-yellow-500" },
  lunch: { label: "Lunch", time: "11AM - 3PM", color: "bg-orange-500" },
  dinner: { label: "Dinner", time: "3PM - 10PM", color: "bg-red-500" },
  lateNight: { label: "Late Night", time: "10PM - 6AM", color: "bg-purple-500" },
};

export function DaypartChart({ data }: DaypartChartProps) {
  const totalRevenue = Object.values(data).reduce((sum, d) => sum + d.revenue, 0);
  
  const sortedDayparts = (Object.entries(data) as Array<[keyof DaypartData, { orders: number; revenue: number }]>)
    .map(([key, value]) => ({
      key,
      ...value,
      percentage: totalRevenue > 0 ? (value.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Daypart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedDayparts.map((daypart) => {
            const info = daypartLabels[daypart.key];
            return (
              <div key={daypart.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${info.color}`} />
                    <span className="font-medium">{info.label}</span>
                    <span className="text-xs text-muted-foreground">({info.time})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(daypart.revenue)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formatNumber(daypart.orders)} orders)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${info.color} transition-all duration-500`}
                    style={{ width: `${daypart.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

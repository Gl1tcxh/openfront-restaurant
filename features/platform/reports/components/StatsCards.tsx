"use client";

import { cn } from "@/lib/utils";

interface StatData {
  name: string;
  value: string;
  previous?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

interface StatsCardsProps {
  data: StatData[];
  loading?: boolean;
}

export function StatsCards({ data, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x border-b border-border">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-5 py-3">
            <div className="h-2.5 w-20 bg-muted animate-pulse rounded mb-2" />
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 divide-x border-b border-border">
      {data.map((item) => (
        <div key={item.name} className="px-5 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {item.name}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl font-semibold">{item.value}</p>
            {item.change && (
              <span
                className={cn(
                  "text-xs font-medium",
                  item.changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
                  item.changeType === "negative" && "text-red-500 dark:text-red-400",
                  item.changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {item.changeType === "positive" ? "+" : ""}
                {item.change}
              </span>
            )}
          </div>
          {item.previous && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              prev {item.previous}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

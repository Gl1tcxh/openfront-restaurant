"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
  },
  disabled: {
    label: "Disabled",
    dot: "bg-zinc-400",
  },
} as const;

interface StatusTabsProps {
  statusCounts: {
    all: number;
    active: number;
    disabled: number;
  };
}

export function StatusTabs({ statusCounts }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();

  const statuses = [
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "disabled", label: "Disabled", count: statusCounts.disabled },
  ] as const;

  const isDisabledFilter = searchParams.get("!isDisabled_is");
  let currentStatus = "all";
  if (isDisabledFilter) {
    try {
      const parsed = JSON.parse(decodeURIComponent(isDisabledFilter));
      if (parsed === false) currentStatus = "active";
      else if (parsed === true) currentStatus = "disabled";
    } catch {}
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (status === "all") {
      params.delete("!isDisabled_is");
    } else {
      params.set("!isDisabled_is", JSON.stringify(status === "active" ? false : true));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex items-end px-4 md:px-6 min-w-max">
        {/* All tab */}
        <button
          onClick={() => handleStatusChange("all")}
          className={cn(
            "px-3 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors flex items-center gap-2",
            currentStatus === "all"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All Discounts
          <span className="rounded-sm bg-background border shadow-xs px-1.5 text-[10px] leading-[14px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 inline-flex items-center h-[18px]">
            {statusCounts.all}
          </span>
        </button>

        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className={cn(
              "px-3 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors flex items-center gap-2",
              currentStatus === status.value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusConfig[status.value].dot)} />
            {status.label}
            <span className="rounded-sm bg-background border shadow-xs px-1.5 text-[10px] leading-[14px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 inline-flex items-center h-[18px]">
              {status.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

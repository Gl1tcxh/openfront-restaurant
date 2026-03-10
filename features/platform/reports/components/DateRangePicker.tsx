"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  className?: string;
  onDateChange?: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ className, onDateChange }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>();

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onDateChange?.(range);
  };

  const label = date?.from
    ? date.to
      ? `${format(date.from, "MMM d")} – ${format(date.to, "MMM d, y")}`
      : format(date.from, "MMM d, y")
    : "Custom range";

  return (
    <div className={cn(className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 border border-border rounded h-8 px-3 text-[10px] font-semibold uppercase tracking-wider transition-colors",
              date?.from
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <CalendarIcon className="h-3 w-3 shrink-0" />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
          {date?.from && (
            <div className="border-t border-border px-4 py-2.5 flex justify-end">
              <button
                onClick={() => handleSelect(undefined)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear range
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

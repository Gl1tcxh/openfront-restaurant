'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const periods = [
  { value: '7d',  label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '12m', label: '12M' },
];

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams?.get('period') || '30d';

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('period', value);
    params.delete('startDate');
    params.delete('endDate');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center border border-border rounded overflow-hidden text-[10px]">
      {periods.map((period, i) => (
        <button
          key={period.value}
          onClick={() => handleChange(period.value)}
          className={cn(
            'px-3 h-8 font-semibold uppercase tracking-wider transition-colors',
            i > 0 && 'border-l border-border',
            currentPeriod === period.value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

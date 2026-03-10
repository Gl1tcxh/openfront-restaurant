import {
  getMenuItemPerformance,
} from "../actions";
import {
  getDateRange,
  calculateMenuItemPerformance,
  calculateCategoryPerformance,
  formatCurrency,
  formatNumber,
} from "../lib/reportHelpers";
import { getStoreSettings } from "@/features/storefront/lib/data/menu";
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import { PeriodSelector } from "../components/PeriodSelector";
import { DateRangePickerWrapper } from "../components/DateRangePickerWrapper";
import { MenuItemPerformance } from "../components/MenuItemPerformance";
import { CategoryPerformance } from "../components/CategoryPerformance";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function MenuPerformanceReport({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedPeriod = (resolvedSearchParams.period as string) || "30d";

  const customStartDate = resolvedSearchParams.startDate as string;
  const customEndDate = resolvedSearchParams.endDate as string;

  let startDate: string;
  let endDate: string;

  if (customStartDate && customEndDate) {
    startDate = customStartDate;
    endDate = customEndDate;
  } else {
    const range = getDateRange(selectedPeriod);
    startDate = range.startDate;
    endDate = range.endDate;
  }

  try {
    const [response, storeSettings] = await Promise.all([
      getMenuItemPerformance(startDate, endDate),
      getStoreSettings(),
    ]);

    const currencyConfig = {
      currencyCode: storeSettings?.currencyCode || "USD",
      locale: storeSettings?.locale || "en-US",
    };

    const orderItems = response.success ? response.data?.orderItems || [] : [];

    const menuItemPerformance = calculateMenuItemPerformance(orderItems);
    const categoryPerformance = calculateCategoryPerformance(orderItems);

    const totalRevenue = menuItemPerformance.reduce((sum, item) => sum + item.revenue, 0);
    const totalItemsSold = menuItemPerformance.reduce((sum, item) => sum + item.quantitySold, 0);
    const uniqueItems = menuItemPerformance.length;
    const avgRevenuePerItem = uniqueItems > 0 ? totalRevenue / uniqueItems : 0;

    return (
      <div className="flex flex-col h-full bg-background">
        <PageBreadcrumbs
          items={[
            { type: "link", label: "Dashboard", href: "/dashboard" },
            { type: "link", label: "Reports", href: "/dashboard/platform/reports" },
            { type: "page", label: "Menu Performance" },
          ]}
        />

        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-border flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Menu Engineering</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Item popularity and revenue analysis. Identify Stars, Plow Horses, Puzzles, and Dogs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PeriodSelector />
            <DateRangePickerWrapper />
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x border-b border-border">
          <div className="px-5 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(totalRevenue, currencyConfig)}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Items Sold</p>
            <p className="text-xl font-semibold mt-1">{formatNumber(totalItemsSold)}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Unique Items</p>
            <p className="text-xl font-semibold mt-1">{formatNumber(uniqueItems)}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg Revenue / Item</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(avgRevenuePerItem, currencyConfig)}</p>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-4 md:px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6">

              {/* Left: performance tables */}
              <div className="space-y-6">
                <MenuItemPerformance
                  items={menuItemPerformance}
                  totalRevenue={totalRevenue}
                  currencyCode={currencyConfig.currencyCode}
                  locale={currencyConfig.locale}
                />
                <CategoryPerformance
                  categories={categoryPerformance}
                  totalRevenue={totalRevenue}
                  currencyCode={currencyConfig.currencyCode}
                  locale={currencyConfig.locale}
                />
              </div>

              {/* Right: Engineering Guide */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
                  {/* Section header */}
                  <div className="px-5 py-3 bg-muted/20">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">
                      Engineering Guide
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Use these quadrants to optimize profit margin.
                    </p>
                  </div>

                  {/* Stars */}
                  <div className="px-5 py-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Stars</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      High profit + high popularity. Promote everywhere. Don't change the recipe.
                    </p>
                  </div>

                  {/* Plow Horses */}
                  <div className="px-5 py-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Plow Horses</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Low profit + high popularity. Consider a price increase or cheaper ingredient alternatives.
                    </p>
                  </div>

                  {/* Puzzles */}
                  <div className="px-5 py-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Puzzles</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      High profit + low popularity. Train staff to upsell. Give better menu placement.
                    </p>
                  </div>

                  {/* Dogs */}
                  <div className="px-5 py-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dogs</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Low profit + low popularity. Consider removing to reduce inventory waste.
                    </p>
                  </div>

                  {/* Action */}
                  <div className="px-5 py-3">
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                      Download Strategy PDF
                    </Button>
                  </div>
                </div>

                {/* Connect Recipes callout */}
                <div className="rounded-lg border border-border border-dashed bg-muted/20 px-5 py-4">
                  <p className="text-xs font-semibold mb-1">Need deeper insights?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Connect your inventory data to get automated food cost % calculations per item.
                  </p>
                  <Button variant="outline" size="sm" className="h-7 text-xs w-full">
                    Connect Recipes
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </ScrollArea>
      </div>
    );
  } catch (error) {
    console.error("Error loading menu performance report:", error);
    return (
      <div className="flex flex-col h-full bg-background">
        <PageBreadcrumbs
          items={[
            { type: "link", label: "Dashboard", href: "/dashboard" },
            { type: "link", label: "Reports", href: "/dashboard/platform/reports" },
            { type: "page", label: "Menu Performance" },
          ]}
        />
        <div className="px-4 md:px-6 py-8">
          <p className="text-sm text-red-600 font-medium">Failed to load menu performance data.</p>
          <p className="text-xs text-muted-foreground mt-1">This usually means no completed orders exist for the selected period.</p>
        </div>
      </div>
    );
  }
}

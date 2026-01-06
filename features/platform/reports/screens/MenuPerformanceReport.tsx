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
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import { PeriodSelector } from "../components/PeriodSelector";
import { DateRangePickerWrapper } from "../components/DateRangePickerWrapper";
import { MenuItemPerformance } from "../components/MenuItemPerformance";
import { CategoryPerformance } from "../components/CategoryPerformance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    const response = await getMenuItemPerformance(startDate, endDate);
    const orderItems = response.success ? response.data?.orderItems || [] : [];

    const menuItemPerformance = calculateMenuItemPerformance(orderItems);
    const categoryPerformance = calculateCategoryPerformance(orderItems);
    
    const totalRevenue = menuItemPerformance.reduce((sum, item) => sum + item.revenue, 0);
    const totalItemsSold = menuItemPerformance.reduce((sum, item) => sum + item.quantitySold, 0);
    const uniqueItems = menuItemPerformance.length;

    const statsData = [
      { name: "Total Revenue", value: formatCurrency(totalRevenue) },
      { name: "Items Sold", value: formatNumber(totalItemsSold) },
      { name: "Unique Items", value: formatNumber(uniqueItems) },
      { name: "Avg Revenue/Item", value: formatCurrency(uniqueItems > 0 ? totalRevenue / uniqueItems : 0) },
    ];

    return (
      <section
        aria-label="Menu Performance Report"
        className="overflow-hidden flex flex-col"
      >
        <PageBreadcrumbs
          items={[
            { type: "link", label: "Dashboard", href: "/dashboard" },
            { type: "link", label: "Reports", href: "/dashboard/reports/sales" },
            { type: "page", label: "Menu Performance" },
          ]}
        />

        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Menu Performance
              </h1>
              <p className="text-muted-foreground">
                Analyze menu item sales, identify stars and opportunities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PeriodSelector />
              <DateRangePickerWrapper />
            </div>
          </div>

          <div className="px-4 md:px-6 py-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statsData.map((stat) => (
                <Card key={stat.name}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.name}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <MenuItemPerformance items={menuItemPerformance} totalRevenue={totalRevenue} />

            <CategoryPerformance categories={categoryPerformance} totalRevenue={totalRevenue} />

            <Card>
              <CardHeader>
                <CardTitle>Menu Engineering Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-semibold text-yellow-800 mb-2">⭐ Stars</div>
                    <p className="text-yellow-700">High popularity + high profit margin. Feature prominently and maintain quality.</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-semibold text-blue-800 mb-2">📈 Plow Horses</div>
                    <p className="text-blue-700">High popularity but lower margin. Consider recipe costs or portion adjustments.</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="font-semibold text-purple-800 mb-2">🧩 Puzzles</div>
                    <p className="text-purple-700">Low popularity but high margin. Increase visibility through better placement or promotion.</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="font-semibold text-gray-800 mb-2">🐕 Dogs</div>
                    <p className="text-gray-700">Low popularity and low margin. Consider removing or repositioning on the menu.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Error loading menu performance report:", error);
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-red-600">
          Report Error
        </h1>
        <p className="mt-2 text-muted-foreground">
          Failed to load menu performance data. Please try again later.
        </p>
      </div>
    );
  }
}

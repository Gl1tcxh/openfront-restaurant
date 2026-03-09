import {
  getSalesOverview,
  getPaymentBreakdown,
} from "../actions";
import {
  getDateRange,
  getPreviousPeriodRange,
  calculateSalesMetrics,
  calculateDaypartMetrics,
  calculatePaymentMethodBreakdown,
  calculatePercentageChange,
  generateTimeSeriesData,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "../lib/reportHelpers";
import { getStoreSettings } from "@/features/storefront/lib/data/menu";
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import { StatsCards } from "../components/StatsCards";
import { PeriodSelector } from "../components/PeriodSelector";
import { DateRangePickerWrapper } from "../components/DateRangePickerWrapper";
import { RevenueChart } from "../components/RevenueChart";
import { DaypartChart } from "../components/DaypartChart";
import { OrderTypeChart } from "../components/OrderTypeChart";
import { PaymentMethodChart } from "../components/PaymentMethodChart";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function SalesReportPage({ searchParams }: PageProps) {
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

  const previousRange = getPreviousPeriodRange(
    selectedPeriod,
    customStartDate,
    customEndDate
  );
  const previousStartDate = previousRange.startDate;
  const previousEndDate = previousRange.endDate;

  try {
    const [salesResponse, paymentResponse, storeSettings] = await Promise.all([
      getSalesOverview(startDate, endDate, previousStartDate, previousEndDate),
      getPaymentBreakdown(startDate, endDate),
      getStoreSettings(),
    ]);

    const currencyConfig = {
      currencyCode: storeSettings?.currencyCode || "USD",
      locale: storeSettings?.locale || "en-US",
    };

    const salesData = salesResponse.success ? salesResponse.data : null;
    const paymentData = paymentResponse.success ? paymentResponse.data : null;

    const orders = salesData?.restaurantOrders || [];
    const previousOrders = salesData?.previousOrders || [];
    const payments = paymentData?.payments || [];

    const salesMetrics = calculateSalesMetrics(orders, previousOrders);
    const daypartMetrics = calculateDaypartMetrics(orders);
    const paymentBreakdown = calculatePaymentMethodBreakdown(payments);
    const timeSeriesData = generateTimeSeriesData(
      orders.filter((o: any) => o.status === 'completed'),
      new Date(startDate),
      new Date(endDate),
      selectedPeriod === "12m" ? "month" : "day"
    );

    const statsData = [
      {
        name: "Total Revenue",
        value: formatCurrency(salesMetrics.totalRevenue, currencyConfig),
        previous: formatCurrency(salesMetrics.previousRevenue, currencyConfig),
        change: salesMetrics.previousRevenue > 0
          ? `${calculatePercentageChange(salesMetrics.totalRevenue, salesMetrics.previousRevenue).value.toFixed(1)}%`
          : undefined,
        changeType: salesMetrics.previousRevenue > 0
          ? (calculatePercentageChange(salesMetrics.totalRevenue, salesMetrics.previousRevenue).isPositive
            ? "positive" as const
            : "negative" as const)
          : "neutral" as const,
      },
      {
        name: "Total Orders",
        value: formatNumber(salesMetrics.completedOrders),
        previous: formatNumber(salesMetrics.previousOrders),
        change: salesMetrics.previousOrders > 0
          ? `${calculatePercentageChange(salesMetrics.completedOrders, salesMetrics.previousOrders).value.toFixed(1)}%`
          : undefined,
        changeType: salesMetrics.previousOrders > 0
          ? (calculatePercentageChange(salesMetrics.completedOrders, salesMetrics.previousOrders).isPositive
            ? "positive" as const
            : "negative" as const)
          : "neutral" as const,
      },
      {
        name: "Average Check",
        value: formatCurrency(salesMetrics.averageCheckSize, currencyConfig),
        previous: formatCurrency(salesMetrics.previousAverageCheck, currencyConfig),
        change: salesMetrics.previousAverageCheck > 0
          ? `${calculatePercentageChange(salesMetrics.averageCheckSize, salesMetrics.previousAverageCheck).value.toFixed(1)}%`
          : undefined,
        changeType: salesMetrics.previousAverageCheck > 0
          ? (calculatePercentageChange(salesMetrics.averageCheckSize, salesMetrics.previousAverageCheck).isPositive
            ? "positive" as const
            : "negative" as const)
          : "neutral" as const,
      },
      {
        name: "Total Guests",
        value: formatNumber(salesMetrics.totalGuests),
        previous: formatNumber(salesMetrics.previousGuests),
        change: salesMetrics.previousGuests > 0
          ? `${calculatePercentageChange(salesMetrics.totalGuests, salesMetrics.previousGuests).value.toFixed(1)}%`
          : undefined,
        changeType: salesMetrics.previousGuests > 0
          ? (calculatePercentageChange(salesMetrics.totalGuests, salesMetrics.previousGuests).isPositive
            ? "positive" as const
            : "negative" as const)
          : "neutral" as const,
      },
    ];

    return (
      <section
        aria-label="Sales Report"
        className="overflow-hidden flex flex-col"
      >
        <PageBreadcrumbs
          items={[
            {
              type: "link",
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              type: "page",
              label: "Reports",
            },
            {
              type: "page",
              label: "Sales",
            },
          ]}
        />

        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Sales Report
              </h1>
              <p className="text-muted-foreground">
                Track your restaurant's sales performance and key metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PeriodSelector />
              <DateRangePickerWrapper />
            </div>
          </div>

          <div className="px-4 md:px-6 py-6 space-y-6">
            <StatsCards data={statsData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart
                timeSeriesData={timeSeriesData}
                totalRevenue={salesMetrics.totalRevenue}
                totalOrders={salesMetrics.completedOrders}
                totalGuests={salesMetrics.totalGuests}
                currencyCode={currencyConfig.currencyCode}
                locale={currencyConfig.locale}
              />
              <DaypartChart
                data={daypartMetrics}
                currencyCode={currencyConfig.currencyCode}
                locale={currencyConfig.locale}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OrderTypeChart
                data={{
                  ordersByType: salesMetrics.ordersByType,
                  revenueByType: salesMetrics.revenueByType,
                }}
                currencyCode={currencyConfig.currencyCode}
                locale={currencyConfig.locale}
              />
              <PaymentMethodChart
                data={paymentBreakdown}
                currencyCode={currencyConfig.currencyCode}
                locale={currencyConfig.locale}
              />
            </div>

            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">Additional Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Tax</span>
                  <div className="font-semibold">{formatCurrency(salesMetrics.totalTax, currencyConfig)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Tips</span>
                  <div className="font-semibold">{formatCurrency(salesMetrics.totalTips, currencyConfig)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Discounts</span>
                  <div className="font-semibold">{formatCurrency(salesMetrics.totalDiscounts, currencyConfig)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Revenue per Guest</span>
                  <div className="font-semibold">{formatCurrency(salesMetrics.revenuePerGuest, currencyConfig)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Error loading sales report:", error);
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-red-600">
          Report Error
        </h1>
        <p className="mt-2 text-muted-foreground">
          Failed to load sales report data. Please try again later.
        </p>
      </div>
    );
  }
}

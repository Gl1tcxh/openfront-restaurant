"use client";

import { useSearchParams } from "next/navigation";
import { StatusTabs } from "../components/StatusTabs";
import { OrderDetailsComponent } from "../components/OrderDetailsComponent";
import { PageContainer } from "@/features/dashboard/components/PageContainer";
import { EmptyState } from "@/components/ui/empty-state";
import { Ticket, Search, Square, Circle, Triangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OrderListPageClientProps {
  initialData: {
    items: any[];
    count: number;
  };
  statusCounts: any;
  error?: string | null;
}

export function OrderListPageClient({ initialData, statusCounts, error }: OrderListPageClientProps) {
  const searchParams = useSearchParams();
  const searchString = searchParams.get("search") || "";

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Orders' }
  ];

  const header = (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <p className="text-muted-foreground text-sm">
        Track and manage all restaurant service orders.
      </p>
    </div>
  );

  return (
    <PageContainer title="Orders" header={header} breadcrumbs={breadcrumbs}>
      <div className="flex flex-col h-full bg-background">
        <StatusTabs statusCounts={statusCounts} />

        <div className="flex-1">
          {error ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : initialData.items.length === 0 ? (
            <div className="p-12">
              {searchString ? (
                <EmptyState
                  title="No results found"
                  description={`We couldn't find any orders matching "${searchString}"`}
                  icons={[Search]}
                />
              ) : (
                <EmptyState
                  title="No orders yet"
                  description="New orders from the storefront or POS will appear here."
                  icons={[Ticket, Triangle, Square, Circle]}
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y border-t">
              {initialData.items.map((order) => (
                <OrderDetailsComponent key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

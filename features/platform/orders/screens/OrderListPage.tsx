import { getOrders, getOrderStatusCounts } from "../actions";
import { OrderListPageClient } from "./OrderListPageClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function OrderListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  
  const statusFilter = resolvedSearchParams["!status_matches"];
  let status = null;
  if (statusFilter) {
    try {
      const parsed = JSON.parse(decodeURIComponent(statusFilter as string));
      if (Array.isArray(parsed) && parsed.length > 0) {
        status = typeof parsed[0] === "object" ? parsed[0].value : parsed[0];
      }
    } catch (e) {}
  }

  const where: any = {};
  if (status && status !== "all") {
    where.status = { equals: status };
  }

  const response = await getOrders(where, 50, 0);
  const statusCountsResponse = await getOrderStatusCounts();

  let fetchedData = { items: [], count: 0 };
  if (response.success) {
    fetchedData = response.data;
  }

  let statusCounts = {
    all: 0,
    open: 0,
    sent_to_kitchen: 0,
    in_progress: 0,
    ready: 0,
    served: 0,
    completed: 0,
    cancelled: 0,
  };

  if (statusCountsResponse.success) {
    statusCounts = statusCountsResponse.data;
  }

  return (
    <OrderListPageClient 
      initialData={fetchedData} 
      statusCounts={statusCounts} 
    />
  );
}

export default OrderListPage;

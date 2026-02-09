import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs';
import { OrderPageClient } from './OrderPageClient';
import { getOrder } from '../actions';
import { notFound } from 'next/navigation';

interface OrderPageParams {
  params: Promise<{
    id: string;
  }>;
}

export async function OrderDetailPage({ params }: OrderPageParams) {
  const resolvedParams = await params;
  const itemId = resolvedParams.id;

  const response = await getOrder(itemId);

  if (!response.success) {
    console.error('Error fetching order:', response.error);
    throw new Error(`Failed to fetch order ${itemId}: ${response.error}`);
  }

  const order = response.data?.restaurantOrder;

  if (!order) {
    notFound();
  }

  return (
    <>
      <PageBreadcrumbs
        items={[
          { type: 'link', label: 'Dashboard', href: '' },
          { type: 'page', label: 'Platform' },
          { type: 'link', label: 'Orders', href: '/platform/orders' },
          { type: 'page', label: `#${order.orderNumber}` },
        ]}
      />
      <OrderPageClient
        order={order}
      />
    </>
  );
} 

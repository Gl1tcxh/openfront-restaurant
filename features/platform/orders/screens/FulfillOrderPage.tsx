import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs';
import { FulfillOrderClient } from './FulfillOrderClient';
import { getOrder } from '../actions';
import { notFound } from 'next/navigation';

interface FulfillPageParams {
  params: Promise<{
    id: string;
  }>;
}

export async function FulfillOrderPage({ params }: FulfillPageParams) {
  const resolvedParams = await params;
  const itemId = resolvedParams.id;

  const response = await getOrder(itemId);

  if (!response.success) {
    throw new Error(`Failed to fetch order ${itemId}`);
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
          { type: 'link', label: `#${order.orderNumber}`, href: `/platform/orders/${order.id}` },
          { type: 'page', label: 'Service Management' },
        ]}
      />
      <FulfillOrderClient
        order={order}
      />
    </>
  );
} 

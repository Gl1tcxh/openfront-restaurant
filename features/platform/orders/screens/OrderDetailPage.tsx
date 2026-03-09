import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs';
import { OrderPageClient } from './OrderPageClient';
import { getOrder } from '../actions';
import { notFound } from 'next/navigation';
import { getStoreSettings } from '@/features/storefront/lib/data/menu';

interface OrderPageParams {
  params: Promise<{
    id: string;
  }>;
}

export async function OrderDetailPage({ params }: OrderPageParams) {
  const resolvedParams = await params;
  const itemId = resolvedParams.id;

  const [response, storeSettings] = await Promise.all([
    getOrder(itemId),
    getStoreSettings(),
  ]);

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
        currencyCode={storeSettings?.currencyCode || 'USD'}
        locale={storeSettings?.locale || 'en-US'}
      />
    </>
  );
} 

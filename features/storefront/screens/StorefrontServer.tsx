import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import QueryProvider from '@/features/storefront/lib/providers/query-client-provider';
import { CartProvider } from '@/features/storefront/lib/cart-context';
import { getUser } from '@/features/storefront/lib/data/user';
import { getStoreSettings } from '@/features/storefront/lib/data/menu';
import { fetchCart } from '@/features/storefront/lib/data';
import StorefrontLayout from './StorefrontLayout';

interface StorefrontServerProps {
  children: React.ReactNode;
}

export default async function StorefrontServer({
  children,
}: StorefrontServerProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });

  // Prefetch basic data
  const [user, storeSettings, cart] = await Promise.all([
    getUser(),
    getStoreSettings(),
    fetchCart(),
  ]);

  if (user) {
    queryClient.setQueryData(["user"], user);
  }

  if (cart) {
    queryClient.setQueryData(["cart"], cart);
  }

  const storeInfo = storeSettings ? {
    name: storeSettings.name,
    tagline: storeSettings.tagline || '',
    address: storeSettings.address || '',
    phone: storeSettings.phone || '',
    hours: storeSettings.hours || {},
    deliveryFee: parseFloat(storeSettings.deliveryFee) || 0,
    deliveryMinimum: parseFloat(storeSettings.deliveryMinimum) || 0,
    pickupDiscount: storeSettings.pickupDiscount ?? 0,
    estimatedDelivery: storeSettings.estimatedDelivery || '',
    estimatedPickup: storeSettings.estimatedPickup || '',
    heroHeadline: storeSettings.heroHeadline,
    heroSubheadline: storeSettings.heroSubheadline,
    heroTagline: storeSettings.heroTagline,
    promoBanner: storeSettings.promoBanner,
    rating: parseFloat(storeSettings.rating) || undefined,
    reviewCount: storeSettings.reviewCount || undefined,
  } : null;

  return (
    <QueryProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CartProvider>
          <StorefrontLayout storeInfo={storeInfo} user={user}>
            {children}
          </StorefrontLayout>
        </CartProvider>
      </HydrationBoundary>
    </QueryProvider>
  );
}

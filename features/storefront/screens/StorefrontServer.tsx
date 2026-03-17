import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import QueryProvider from '@/features/storefront/lib/providers/query-client-provider';
import { getUser } from '@/features/storefront/lib/data/user';
import { getStoreSettings, getStorefrontPaymentConfig } from '@/features/storefront/lib/data/menu';
import { fetchCart } from '@/features/storefront/lib/data';
import { getCurrencyConfig } from '@/features/storefront/lib/currency';
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
  const [user, storeSettings, cart, paymentConfig] = await Promise.all([
    getUser(),
    getStoreSettings(),
    fetchCart(),
    getStorefrontPaymentConfig(),
  ]);

  if (user) {
    queryClient.setQueryData(["user"], user);
  }

  if (cart) {
    queryClient.setQueryData(["cart"], cart);
  }

  const currencyConfig = getCurrencyConfig(storeSettings || undefined)

  const storeInfo = storeSettings ? {
    name: storeSettings.name,
    tagline: storeSettings.tagline || '',
    address: storeSettings.address || '',
    phone: storeSettings.phone || '',
    currencyCode: currencyConfig.currencyCode,
    locale: currencyConfig.locale,
    timezone: storeSettings.timezone || 'America/New_York',
    countryCode: storeSettings.countryCode || 'US',
    hours: storeSettings.hours || {},
    deliveryFee: parseFloat(storeSettings.deliveryFee) || 0,
    deliveryMinimum: parseFloat(storeSettings.deliveryMinimum) || 0,
    pickupDiscount: storeSettings.pickupDiscount ?? 0,
    taxRate: parseFloat(storeSettings.taxRate || "8.75") || 8.75,
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
        <StorefrontLayout storeInfo={storeInfo} user={user} paymentConfig={paymentConfig}>
          {children}
        </StorefrontLayout>
      </HydrationBoundary>
    </QueryProvider>
  );
}

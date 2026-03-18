import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/features/storefront/lib/query-keys';
import QueryProvider from '@/features/storefront/lib/providers/query-client-provider';
import { getUser } from '@/features/storefront/lib/data/user';
import { getStoreSettings, getStorefrontPaymentConfig } from '@/features/storefront/lib/data/menu';
import { fetchCart } from '@/features/storefront/lib/data';

interface StorefrontServerProps {
  children: React.ReactNode;
  prefetchUser?: boolean;
  prefetchCart?: boolean;
}

export default async function StorefrontServer({
  children,
  prefetchUser = true,
  prefetchCart = true,
}: StorefrontServerProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });

  // Build prefetch promises
  const prefetchPromises: Promise<void>[] = [];

  if (prefetchUser) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: () => getUser(),
      })
    );
  }

  if (prefetchCart) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.cart.active(),
        queryFn: () => fetchCart(),
      })
    );
  }

  await Promise.all(prefetchPromises);

  return (
    <QueryProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
      </HydrationBoundary>
    </QueryProvider>
  );
}

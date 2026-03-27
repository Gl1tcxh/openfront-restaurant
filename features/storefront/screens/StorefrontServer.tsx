import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys';
import {
  fetchMenuItems,
  fetchCart,
  fetchUser,
  fetchStoreSettings,
  fetchMenuCategories,
} from '../lib/data';
import QueryProvider from '@/features/storefront/lib/providers/query-client-provider';

interface StorefrontServerProps {
  children: React.ReactNode;
  prefetchMenuItems?: {
    categoryId?: string;
    limit?: number;
    featured?: boolean;
  };
  prefetchUser?: boolean;
  prefetchCart?: boolean;
  prefetchStoreSettings?: boolean;
  prefetchMenuCategories?: boolean;
}

export default async function StorefrontServer({
  children,
  prefetchMenuItems = { limit: 12 },
  prefetchUser = true,
  prefetchCart = true,
  prefetchStoreSettings = true,
  prefetchMenuCategories = true,
}: StorefrontServerProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });

  const prefetchPromises: Promise<void>[] = [];

  if (prefetchMenuItems) {
    const queryKey = prefetchMenuItems.featured
      ? queryKeys.menu.featured(prefetchMenuItems.limit ?? 12)
      : queryKeys.menu.list(prefetchMenuItems);

    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey,
        queryFn: () => fetchMenuItems(prefetchMenuItems),
      })
    );
  }

  if (prefetchUser) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: () => fetchUser(),
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

  if (prefetchStoreSettings) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.store.settings(),
        queryFn: () => fetchStoreSettings(),
      })
    );
  }

  if (prefetchMenuCategories) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.menu.categories(),
        queryFn: () => fetchMenuCategories(),
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

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import QueryProvider from '@/features/storefront/lib/providers/query-client-provider';

interface StorefrontServerProps {
  children: React.ReactNode;
}

export default async function StorefrontServer({ children }: StorefrontServerProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });

  return (
    <QueryProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
      </HydrationBoundary>
    </QueryProvider>
  );
}

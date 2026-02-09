/**
 * Get the base URL for the application dynamically
 * Works both server-side and client-side without requiring environment variables
 */

export async function getBaseUrl(): Promise<string> {
  // Client-side: use window.location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side: try to get from headers
  if (typeof process !== 'undefined') {
    try {
      // Use dynamic import to prevent next/headers from being bundled in client components
      // This is a more robust way to ensure client-safety than top-level imports
      const { headers } = await import("next/headers");
      const headersList = await headers();

      // Try x-forwarded-host first (common in production deployments)
      const host = headersList.get('x-forwarded-host') || headersList.get('host');
      const protocol = headersList.get('x-forwarded-proto') || 'https';

      if (host) {
        return `${protocol}://${host}`;
      }
    } catch (e) {
      // headers() might not be available in all contexts
    }
  }

  // Production fallback - return empty string and let relative URLs work
  return '';
}

/**
 * Get the GraphQL endpoint URL
 * Uses NEXT_PUBLIC_BACKEND_URL if set, otherwise falls back to current origin
 */
export async function getGraphQLEndpoint(): Promise<string> {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/graphql`;
  }

  // Fallback to current origin
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/api/graphql`;
}

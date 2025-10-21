import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';

/**
 * Create an IndexedDB storage persister for React Query
 * This allows the cache to persist across browser sessions
 */
function createIDBPersister() {
  return {
    persistClient: async (client: any) => {
      await set('REACT_QUERY_CACHE', client);
    },
    restoreClient: async () => {
      return await get<any>('REACT_QUERY_CACHE');
    },
    removeClient: async () => {
      await del('REACT_QUERY_CACHE');
    },
  };
}

/**
 * Configure the QueryClient with sensible defaults for caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
      
      // Consider data stale after 1 minute
      // This means it will refetch in the background when accessed
      staleTime: 1000 * 60, // 1 minute
      
      // Retry failed requests 2 times
      retry: 2,
      
      // Don't refetch on window focus by default (can be overridden per query)
      refetchOnWindowFocus: true,
      
      // Refetch when the network reconnects
      refetchOnReconnect: true,
      
      // Refetch when mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

/**
 * Set up persistent storage with IndexedDB
 * This will save the cache to IndexedDB and restore it on page load
 */
export function setupQueryPersistence() {
  const persister = createIDBPersister();
  
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    // Only persist successful queries
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        return query.state.status === 'success';
      },
    },
  });
}

/**
 * Clear all cached data
 * Useful for logout or when data needs to be refreshed
 */
export async function clearCache() {
  queryClient.clear();
  await del('REACT_QUERY_CACHE');
}


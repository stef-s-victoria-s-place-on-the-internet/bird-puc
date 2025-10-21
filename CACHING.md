# Caching Implementation

## Overview

This application now uses **TanStack Query (React Query)** for data fetching and caching. This provides automatic caching, request deduplication, background refetching, and persistent storage using IndexedDB.

## Benefits

### 🚀 Performance
- **Instant loading** from cache for previously viewed data
- **Request deduplication** - multiple components requesting the same data only trigger one network request
- **Background refetching** - data is updated in the background when it becomes stale
- **Optimistic UI updates** - show cached data while fetching fresh data

### 💾 Persistence
- **IndexedDB storage** - cache persists across browser sessions (up to 24 hours)
- **Offline capability** - show cached data even when offline
- **Smart invalidation** - automatically clears stale data

### 🎯 Better UX
- **Loading states** - distinguish between initial loading and background refreshing
- **Error handling** - automatic retry logic for failed requests
- **Stale-while-revalidate** - show cached data while fetching updates

## Cache Configuration

### Default Settings
```typescript
{
  // Cache data for 5 minutes
  gcTime: 1000 * 60 * 5,
  
  // Consider data stale after 1 minute
  staleTime: 1000 * 60,
  
  // Retry failed requests 2 times
  retry: 2,
  
  // Auto-refetch when window regains focus
  refetchOnWindowFocus: true,
  
  // Refetch when network reconnects
  refetchOnReconnect: true,
}
```

### Query-Specific Settings

#### Daily Detections
- **Stale Time:** 1 minute
- **Cache Time:** 5 minutes
- **Key:** `['detections', { period, first, after, stationIds }]`

#### Monthly Counts (Calendar)
- **Stale Time:** 5 minutes (changes less frequently)
- **Cache Time:** 15 minutes
- **Key:** `['monthly-counts', { period, stationIds }]`

#### Species Detections
- **Stale Time:** 2 minutes
- **Cache Time:** 10 minutes
- **Key:** `['species-detections', speciesId, stationIds]`

## How It Works

### 1. Query Keys
Every query has a unique key based on its parameters. This ensures:
- Different filter combinations are cached separately
- Changing filters automatically fetches new data
- The right cache is invalidated when needed

```typescript
// Examples of cache keys
['detections', { period: { from: '2025-10-21', to: '2025-10-21' }, first: 50, stationIds: ['123'] }]
['species-detections', '456', ['123']]
['monthly-counts', { period: { from: '2025-10-01', to: '2025-10-31' }, stationIds: ['123'] }]
```

### 2. Automatic Caching
When you fetch data:
1. React Query checks if cached data exists
2. If yes and fresh (< stale time), returns cached data instantly
3. If yes but stale (> stale time), returns cached data AND fetches in background
4. If no, shows loading state and fetches data

### 3. Persistence
- Cache is saved to IndexedDB automatically
- On page load, cache is restored from IndexedDB
- Only successful queries are persisted
- Cache expires after 24 hours

### 4. Background Refetching
Data is automatically refreshed when:
- Window regains focus (user returns to tab)
- Network reconnects after being offline
- Data becomes stale (after stale time)

## Usage Examples

### Using the Hook
```typescript
const {
  detections,
  loading,      // true only on initial load
  isRefreshing, // true when refetching in background
  error,
} = useDetections({
  selectedDate: new Date(),
  filters: { stationIds: ['123'] },
  pageSize: 50,
  currentPage: 1,
});

// Show cached data with a refresh indicator
if (isRefreshing) {
  return <div>🔄 Updating... (showing cached data)</div>
}
```

### Direct Query Usage
```typescript
const { data, isLoading, isFetching, error } = useQuery({
  queryKey: queryKeys.speciesDetections(speciesId, stationIds),
  queryFn: () => fetchSpeciesDetections({ speciesId, first: 1000, stationIds }),
  enabled: !!speciesId,
  staleTime: 1000 * 60 * 2,
});
```

### Manual Cache Invalidation
```typescript
import { queryClient } from './lib/queryClient';

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['detections'] });

// Invalidate all queries
queryClient.invalidateQueries();

// Clear cache and storage
import { clearCache } from './lib/queryClient';
await clearCache();
```

## Development Tools

### React Query DevTools
In development mode, the DevTools are available at the bottom of the screen:
- View all active queries and their state
- Inspect cache contents
- Manually refetch or invalidate queries
- Monitor network requests

To open: Click the React Query icon in the bottom-right corner

## Cache Behavior Examples

### Scenario 1: First Visit
```
User selects date → Loading spinner → Data fetched → Cached for 5 minutes
```

### Scenario 2: Returning Within 1 Minute
```
User selects same date → Instant display from cache (no loading)
```

### Scenario 3: Returning After 1-5 Minutes
```
User selects same date → Instant display from cache → Background refresh → Updated data
```

### Scenario 4: Returning After 5 Minutes
```
User selects same date → Loading spinner → Data fetched → Cached again
```

### Scenario 5: Offline Mode
```
User opens app offline → Cached data from IndexedDB → "Showing cached data" message
```

### Scenario 6: Page Refresh
```
User refreshes page → Cache restored from IndexedDB → Background refresh → Updated if stale
```

## Monitoring Cache Performance

### Check Cache Hit Rate
Open DevTools and look for:
- 🟢 Cache hit: Data served from cache (instant)
- 🟡 Cache stale: Data served from cache + background refresh
- 🔴 Cache miss: Loading state + network request

### Storage Usage
Check IndexedDB in browser DevTools:
1. Open DevTools → Application → IndexedDB
2. Look for `keyval-store` → `REACT_QUERY_CACHE`
3. View cache size and contents

## Best Practices

### For Developers

1. **Use appropriate stale times**
   - Frequently changing data: 1 minute
   - Stable data: 5-15 minutes
   - Historical data: 30+ minutes

2. **Invalidate on mutations**
   ```typescript
   // After creating/updating/deleting data
   queryClient.invalidateQueries({ queryKey: ['detections'] });
   ```

3. **Handle loading states**
   ```typescript
   // Distinguish initial load from refresh
   if (isLoading) return <Spinner />;
   if (isRefreshing) return <RefreshIndicator />;
   ```

4. **Enable only when ready**
   ```typescript
   useQuery({
     enabled: !!requiredParam, // Only fetch when param is available
   });
   ```

### For Users

1. **Internet connection**
   - First visit requires internet
   - Subsequent visits work offline with cached data
   
2. **Storage management**
   - Cache clears after 24 hours
   - Browser storage quota applies (usually 5-50 MB)
   
3. **Force refresh**
   - Pull to refresh (mobile)
   - Close and reopen tab (desktop)
   - Or wait for automatic background refresh

## Troubleshooting

### Cache Not Persisting
- Check browser storage quota
- Ensure IndexedDB is enabled
- Check for private/incognito mode restrictions

### Data Not Updating
- Check stale time configuration
- Manually invalidate queries
- Check network connection

### High Memory Usage
- Reduce `gcTime` to clear cache sooner
- Limit `maxAge` for persistence
- Clear cache periodically

## Files Modified

1. **`src/lib/queryClient.ts`** - Query client configuration and persistence setup
2. **`src/api/graphql.ts`** - Query functions and cache keys
3. **`src/hooks/useDetections.ts`** - Refactored to use React Query
4. **`src/pages/SpeciesDetail.tsx`** - Refactored to use React Query
5. **`src/App.tsx`** - Added QueryClientProvider and DevTools

## Dependencies Added

```json
{
  "@tanstack/react-query": "^5.x",
  "@tanstack/react-query-persist-client": "^5.x",
  "@tanstack/react-query-devtools": "^5.x",
  "idb-keyval": "^6.x"
}
```

## Further Reading

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Query Keys Best Practices](https://tkdodo.eu/blog/effective-react-query-keys)
- [Caching Strategies](https://tanstack.com/query/latest/docs/react/guides/caching)


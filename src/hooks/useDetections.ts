import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';
import { fetchDetections, queryKeys } from '../api/graphql';
import { Detection, FilterState } from '../types';
import { formatDateForAPI } from '../utils/formatters';

interface UseDetectionsOptions {
  selectedDate: Date;
  filters: FilterState;
  pageSize: number;
  currentPage: number;
}

interface UseDetectionsReturn {
  detections: Detection[];
  dayCounts: Record<string, number>;
  loading: boolean;
  isRefreshing: boolean;
  error: string | null;
  totalCount: number;
  hasNextPage: boolean;
  pageCursors: string[];
  fetchDetections: () => Promise<void>;
  fetchMonthlyCounts: () => Promise<void>;
  setPageCursors: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useDetections({
  selectedDate,
  filters,
  pageSize,
  currentPage
}: UseDetectionsOptions): UseDetectionsReturn {
  const queryClient = useQueryClient();
  const [pageCursors, setPageCursors] = useState<string[]>(['']); // Store cursor for each page (empty string for first page)

  // Build query parameters
  const queryParams = useMemo(() => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    const afterCursor = pageCursors[currentPage - 1];

    return {
      period: {
        from: formatDateForAPI(start),
        to: formatDateForAPI(end),
      },
      first: pageSize,
      after: afterCursor || undefined,
      stationIds: filters.stationIds,
    };
  }, [selectedDate, pageSize, currentPage, pageCursors, filters.stationIds]);

  // Query for daily detections
  const {
    data: detectionsData,
    isLoading: isLoadingDetections,
    isFetching: isFetchingDetections,
    error: detectionsError,
    refetch: refetchDetections,
  } = useQuery({
    queryKey: queryKeys.detections(queryParams),
    queryFn: () => fetchDetections(queryParams),
    enabled: filters.stationIds.length > 0, // Only fetch if station is selected
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Build monthly query parameters
  const monthlyQueryParams = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    return {
      period: {
        from: formatDateForAPI(start),
        to: formatDateForAPI(end),
      },
      first: 10000, // Get up to 10k detections for the month
      stationIds: filters.stationIds,
    };
  }, [selectedDate, filters.stationIds]);

  // Query for monthly counts (for calendar)
  const {
    data: monthlyData,
    isLoading: isLoadingMonthly,
  } = useQuery({
    queryKey: queryKeys.monthlyCounts(monthlyQueryParams),
    queryFn: () => fetchDetections(monthlyQueryParams),
    enabled: filters.stationIds.length > 0, // Only fetch if station is selected
    staleTime: 1000 * 60 * 5, // 5 minutes (monthly data changes less frequently)
    gcTime: 1000 * 60 * 15, // 15 minutes
    select: (data) => {
      // Transform the data to count detections by day
      const counts: Record<string, number> = {};
      data.nodes.forEach((detection) => {
        const dateKey = format(new Date(detection.timestamp), 'yyyy-MM-dd');
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      });
      return counts;
    },
  });

  // Update page cursors when we get new data
  if (detectionsData?.pageInfo.hasNextPage && pageCursors.length === currentPage) {
    const endCursor = detectionsData.pageInfo.endCursor;
    if (endCursor && !pageCursors.includes(endCursor)) {
      setPageCursors(prev => [...prev, endCursor]);
    }
  }

  // Manual refetch functions for backwards compatibility
  const manualFetchDetections = useCallback(async () => {
    await refetchDetections();
  }, [refetchDetections]);

  const manualFetchMonthlyCounts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.monthlyCounts(monthlyQueryParams) });
  }, [queryClient, monthlyQueryParams]);

  // Determine loading and refreshing states
  const loading = isLoadingDetections || isLoadingMonthly;
  const isRefreshing = isFetchingDetections && !isLoadingDetections;

  return {
    detections: detectionsData?.nodes || [],
    dayCounts: monthlyData || {},
    loading,
    isRefreshing,
    error: detectionsError instanceof Error ? detectionsError.message : null,
    totalCount: detectionsData?.totalCount || 0,
    hasNextPage: detectionsData?.pageInfo.hasNextPage || false,
    pageCursors,
    fetchDetections: manualFetchDetections,
    fetchMonthlyCounts: manualFetchMonthlyCounts,
    setPageCursors,
  };
}

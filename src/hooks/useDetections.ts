import { useState, useEffect, useCallback } from 'react';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';
import { graphqlClient, DETECTIONS_QUERY } from '../api/graphql';
import { DetectionsResponse, Detection, FilterState } from '../types';
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
  const [detections, setDetections] = useState<Detection[]>([]);
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageCursors, setPageCursors] = useState<string[]>(['']); // Store cursor for each page (empty string for first page)

  const fetchDetections = useCallback(async () => {
    // Require station selection before fetching
    if (filters.stationIds.length === 0) {
      setDetections([]);
      setTotalCount(0);
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    // If we already have detections, show refreshing state instead of loading
    if (detections.length > 0) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);

      interface QueryVariables {
        period: {
          from: string;
          to: string;
        };
        first: number;
        after?: string;
        stationIds: string[];
      }

      // Get the cursor for the current page
      const afterCursor = pageCursors[currentPage - 1];

      const variables: QueryVariables = {
        period: {
          from: formatDateForAPI(start),
          to: formatDateForAPI(end),
        },
        first: pageSize,
        stationIds: filters.stationIds,
      };

      // Only include 'after' if we're not on the first page
      if (afterCursor) {
        variables.after = afterCursor;
      }

      const data = await graphqlClient.request<DetectionsResponse>(
        DETECTIONS_QUERY,
        variables
      );

      setDetections(data.detections.nodes);
      setTotalCount(data.detections.totalCount);
      setHasNextPage(data.detections.pageInfo.hasNextPage);

      // Store the endCursor for the next page if we haven't stored it yet
      if (data.detections.pageInfo.hasNextPage && pageCursors.length === currentPage) {
        setPageCursors(prev => [...prev, data.detections.pageInfo.endCursor]);
      }
    } catch (err) {
      console.error('Error fetching detections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch detections');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, filters, detections.length, pageSize, currentPage, pageCursors]);

  // Fetch monthly counts for calendar
  const fetchMonthlyCounts = useCallback(async () => {
    // Require station selection before fetching
    if (filters.stationIds.length === 0) {
      setDayCounts({});
      return;
    }

    try {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);

      interface QueryVariables {
        period: {
          from: string;
          to: string;
        };
        first: number;
        stationIds: string[];
      }

      const variables: QueryVariables = {
        period: {
          from: formatDateForAPI(start),
          to: formatDateForAPI(end),
        },
        first: 10000, // Get up to 10k detections for the month
        stationIds: filters.stationIds,
      };

      const data = await graphqlClient.request<DetectionsResponse>(
        DETECTIONS_QUERY,
        variables
      );

      // Count detections by day
      const counts: Record<string, number> = {};
      data.detections.nodes.forEach((detection) => {
        const dateKey = format(new Date(detection.timestamp), 'yyyy-MM-dd');
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      });

      setDayCounts(counts);
    } catch (err) {
      console.error('Error fetching monthly counts:', err);
    }
  }, [selectedDate, filters]);

  useEffect(() => {
    fetchDetections();
  }, [fetchDetections]);

  useEffect(() => {
    fetchMonthlyCounts();
  }, [fetchMonthlyCounts]);

  return {
    detections,
    dayCounts,
    loading,
    isRefreshing,
    error,
    totalCount,
    hasNextPage,
    pageCursors,
    fetchDetections,
    fetchMonthlyCounts,
    setPageCursors
  };
}


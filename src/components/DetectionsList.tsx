import { useState, useEffect, useCallback } from 'react';
import { FilterState, Detection } from '../types';
import { Sidebar } from './Sidebar';
import { loadFilters } from '../utils/localStorage';
import { loadSettings, TimeFormat } from '../utils/settings';
import { getAudioUrl as getAudioUrlUtil } from '../utils/audioUrl';
import { filterDetections, sortDetections, groupDetectionsBySpecies } from '../utils/detectionFilters';
import { useDetections } from '../hooks/useDetections';
import { useDownload } from '../hooks/useDownload';
import { DetectionsHeader } from './detections/DetectionsHeader';
import { LoadingStates } from './detections/LoadingStates';
import { DetectionCard } from './detections/DetectionCard';
import { SpeciesGroup } from './detections/SpeciesGroup';
import { PaginationControls } from './detections/PaginationControls';
import './DetectionsList.css';

type LayoutMode = 'timeline' | 'grouped';

export function DetectionsList() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [prevDate, setPrevDate] = useState(new Date());
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize with saved filters from localStorage
    const savedFilters = loadFilters();
    return savedFilters || { 
      stationIds: [], 
      stationNames: [],
      speciesIds: [],
      speciesNames: [],
      minConfidence: 0,
      timeOfDay: [],
      sortBy: 'time-desc'
    };
  });
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    return loadSettings().timeFormat;
  });
  const [normalizeAudioUrls, setNormalizeAudioUrls] = useState<boolean>(() => {
    return loadSettings().normalizeAudioUrls;
  });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('layoutMode');
    return (saved as LayoutMode) || 'timeline';
  });
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('pageSize');
    return saved ? parseInt(saved, 10) : 1000;
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Use custom hooks
  const {
    detections,
    dayCounts,
    loading,
    isRefreshing,
    error,
    totalCount,
    hasNextPage,
    fetchDetections,
    setPageCursors
  } = useDetections({
    selectedDate,
    filters,
    pageSize,
    currentPage
  });

  const getAudioUrl = useCallback((url: string) => {
    return getAudioUrlUtil(url, normalizeAudioUrls);
  }, [normalizeAudioUrls]);

  const {
    isDownloading,
    downloadProgress,
    handleDownloadAll,
    handleCancelDownload
  } = useDownload({
    selectedDate,
    filters,
    totalCount,
    getAudioUrl
  });

  useEffect(() => {
    // Reset to page 1 and clear cursors when date changes
    if (selectedDate.toDateString() !== prevDate.toDateString()) {
      setCurrentPage(1);
      setPageCursors(['']);
      setPrevDate(selectedDate);
    }
  }, [selectedDate, prevDate, setPageCursors]);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    setPageCursors(['']); // Reset cursors
  }, [setPageCursors]);

  const handleTimeFormatChange = useCallback((format: TimeFormat) => {
    setTimeFormat(format);
  }, []);

  const handleNormalizeAudioUrlsChange = useCallback((enabled: boolean) => {
    setNormalizeAudioUrls(enabled);
  }, []);

  const handleLayoutModeChange = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('layoutMode', mode);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    setPageCursors(['']); // Reset cursors
    localStorage.setItem('pageSize', newPageSize.toString());
  }, [setPageCursors]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  // Get unique species from detections for the filter dropdown
  const availableSpecies = detections.reduce((acc, detection) => {
    if (!acc.find(s => s.id === detection.species.id)) {
      acc.push(detection.species);
    }
    return acc;
  }, [] as typeof detections[0]['species'][]);

  // Apply client-side filters and sorting
  const filteredDetections = filterDetections(detections, filters);
  const filteredAndSortedDetections = sortDetections(filteredDetections, filters.sortBy);

  // Helper to get audio URL for a detection
  const getDetectionAudioUrl = useCallback((detection: Detection): string | null => {
    if (!detection.soundscape?.url) return null;
    return getAudioUrl(detection.soundscape.url);
  }, [getAudioUrl]);

  // Check if download is available
  const canDownload = detections.length > 0 && detections.some(d => d.soundscape?.id);
  const showStations = filters.stationIds.length > 1;

  return (
    <>
      <Sidebar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onFiltersChange={handleFiltersChange}
        onTimeFormatChange={handleTimeFormatChange}
        onNormalizeAudioUrlsChange={handleNormalizeAudioUrlsChange}
        dayCounts={dayCounts}
        availableSpecies={availableSpecies}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />
      
      <div className="detections-container">
        <DetectionsHeader
          totalCount={totalCount}
          filteredCount={filteredAndSortedDetections.length}
          isRefreshing={isRefreshing}
          hasDetections={filteredAndSortedDetections.length > 0}
          canDownload={canDownload}
          isDownloading={isDownloading}
          layoutMode={layoutMode}
          downloadProgress={downloadProgress}
          onLayoutModeChange={handleLayoutModeChange}
          onDownloadAll={handleDownloadAll}
          onCancelDownload={handleCancelDownload}
        />

        <LoadingStates
          loading={loading}
          error={error}
          hasDetections={detections.length > 0 && filteredAndSortedDetections.length > 0}
          hasFilters={detections.length > 0 && filteredAndSortedDetections.length === 0}
          hasStationSelected={filters.stationIds.length > 0}
          selectedDate={selectedDate}
          onRetry={fetchDetections}
        />

        {!loading && !error && filteredAndSortedDetections.length > 0 && layoutMode === 'timeline' && (
          <div className="detections-list">
            {filteredAndSortedDetections.map((detection) => (
              <DetectionCard
                key={detection.id}
                detection={detection}
                timeFormat={timeFormat}
                audioUrl={getDetectionAudioUrl(detection)}
                showStation={showStations}
                compact={false}
              />
            ))}
          </div>
        )}

        {!loading && !error && filteredAndSortedDetections.length > 0 && layoutMode === 'grouped' && (
          <div className="detections-list grouped">
            {groupDetectionsBySpecies(filteredAndSortedDetections).map(({ species, detections: groupDetections }) => (
              <SpeciesGroup
                key={species.id}
                species={species}
                detections={groupDetections}
                timeFormat={timeFormat}
                showStations={showStations}
                getAudioUrl={getDetectionAudioUrl}
              />
            ))}
          </div>
        )}

        {!loading && !error && detections.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            hasNextPage={hasNextPage}
            filteredCount={filteredAndSortedDetections.length}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
          />
        )}
      </div>
    </>
  );
}

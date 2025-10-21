import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { graphqlClient, DETECTIONS_QUERY } from '../api/graphql';
import { DetectionsResponse, Detection, FilterState } from '../types';
import { Sidebar } from './Sidebar';
import { loadFilters } from '../utils/localStorage';
import { loadSettings, TimeFormat } from '../utils/settings';
import './DetectionsList.css';

type LayoutMode = 'timeline' | 'grouped';

// Helper function to format date for API in local timezone
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
};

export function DetectionsList() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [prevDate, setPrevDate] = useState(new Date());
  const [detections, setDetections] = useState<Detection[]>([]);
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('layoutMode');
    return (saved as LayoutMode) || 'timeline';
  });
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('pageSize');
    return saved ? parseInt(saved, 10) : 1000;
  });
  const [currentPage, setCurrentPage] = useState(1);
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
    // Reset to page 1 and clear cursors when date changes
    if (selectedDate.toDateString() !== prevDate.toDateString()) {
      setCurrentPage(1);
      setPageCursors(['']);
      setPrevDate(selectedDate);
    }
  }, [selectedDate, prevDate]);

  useEffect(() => {
    fetchDetections();
  }, [fetchDetections]);

  useEffect(() => {
    fetchMonthlyCounts();
  }, [fetchMonthlyCounts]);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    setPageCursors(['']); // Reset cursors
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    let hour12: boolean | undefined = undefined;
    if (timeFormat === '12h') {
      hour12 = true;
    } else if (timeFormat === '24h') {
      hour12 = false;
    }
    // If 'auto', leave undefined to use locale default
    
    return date.toLocaleTimeString(navigator.language, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: hour12
    });
  };

  const handleTimeFormatChange = useCallback((format: TimeFormat) => {
    setTimeFormat(format);
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
  }, []);

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
  const filteredAndSortedDetections = detections
    .filter(detection => {
      // Species filter
      if (filters.speciesIds.length > 0 && !filters.speciesIds.includes(detection.species.id)) {
        return false;
      }

      // Confidence filter
      if (detection.confidence < filters.minConfidence / 100) {
        return false;
      }

      // Time of day filter
      if (filters.timeOfDay.length > 0) {
        const hour = new Date(detection.timestamp).getHours();
        const matchesTimeOfDay = filters.timeOfDay.some(period => {
          switch (period) {
            case 'morning': return hour >= 5 && hour < 12;
            case 'afternoon': return hour >= 12 && hour < 17;
            case 'evening': return hour >= 17 && hour < 21;
            case 'night': return hour >= 21 || hour < 5;
            default: return false;
          }
        });
        if (!matchesTimeOfDay) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'time-asc':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'time-desc':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'confidence-asc':
          return a.confidence - b.confidence;
        case 'confidence-desc':
          return b.confidence - a.confidence;
        case 'species-asc':
          return a.species.commonName.localeCompare(b.species.commonName);
        case 'species-desc':
          return b.species.commonName.localeCompare(a.species.commonName);
        default:
          return 0;
      }
    });

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds);
    const secs = Math.floor((seconds - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownloadAll = async () => {
    if (filters.stationIds.length === 0) {
      alert('Please select at least one station to download detections.');
      return;
    }
    
    if (totalCount === 0) return;
    
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0 });

    try {
      // First, fetch ALL detections (not just the displayed 100)
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);

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
        first: 10000, // Fetch up to 10,000 detections for download
        stationIds: filters.stationIds,
      };

      // Fetch all detections for download
      const data = await graphqlClient.request<DetectionsResponse>(
        DETECTIONS_QUERY,
        variables
      );

      const allDetections = data.detections.nodes;
      
      const zip = new JSZip();
      
      // Group detections by species
      const detectionsBySpecies = allDetections.reduce((acc, detection) => {
        const speciesName = detection.species.commonName;
        if (!acc[speciesName]) {
          acc[speciesName] = [];
        }
        acc[speciesName].push(detection);
        return acc;
      }, {} as Record<string, Detection[]>);

      // Count total files to download
      const totalFiles = allDetections.filter(d => d.soundscape?.id).length;
      setDownloadProgress({ current: 0, total: totalFiles });

      let downloadedCount = 0;

      // Download and add files to zip, organized by species
      for (const [speciesName, speciesDetections] of Object.entries(detectionsBySpecies)) {
        // Create a safe folder name
        const folderName = speciesName.replace(/[^a-z0-9]/gi, '_');
        const speciesFolder = zip.folder(folderName);

        if (speciesFolder) {
          for (const detection of speciesDetections) {
            if (detection.soundscape?.id) {
              try {
                // Fetch the audio file using normalized URL
                const audioUrl = detection.soundscape.url.replace('/soundscapes/', '/soundscapes/normalize/').replace('media.birdweather', 'app.birdweather');
                const response = await fetch(audioUrl);
                const blob = await response.blob();
                
                // Use the download filename from API or create a descriptive one
                const fileName = detection.soundscape.downloadFilename || 
                  `${format(new Date(detection.timestamp), 'yyyy-MM-dd_HH-mm-ss')}_${(detection.confidence * 100).toFixed(0)}pct.mp3`;
                
                // Add file to species folder
                speciesFolder.file(fileName, blob);
                
                downloadedCount++;
                setDownloadProgress({ current: downloadedCount, total: totalFiles });
              } catch (err) {
                console.error(`Failed to download ${detection.id}:`, err);
              }
            }
          }
        }
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const fileName = filters.stationIds.length > 0 
        ? `birdweather_${dateStr}_filtered.zip`
        : `birdweather_${dateStr}.zip`;
      
      saveAs(zipBlob, fileName);
      
    } catch (err) {
      console.error('Error creating download:', err);
      alert('Failed to create download. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <>
      <Sidebar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onFiltersChange={handleFiltersChange}
        onTimeFormatChange={handleTimeFormatChange}
        dayCounts={dayCounts}
        availableSpecies={availableSpecies}
      />
      
      <div className="detections-container">
        <header className="detections-header">
          <div className="header-left">
            <div className="header-title-section">
              <h1>Bird Detections</h1>
              {totalCount > 0 && (
                <span className="detection-count">
                  {filteredAndSortedDetections.length} of {totalCount} {totalCount === 1 ? 'detection' : 'detections'}
                </span>
              )}
            </div>
            {isRefreshing && (
              <span className="refreshing-indicator">
                <div className="mini-spinner"></div>
                Refreshing...
              </span>
            )}
          </div>
          <div className="header-right">
            {filteredAndSortedDetections.length > 0 && (
              <>
                <div className="layout-switcher">
                  <button
                    className={`layout-btn ${layoutMode === 'timeline' ? 'active' : ''}`}
                    onClick={() => handleLayoutModeChange('timeline')}
                    title="Timeline view"
                  >
                    <span className="layout-icon">📅</span>
                    Timeline
                  </button>
                  <button
                    className={`layout-btn ${layoutMode === 'grouped' ? 'active' : ''}`}
                    onClick={() => handleLayoutModeChange('grouped')}
                    title="Group by species"
                  >
                    <span className="layout-icon">🦜</span>
                    By Bird
                  </button>
                </div>
                <div className="page-size-selector">
                  <label htmlFor="page-size">Page size:</label>
                  <select
                    id="page-size"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="page-size-select"
                  >
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                    <option value={2500}>2500</option>
                    <option value={5000}>5000</option>
                  </select>
                </div>
              </>
            )}
            {detections.length > 0 && detections.some(d => d.soundscape?.id) && (
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="download-btn"
                title="Download all audio files as ZIP"
              >
                {isDownloading ? (
                  <>
                    <div className="mini-spinner"></div>
                    {downloadProgress.total > 0 && (
                      <span>
                        {downloadProgress.current}/{downloadProgress.total}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="download-icon">⬇️</span>
                    Download All
                  </>
                )}
              </button>
            )}
          </div>
        </header>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading detections...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={fetchDetections} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && detections.length === 0 && (
        <div className="empty-state">
          {filters.stationIds.length === 0 ? (
            <>
              <p>📍 Please select a station from the sidebar to view detections</p>
            </>
          ) : (
            <p>🔍 No detections found for {format(selectedDate, 'MMMM d, yyyy')}</p>
          )}
        </div>
      )}

      {!loading && !error && detections.length > 0 && filteredAndSortedDetections.length === 0 && (
        <div className="empty-state">
          <p>🔍 No detections match your current filters</p>
          <p style={{ fontSize: '0.9em', marginTop: '0.5rem', opacity: 0.8 }}>
            Try adjusting your species, confidence, or time of day filters
          </p>
        </div>
      )}

      {!loading && !error && filteredAndSortedDetections.length > 0 && layoutMode === 'timeline' && (
        <div className="detections-list">
          {filteredAndSortedDetections.map((detection) => (
            <div key={detection.id} className="detection-card">
              <div className="detection-header">
                <div className="species-info">
                  {detection.species.thumbnailUrl && (
                    <img
                      src={detection.species.thumbnailUrl}
                      alt={detection.species.commonName}
                      className="species-thumbnail"
                    />
                  )}
                  <div className="species-names">
                    <h3 className="common-name">{detection.species.commonName}</h3>
                    <p className="scientific-name">{detection.species.scientificName}</p>
                  </div>
                </div>

                {detection.soundscape?.id ? (
                  <div className="audio-wrapper">
                    <audio controls preload='metadata' className="audio-player">
                      <source src={detection.soundscape.url.replace('/soundscapes/', '/soundscapes/normalize/').replace('media.birdweather', 'app.birdweather')} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    {(detection.soundscape.duration || detection.soundscape.startTime !== undefined || 
                      detection.soundscape.filesize || detection.soundscape.mode) && (
                      <div className="audio-metadata">
                        {detection.soundscape.duration !== undefined && (
                          <span className="audio-info" title="Duration">
                            ⏱️ {formatDuration(detection.soundscape.duration)}
                          </span>
                        )}
                        {detection.soundscape.startTime !== undefined && detection.soundscape.endTime !== undefined && (
                          <span className="audio-info" title="Detection window">
                            📍 {detection.soundscape.startTime.toFixed(1)}s - {detection.soundscape.endTime.toFixed(1)}s
                          </span>
                        )}
                        {detection.soundscape.filesize !== undefined && (
                          <span className="audio-info" title="File size">
                            💾 {formatFileSize(detection.soundscape.filesize)}
                          </span>
                        )}
                        {detection.soundscape.mode && (
                          <span className="audio-info audio-mode" title="Recording mode">
                            {detection.soundscape.mode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="audio-spacer"></div>
                )}

                <div className="detection-meta">
                  <span className="timestamp">{formatTime(detection.timestamp)}</span>
                  <span 
                    className="confidence"
                    style={{
                      backgroundColor: `${detection.species.color}20`,
                      color: detection.species.color || '#ffffff'
                    }}
                  >
                    {formatConfidence(detection.confidence)}
                  </span>
                </div>
              </div>

              {filters.stationIds.length > 1 && (
                <div className="detection-details">
                  <div className="station-info">
                    <span className="station-icon">📍</span>
                    <span className="station-name">{detection.station.name}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredAndSortedDetections.length > 0 && layoutMode === 'grouped' && (
        <div className="detections-list grouped">
          {(() => {
            // Group detections by species
            const grouped = filteredAndSortedDetections.reduce((acc, detection) => {
              const speciesId = detection.species.id;
              if (!acc[speciesId]) {
                acc[speciesId] = {
                  species: detection.species,
                  detections: []
                };
              }
              acc[speciesId].detections.push(detection);
              return acc;
            }, {} as Record<string, { species: typeof filteredAndSortedDetections[0]['species']; detections: Detection[] }>);

            // Sort groups by species name
            const sortedGroups = Object.values(grouped).sort((a, b) => 
              a.species.commonName.localeCompare(b.species.commonName)
            );

            return sortedGroups.map(({ species, detections: groupDetections }) => (
              <div key={species.id} className="species-group">
                <div className="species-group-header">
                  {species.thumbnailUrl && (
                    <img
                      src={species.thumbnailUrl}
                      alt={species.commonName}
                      className="species-thumbnail-large"
                    />
                  )}
                  <div className="species-group-info">
                    <h2 className="species-group-title">{species.commonName}</h2>
                    <span className="detection-count-badge">
                      {groupDetections.length} {groupDetections.length === 1 ? 'detection' : 'detections'}
                    </span>
                  </div>
                </div>
                
                <div className="species-detections">
                  {groupDetections.map((detection) => (
                    <div key={detection.id} className="detection-card compact">
                      <div className="detection-header">
                        {filters.stationIds.length > 1 && (
                          <div className="station-info">
                            <span className="station-icon">📍</span>
                            <span className="station-name">{detection.station.name}</span>
                          </div>
                        )}

                        {detection.soundscape?.url ? (
                          <div className="audio-wrapper">
                            <audio controls preload='metadata' className="audio-player">
                              <source src={detection.soundscape.url.replace('/soundscapes/', '/soundscapes/normalize/').replace('media.birdweather', 'app.birdweather')} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                            {(detection.soundscape.duration || detection.soundscape.startTime !== undefined || 
                              detection.soundscape.filesize || detection.soundscape.mode) && (
                              <div className="audio-metadata">
                                {detection.soundscape.duration !== undefined && (
                                  <span className="audio-info" title="Duration">
                                    ⏱️ {formatDuration(detection.soundscape.duration)}
                                  </span>
                                )}
                                {detection.soundscape.startTime !== undefined && detection.soundscape.endTime !== undefined && (
                                  <span className="audio-info" title="Detection window">
                                    📍 {detection.soundscape.startTime.toFixed(1)}s - {detection.soundscape.endTime.toFixed(1)}s
                                  </span>
                                )}
                                {detection.soundscape.filesize !== undefined && (
                                  <span className="audio-info" title="File size">
                                    💾 {formatFileSize(detection.soundscape.filesize)}
                                  </span>
                                )}
                                {detection.soundscape.mode && (
                                  <span className="audio-info audio-mode" title="Recording mode">
                                    {detection.soundscape.mode}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="audio-spacer"></div>
                        )}

                        <div className="detection-meta">
                          <span className="timestamp">{formatTime(detection.timestamp)}</span>
                          <span 
                            className="confidence"
                            style={{
                              backgroundColor: `${detection.species.color}20`,
                              color: detection.species.color || '#ffffff'
                            }}
                          >
                            {formatConfidence(detection.confidence)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {!loading && !error && detections.length > 0 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            <span>
              Showing {filteredAndSortedDetections.length} of {totalCount} detections
            </span>
            {totalCount > pageSize && (
              <span className="pagination-pages">
                (Page {currentPage} of {Math.ceil(totalCount / pageSize)})
              </span>
            )}
          </div>
          {totalCount > pageSize && (
            <div className="pagination-buttons">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="pagination-btn"
                title="Previous page"
              >
                <span>←</span>
                Previous
              </button>
              <span className="pagination-current">
                {currentPage} / {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage || currentPage >= Math.ceil(totalCount / pageSize)}
                className="pagination-btn"
                title="Next page"
              >
                Next
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}


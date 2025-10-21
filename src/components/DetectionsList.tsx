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
        stationIds: string[];
      }

      const variables: QueryVariables = {
        period: {
          from: formatDateForAPI(start),
          to: formatDateForAPI(end),
        },
        first: 100,
        stationIds: filters.stationIds,
      };

      const data = await graphqlClient.request<DetectionsResponse>(
        DETECTIONS_QUERY,
        variables
      );

      setDetections(data.detections.nodes);
      setTotalCount(data.detections.totalCount);
    } catch (err) {
      console.error('Error fetching detections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch detections');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, filters, detections.length]);

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

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
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
      const totalFiles = allDetections.filter(d => d.soundscape?.url).length;
      setDownloadProgress({ current: 0, total: totalFiles });

      let downloadedCount = 0;

      // Download and add files to zip, organized by species
      for (const [speciesName, speciesDetections] of Object.entries(detectionsBySpecies)) {
        // Create a safe folder name
        const folderName = speciesName.replace(/[^a-z0-9]/gi, '_');
        const speciesFolder = zip.folder(folderName);

        if (speciesFolder) {
          for (const detection of speciesDetections) {
            if (detection.soundscape?.url) {
              try {
                // Fetch the audio file
                const response = await fetch(detection.soundscape.url);
                const blob = await response.blob();
                
                // Create filename with timestamp
                const timestamp = format(new Date(detection.timestamp), 'yyyy-MM-dd_HH-mm-ss');
                const confidence = (detection.confidence * 100).toFixed(0);
                const fileName = `${timestamp}_${confidence}pct.mp3`;
                
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
            <h1>Bird Detections</h1>
            {totalCount > 0 && (
              <span className="detection-count">
                {filteredAndSortedDetections.length} of {totalCount} {totalCount === 1 ? 'detection' : 'detections'}
              </span>
            )}
            {isRefreshing && (
              <span className="refreshing-indicator">
                <div className="mini-spinner"></div>
                Refreshing...
              </span>
            )}
          </div>
          <div className="header-right">
            {filteredAndSortedDetections.length > 0 && (
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
            )}
            {detections.length > 0 && detections.some(d => d.soundscape?.url) && (
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

              <div className="detection-details">
                <div className="station-info">
                  <span className="station-icon">📍</span>
                  <span className="station-name">{detection.station.name}</span>
                </div>

                {detection.soundscape?.url && (
                  <audio controls preload='metadata' className="audio-player">
                    <source src={detection.soundscape.url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
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
                    <p className="species-group-subtitle">{species.scientificName}</p>
                    <span className="detection-count-badge">
                      {groupDetections.length} {groupDetections.length === 1 ? 'detection' : 'detections'}
                    </span>
                  </div>
                </div>
                
                <div className="species-detections">
                  {groupDetections.map((detection) => (
                    <div key={detection.id} className="detection-card compact">
                      <div className="detection-header">
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

                      <div className="detection-details">
                        <div className="station-info">
                          <span className="station-icon">📍</span>
                          <span className="station-name">{detection.station.name}</span>
                        </div>

                        {detection.soundscape?.url && (
                          <audio controls preload='metadata' className="audio-player">
                            <source src={detection.soundscape.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
      </div>
    </>
  );
}


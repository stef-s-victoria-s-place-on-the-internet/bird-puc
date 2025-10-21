import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { graphqlClient, DETECTIONS_QUERY } from '../api/graphql';
import { DetectionsResponse, Detection, FilterState } from '../types';
import { DatePicker } from './DatePicker';
import { Sidebar } from './Sidebar';
import { loadFilters } from '../utils/localStorage';
import { loadSettings, TimeFormat } from '../utils/settings';
import './DetectionsList.css';

export function DetectionsList() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize with saved filters from localStorage
    const savedFilters = loadFilters();
    return savedFilters || { stationIds: [], stationNames: [] };
  });
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    return loadSettings().timeFormat;
  });

  const fetchDetections = useCallback(async () => {
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
        stationIds?: string[];
      }

      const variables: QueryVariables = {
        period: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        first: 100,
      };

      // Only add stationIds if filters are applied
      if (filters.stationIds.length > 0) {
        variables.stationIds = filters.stationIds;
      }

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

  useEffect(() => {
    fetchDetections();
  }, [fetchDetections]);

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

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  return (
    <>
      <Sidebar 
        onFiltersChange={handleFiltersChange}
        onTimeFormatChange={handleTimeFormatChange}
      />
      
      <div className="detections-container">
        <header className="detections-header">
          <div className="header-left">
            <h1>Bird Detections</h1>
            {totalCount > 0 && (
              <span className="detection-count">
                {totalCount} {totalCount === 1 ? 'detection' : 'detections'}
              </span>
            )}
            {isRefreshing && (
              <span className="refreshing-indicator">
                <div className="mini-spinner"></div>
                Refreshing...
              </span>
            )}
          </div>
          <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
          <p>🔍 No detections found for {format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
      )}

      {!loading && !error && detections.length > 0 && (
        <div className="detections-list">
          {detections.map((detection) => (
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
      </div>
    </>
  );
}


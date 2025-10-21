import { format } from 'date-fns';

interface LoadingStatesProps {
  loading: boolean;
  error: string | null;
  hasDetections: boolean;
  hasFilters: boolean;
  hasStationSelected: boolean;
  selectedDate: Date;
  onRetry: () => void;
}

export function LoadingStates({
  loading,
  error,
  hasDetections,
  hasFilters,
  hasStationSelected,
  selectedDate,
  onRetry
}: LoadingStatesProps) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading detections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>⚠️ {error}</p>
        <button onClick={onRetry} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!hasDetections) {
    return (
      <div className="empty-state">
        {!hasStationSelected ? (
          <p>📍 Please select a station from the sidebar to view detections</p>
        ) : (
          <p>🔍 No detections found for {format(selectedDate, 'MMMM d, yyyy')}</p>
        )}
      </div>
    );
  }

  if (hasFilters && !hasDetections) {
    return (
      <div className="empty-state">
        <p>🔍 No detections match your current filters</p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem', opacity: 0.8 }}>
          Try adjusting your species, confidence, or time of day filters
        </p>
      </div>
    );
  }

  return null;
}


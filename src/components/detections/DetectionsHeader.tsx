interface DetectionsHeaderProps {
  totalCount: number;
  filteredCount: number;
  isRefreshing: boolean;
  hasDetections: boolean;
  canDownload: boolean;
  isDownloading: boolean;
  layoutMode: 'timeline' | 'grouped';
  downloadProgress: { current: number; total: number };
  onLayoutModeChange: (mode: 'timeline' | 'grouped') => void;
  onDownloadAll: () => void;
  onCancelDownload: () => void;
}

export function DetectionsHeader({
  totalCount,
  filteredCount,
  isRefreshing,
  hasDetections,
  canDownload,
  isDownloading,
  layoutMode,
  downloadProgress,
  onLayoutModeChange,
  onDownloadAll,
  onCancelDownload
}: DetectionsHeaderProps) {
  return (
    <header className="detections-header">
      <div className="header-left">
        <div className="header-title-section">
          <h1>Bird Detections</h1>
          {totalCount > 0 && (
            <span className="detection-count">
              {filteredCount} of {totalCount} {totalCount === 1 ? 'detection' : 'detections'}
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
        {hasDetections && (
          <div className="layout-switcher">
            <button
              className={`layout-btn ${layoutMode === 'timeline' ? 'active' : ''}`}
              onClick={() => onLayoutModeChange('timeline')}
              title="Timeline view"
            >
              <span className="layout-icon">📅</span>
              Timeline
            </button>
            <button
              className={`layout-btn ${layoutMode === 'grouped' ? 'active' : ''}`}
              onClick={() => onLayoutModeChange('grouped')}
              title="Group by species"
            >
              <span className="layout-icon">🦜</span>
              By Bird
            </button>
          </div>
        )}
        {canDownload && (
          <>
            <button
              onClick={onDownloadAll}
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
            {isDownloading && (
              <button
                onClick={onCancelDownload}
                className="download-btn cancel-btn"
                title="Cancel download"
              >
                <span>✕</span>
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}


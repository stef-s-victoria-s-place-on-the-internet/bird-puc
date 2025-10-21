import { useNavigate } from 'react-router-dom';
import { Detection } from '../../types';
import { formatTime, formatConfidence } from '../../utils/formatters';
import { TimeFormat } from '../../utils/settings';
import { AudioPlayer } from './AudioPlayer';

interface DetectionCardProps {
  detection: Detection;
  timeFormat: TimeFormat;
  audioUrl: string | null;
  showStation?: boolean;
  compact?: boolean;
}

export function DetectionCard({ 
  detection, 
  timeFormat, 
  audioUrl,
  showStation = false,
  compact = false
}: DetectionCardProps) {
  const navigate = useNavigate();

  const handleSpeciesClick = () => {
    navigate(`/species/${detection.species.id}`);
  };

  return (
    <div className={`detection-card ${compact ? 'compact' : ''}`}>
      <div className="detection-header">
        {!compact && (
          <div 
            className="species-info clickable" 
            onClick={handleSpeciesClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSpeciesClick();
              }
            }}
          >
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
        )}

        {compact && showStation && (
          <div className="station-info">
            <span className="station-icon">📍</span>
            <span className="station-name">{detection.station.name}</span>
          </div>
        )}

        <AudioPlayer soundscape={detection.soundscape} audioUrl={audioUrl} />

        <div className="detection-meta">
          <span className="timestamp">{formatTime(detection.timestamp, timeFormat)}</span>
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

      {!compact && showStation && (
        <div className="detection-details">
          <div className="station-info">
            <span className="station-icon">📍</span>
            <span className="station-name">{detection.station.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}


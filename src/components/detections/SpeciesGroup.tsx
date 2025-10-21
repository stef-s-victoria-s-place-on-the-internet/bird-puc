import { Detection } from '../../types';
import { TimeFormat } from '../../utils/settings';
import { DetectionCard } from './DetectionCard';

interface SpeciesGroupProps {
  species: Detection['species'];
  detections: Detection[];
  timeFormat: TimeFormat;
  showStations: boolean;
  getAudioUrl: (detection: Detection) => string | null;
}

export function SpeciesGroup({ 
  species, 
  detections, 
  timeFormat, 
  showStations,
  getAudioUrl 
}: SpeciesGroupProps) {
  return (
    <div className="species-group">
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
            {detections.length} {detections.length === 1 ? 'detection' : 'detections'}
          </span>
        </div>
      </div>
      
      <div className="species-detections">
        {detections.map((detection) => (
          <DetectionCard
            key={detection.id}
            detection={detection}
            timeFormat={timeFormat}
            audioUrl={getAudioUrl(detection)}
            showStation={showStations}
            compact={true}
          />
        ))}
      </div>
    </div>
  );
}


import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fetchSpeciesDetections, queryKeys } from '../api/graphql';
import { Detection, Species } from '../types';
import { getAudioUrl } from '../utils/audioUrl';
import { loadSettings } from '../utils/settings';
import { loadFilters } from '../utils/localStorage';
import { DetectionCard } from '../components/detections/DetectionCard';
import './SpeciesDetail.css';

interface GroupedDetections {
  date: string;
  detections: Detection[];
  count: number;
}

export function SpeciesDetail() {
  const { speciesId } = useParams<{ speciesId: string }>();
  const navigate = useNavigate();
  const [timeFormat] = useState(() => loadSettings().timeFormat);
  const [normalizeAudioUrls] = useState(() => loadSettings().normalizeAudioUrls);
  const [stationIds] = useState(() => {
    const filters = loadFilters();
    return filters?.stationIds || [];
  });

  // Fetch species detections with React Query
  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.speciesDetections(speciesId || '', stationIds),
    queryFn: () => fetchSpeciesDetections({
      speciesId: speciesId!,
      first: 1000,
      stationIds: stationIds.length > 0 ? stationIds : undefined,
    }),
    enabled: !!speciesId, // Only fetch if speciesId exists
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const detections = data?.nodes || [];
  const totalCount = data?.totalCount || 0;
  const species: Species | null = detections.length > 0 ? detections[0].species : null;
  const error = queryError instanceof Error ? queryError.message : null;

  const groupedDetections: GroupedDetections[] = detections.reduce((groups, detection) => {
    const date = format(parseISO(detection.timestamp), 'yyyy-MM-dd');
    const existingGroup = groups.find(g => g.date === date);

    if (existingGroup) {
      existingGroup.detections.push(detection);
      existingGroup.count++;
    } else {
      groups.push({
        date,
        detections: [detection],
        count: 1,
      });
    }

    return groups;
  }, [] as GroupedDetections[]);

  // Sort by date descending
  groupedDetections.sort((a, b) => b.date.localeCompare(a.date));

  if (loading) {
    return (
      <div className="species-detail">
        <div className="species-detail-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div className="loading-message">Loading species information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="species-detail">
        <div className="species-detail-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!species) {
    return (
      <div className="species-detail">
        <div className="species-detail-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div className="empty-message">Species not found</div>
      </div>
    );
  }

  return (
    <div className="species-detail">
      <div className="species-detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="species-header-content">
          {species.imageUrl && (
            <img
              src={species.imageUrl}
              alt={species.commonName}
              className="species-detail-image"
            />
          )}
          <div className="species-detail-info">
            <h1 className="species-detail-title">{species.commonName}</h1>
            <p className="species-detail-scientific">{species.scientificName}</p>
            
            {species.wikipediaSummary && (
              <div className="species-wikipedia-summary">
                <p>{species.wikipediaSummary}</p>
              </div>
            )}
            
            <p className="species-detail-count">
              Total Detections: <strong>{totalCount}</strong>
              {stationIds.length > 0 && (
                <span className="filtered-indicator"> (Filtered by {stationIds.length} station{stationIds.length > 1 ? 's' : ''})</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="species-detections-container">
        {groupedDetections.map((group) => (
          <div key={group.date} className="date-group">
            <div className="date-group-header">
              <h2 className="date-group-title">
                {format(parseISO(group.date), 'EEEE, MMMM d, yyyy')}
              </h2>
              <span className="date-group-count">{group.count} detections</span>
            </div>
            <div className="date-group-detections">
              {group.detections.map((detection) => (
                <DetectionCard
                  key={detection.id}
                  detection={detection}
                  timeFormat={timeFormat}
                  audioUrl={getAudioUrl(detection.soundscape?.url || '', normalizeAudioUrls)}
                  showStation={true}
                  compact={false}
                />
              ))}
            </div>
          </div>
        ))}

        {groupedDetections.length === 0 && (
          <div className="empty-message">No detections found for this species</div>
        )}
      </div>
    </div>
  );
}


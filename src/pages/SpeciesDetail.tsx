import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { graphqlClient } from '../api/graphql';
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

const SPECIES_DETECTIONS_QUERY = `
  query GetSpeciesDetections($speciesId: ID!, $first: Int, $stationIds: [ID!]) {
    detections(speciesId: $speciesId, first: $first, stationIds: $stationIds) {
      nodes {
        id
        timestamp
        confidence
        probability
        species {
          id
          commonName
          scientificName
          color
          imageUrl
          thumbnailUrl
        }
        station {
          id
          name
        }
        soundscape {
          id
          url
          downloadFilename
          duration
          startTime
          endTime
          filesize
          timestamp
        }
      }
      totalCount
    }
  }
`;

export function SpeciesDetail() {
  const { speciesId } = useParams<{ speciesId: string }>();
  const navigate = useNavigate();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [species, setSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [timeFormat] = useState(() => loadSettings().timeFormat);
  const [normalizeAudioUrls] = useState(() => loadSettings().normalizeAudioUrls);
  const [stationIds] = useState(() => {
    const filters = loadFilters();
    return filters?.stationIds || [];
  });

  useEffect(() => {
    const fetchSpeciesDetections = async () => {
      if (!speciesId) return;

      setLoading(true);
      setError(null);

      try {
        const variables: {
          speciesId: string;
          first: number;
          stationIds?: string[];
        } = {
          speciesId,
          first: 1000,
        };

        // Only include stationIds if there are any
        if (stationIds.length > 0) {
          variables.stationIds = stationIds;
        }

        const response = await graphqlClient.request<{
          detections: {
            nodes: Detection[];
            totalCount: number;
          };
        }>(SPECIES_DETECTIONS_QUERY, variables);

        const fetchedDetections = response.detections.nodes;
        setDetections(fetchedDetections);
        setTotalCount(response.detections.totalCount);
        
        if (fetchedDetections.length > 0) {
          setSpecies(fetchedDetections[0].species);
        }
      } catch (err) {
        console.error('Error fetching species detections:', err);
        setError('Failed to load species detections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpeciesDetections();
  }, [speciesId, stationIds]);

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


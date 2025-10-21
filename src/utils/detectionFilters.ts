import { Detection, FilterState } from '../types';

/**
 * Apply client-side filters to detections
 */
export const filterDetections = (
  detections: Detection[],
  filters: FilterState
): Detection[] => {
  return detections.filter(detection => {
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
  });
};

/**
 * Sort detections based on filter criteria
 */
export const sortDetections = (
  detections: Detection[],
  sortBy: FilterState['sortBy']
): Detection[] => {
  return [...detections].sort((a, b) => {
    switch (sortBy) {
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
};

/**
 * Group detections by species
 */
export const groupDetectionsBySpecies = (
  detections: Detection[]
): Array<{ species: Detection['species']; detections: Detection[] }> => {
  const grouped = detections.reduce((acc, detection) => {
    const speciesId = detection.species.id;
    if (!acc[speciesId]) {
      acc[speciesId] = {
        species: detection.species,
        detections: []
      };
    }
    acc[speciesId].detections.push(detection);
    return acc;
  }, {} as Record<string, { species: Detection['species']; detections: Detection[] }>);

  // Sort groups by species name
  return Object.values(grouped).sort((a, b) => 
    a.species.commonName.localeCompare(b.species.commonName)
  );
};


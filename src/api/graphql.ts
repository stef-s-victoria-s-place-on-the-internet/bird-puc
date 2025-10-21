import { GraphQLClient } from 'graphql-request';
import { DetectionsResponse, Detection } from '../types';

const API_URL = 'https://app.birdweather.com/graphql';
const API_KEY = import.meta.env.VITE_BIRDWEATHER_API_KEY;

export const graphqlClient = new GraphQLClient(API_URL, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
  },
});

export const DETECTIONS_QUERY = `
  query GetDetections($period: InputDuration, $first: Int, $after: String, $stationIds: [ID!]) {
    detections(period: $period, first: $first, after: $after, stationIds: $stationIds) {
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
          wikipediaSummary
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
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const STATIONS_QUERY = `
  query GetStations($first: Int, $query: String) {
    stations(first: $first, query: $query) {
      nodes {
        id
        name
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const SPECIES_DETECTIONS_QUERY = `
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
          wikipediaSummary
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

// ============================================================================
// Query Functions for React Query
// ============================================================================

export interface DetectionsQueryParams {
  period: {
    from: string;
    to: string;
  };
  first: number;
  after?: string;
  stationIds: string[];
}

export interface SpeciesDetectionsQueryParams {
  speciesId: string;
  first: number;
  stationIds?: string[];
}

/**
 * Fetch detections with pagination and filters
 * Used with React Query
 */
export async function fetchDetections(params: DetectionsQueryParams): Promise<DetectionsResponse['detections']> {
  interface QueryVariables {
    period: {
      from: string;
      to: string;
    };
    first: number;
    after?: string;
    stationIds: string[];
  }

  const variables: QueryVariables = {
    period: params.period,
    first: params.first,
    stationIds: params.stationIds,
  };

  // Only include 'after' if provided
  if (params.after) {
    variables.after = params.after;
  }

  const data = await graphqlClient.request<DetectionsResponse>(
    DETECTIONS_QUERY,
    variables
  );

  return data.detections;
}

/**
 * Fetch detections for a specific species
 * Used with React Query
 */
export async function fetchSpeciesDetections(params: SpeciesDetectionsQueryParams): Promise<{
  nodes: Detection[];
  totalCount: number;
}> {
  interface QueryVariables {
    speciesId: string;
    first: number;
    stationIds?: string[];
  }

  const variables: QueryVariables = {
    speciesId: params.speciesId,
    first: params.first,
  };

  // Only include stationIds if provided
  if (params.stationIds && params.stationIds.length > 0) {
    variables.stationIds = params.stationIds;
  }

  const response = await graphqlClient.request<{
    detections: {
      nodes: Detection[];
      totalCount: number;
    };
  }>(SPECIES_DETECTIONS_QUERY, variables);

  return response.detections;
}

/**
 * Create cache keys for React Query
 */
export const queryKeys = {
  detections: (params: DetectionsQueryParams) => ['detections', params] as const,
  speciesDetections: (speciesId: string, stationIds?: string[]) => 
    ['species-detections', speciesId, stationIds] as const,
  monthlyCounts: (params: Pick<DetectionsQueryParams, 'period' | 'stationIds'>) => 
    ['monthly-counts', params] as const,
} as const;


import { GraphQLClient } from 'graphql-request';

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


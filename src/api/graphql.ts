import { GraphQLClient } from 'graphql-request';

const API_URL = 'https://app.birdweather.com/graphql';
const API_KEY = import.meta.env.VITE_BIRDWEATHER_API_KEY;

export const graphqlClient = new GraphQLClient(API_URL, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
  },
});

export const DETECTIONS_QUERY = `
  query GetDetections($period: InputDuration, $first: Int) {
    detections(period: $period, first: $first) {
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
          url
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


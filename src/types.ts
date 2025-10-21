export interface Detection {
  id: string;
  timestamp: string;
  confidence: number;
  species: Species;
  station: Station;
  probability?: number;
  soundscape?: Soundscape;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  color: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface Station {
  id: string;
  name: string;
}

export interface Soundscape {
  url: string;
}

export interface DetectionEdge {
  cursor: string;
  node: Detection;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface DetectionConnection {
  edges: DetectionEdge[];
  nodes: Detection[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface DetectionsResponse {
  detections: DetectionConnection;
}

export interface StationEdge {
  cursor: string;
  node: Station;
}

export interface StationConnection {
  edges: StationEdge[];
  nodes: Station[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface StationsResponse {
  stations: StationConnection;
}

export interface FilterState {
  stationIds: string[];
  stationNames: string[];
}

export interface SearchHistoryItem {
  type: 'station';
  id: string;
  name: string;
  timestamp: number;
}

export interface DayCount {
  date: string; // YYYY-MM-DD format
  count: number;
}

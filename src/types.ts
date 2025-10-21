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


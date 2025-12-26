
export interface LatLng {
  lat: number;
  lng: number;
}

export interface RugObject {
  id: string;
  title: string;
  imageUrl: string;
  museum: string;
  sourceUrl: string;
  rawLocation: string;
  locationName: string; // The specific city/region identified by Gemini
  coordinates: LatLng;
  culture?: string;
  date?: string;
  description?: string;
}

export interface GameState {
  currentRound: number;
  maxRounds: number;
  score: number;
  isRoundActive: boolean;
  selectedPos: LatLng | null;
  currentRug: RugObject | null;
  lastRoundResults: {
    distance: number;
    points: number;
  } | null;
  status: 'loading' | 'playing' | 'result' | 'finished';
}

export type MuseumSource = 'The Met' | 'Art Institute of Chicago' | 'Cleveland Museum of Art' | 'Europeana';

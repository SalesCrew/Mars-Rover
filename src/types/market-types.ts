// Market Selection & Tour Planning Types

export interface Market {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  chain: 'Billa' | 'Spar' | 'Hofer' | 'Merkur' | 'Billa Plus' | 'Spar Gourmet';
  frequency: number; // visits per year
  currentVisits: number;
  lastVisitDate?: string; // ISO date
  isCompleted?: boolean; // completed today
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TourRoute {
  markets: Market[];
  totalDrivingTime: number; // minutes
  totalWorkTime: number; // 45 min per market
  totalTime: number; // driving + work
  optimizedOrder: string[]; // market IDs in optimal order
}


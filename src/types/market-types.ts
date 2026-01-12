// Market Selection & Tour Planning Types

export interface Market {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  chain: 'Adeg' | 'Billa+' | 'BILLA+' | 'BILLA Plus' | 'BILLA+ Privat' | 'BILLA Plus Privat' | 
         'BILLA Privat' | 'Eurospar' | 'Futterhaus' | 'Hagebau' | 'Interspar' | 'Spar' | 
         'Spar Gourmet' | 'Zoofachhandel' | 'Hofer' | 'Merkur' | string;
  frequency: number; // visits per year
  currentVisits: number;
  lastVisitDate?: string; // ISO date
  isCompleted?: boolean; // completed today
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Additional fields from Excel import
  channel?: string;
  banner?: string;
  branch?: string; // Filiale (Row O)
  maingroup?: string; // Row R
  subgroup?: string; // Row S
  gebietsleiter?: string; // UUID of assigned GL
  gebietsleiterName?: string; // Row L - Gebietsleiter name
  isActive?: boolean; // Row N - status
}

export interface TourRoute {
  markets: Market[];
  totalDrivingTime: number; // minutes
  totalWorkTime: number; // 45 min per market
  totalTime: number; // driving + work
  optimizedOrder: string[]; // market IDs in optimal order
}

export interface AdminMarket extends Market {
  internalId: string; // e.g., "MKT-001" (auto-generated) - Row A
  isActive: boolean; // Row O: Status from Excel (Aktiv/Inaktiv)
  gebietsleiter?: string; // UUID of the assigned GL (gebietsleiter_id in DB)
  gebietsleiterName?: string; // Row M: Gebietsleiter name (visible in UI)
  gebietsleiterEmail?: string; // Row N: GL email (for GL ID matching)
  channel?: string; // Row D: Distribution channel (no UI)
  banner?: string; // Row E: Banner/Brand group
  marketTel?: string; // Row U: Market telephone number (NEW)
  marketEmail?: string; // Row V: Market contact email (NEW)
  // Legacy fields - kept for backwards compatibility but no longer imported
  branch?: string; // Filiale - no longer in Excel
  visitDay?: string; // Besuchstag (not from Excel)
  visitDuration?: string; // Besuchsdauer (not from Excel)
  customerType?: string; // Kundentyp (not from Excel)
  phone?: string; // Legacy - use marketTel instead
  email?: string; // Legacy - use marketEmail instead
  maingroup?: string; // No longer imported
  subgroup?: string; // No longer imported
}


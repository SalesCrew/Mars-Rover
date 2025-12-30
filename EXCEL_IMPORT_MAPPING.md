# Excel Import Column Mapping for Markets

This document describes the mapping between Excel columns and database fields for market data import.

## Excel Column Structure

| Excel Row | Field Name | Database Column | Description | Notes |
|-----------|------------|-----------------|-------------|-------|
| **A** | ID | `id` | Unique market identifier | Primary key |
| **B** | - | - | IGNORED | Not imported |
| **C** | - | - | IGNORED | Not imported |
| **D** | Channel | `channel` | Distribution channel | E.g., "Modern Trade" |
| **E** | Banner | `banner` | Banner/Brand group | E.g., "REWE-Billa Plus Fil.", "SPAR-Eurospar Fil." |
| **F** | Handelskette | `chain` | Retail chain name | E.g., "BILLA Plus", "Eurospar", "Spar" - **Displayed in UI pills** |
| **G** | - | - | IGNORED | Not imported |
| **H** | Name | `name` | Market name | E.g., "Eurospar", "BILLA Plus Fil. 1020" |
| **I** | PLZ | `postal_code` | Postal code | E.g., "1020" |
| **J** | Stadt | `city` | City name | E.g., "WIEN" |
| **K** | Straße | `address` | Street address | E.g., "Olympiaplatz 2" |
| **L** | Gebietsleiter Name | `gebietsleiter_name` | Territory manager name | E.g., "Mikel Hofbauer" - Visible in UI |
| **M** | Email | `email` | Market contact email | E.g., "m.hofbauer@merch.at" |
| **N** | Status | `is_active` | Active status | "Aktiv"/"Inaktiv" → Boolean |
| **O** | Filiale | `branch` | Branch identifier | E.g., "Filiale" |
| **P** | Frequenz | `frequency` | Visit frequency per year | Integer (e.g., 12, 8) |
| **Q** | Besuchsdauer | `visit_duration` | Visit duration | E.g., "30" (minutes) |
| **R** | Maingroup | `maingroup` | Main organizational group | E.g., "Rewe", "Spar" |
| **S** | Subgroup | `subgroup` | Sub-organizational group | E.g., "3R - BILLA Plus", "AF - Spar St.Pölten" |

## Important Notes

### New Fields (Row L)
- **Gebietsleiter Name**: This is now a proper field that shows the name of the assigned territory manager
- Replaces the old temporary data that was previously used
- This field is **visible in the UI** and used for filtering and assignment

### Additional Database Fields
The following fields are also available in the database but not part of the Excel import:
- `internal_id` - Auto-generated internal market code (e.g., "MKT-001")
- `phone` - **REMOVED FROM UI** - No longer displayed
- `visit_day` - Scheduled visit day
- `customer_type` - Customer classification
- `latitude` / `longitude` - GPS coordinates
- `is_completed` - Today's visit completion status
- `current_visits` - Number of visits this year
- `last_visit_date` - Date of last visit
- `gebietsleiter_email` - Email of assigned GL (for notification purposes)
- `ma_email` - Internal MA email (not from Excel)
- `created_at` / `updated_at` - Timestamps

## Type Definitions

### TypeScript Interface
```typescript
interface AdminMarket {
  // Excel Row A
  id: string;
  
  // Excel Row D
  channel?: string;
  
  // Excel Row E
  banner?: string;
  
  // Excel Row F
  chain: string;
  
  // Excel Row H
  name: string;
  
  // Excel Row I
  postalCode: string;
  
  // Excel Row J
  city: string;
  
  // Excel Row K
  address: string;
  
  // Excel Row L
  gebietsleiterName?: string;
  
  // Excel Row M
  email?: string;
  
  // Excel Row N
  isActive: boolean;
  
  // Excel Row O
  branch?: string;
  
  // Excel Row P
  frequency: number;
  
  // Excel Row Q
  visitDuration?: string;
  
  // Excel Row R
  maingroup?: string;
  
  // Excel Row S
  subgroup?: string;
  
  // Auto-generated
  internalId: string;
  
  // Additional fields (not from Excel)
  gebietsleiterEmail?: string;
  currentVisits: number;
  lastVisitDate?: string;
  isCompleted?: boolean;
  coordinates?: { lat: number; lng: number };
  phone?: string; // Not displayed in UI
  visitDay?: string;
  customerType?: string;
  maEmail?: string; // Internal use only
}
```

## Database Schema Updates

The following columns were added/modified in the `markets` table:

```sql
-- Key columns from Excel
channel VARCHAR(100),                -- Row D
banner VARCHAR(100),                 -- Row E
chain VARCHAR(100),                  -- Row F (displayed in UI)
name VARCHAR(255),                   -- Row H
postal_code VARCHAR(20),             -- Row I
city VARCHAR(100),                   -- Row J
address VARCHAR(255),                -- Row K
gebietsleiter_name VARCHAR(100),     -- Row L
email VARCHAR(255),                  -- Row M
is_active BOOLEAN,                   -- Row N (Status)
branch VARCHAR(100),                 -- Row O (Filiale)
frequency INTEGER,                   -- Row P
visit_duration VARCHAR(50),          -- Row Q (Besuchsdauer)
maingroup VARCHAR(100),              -- Row R
subgroup VARCHAR(100),               -- Row S

-- Additional fields
gebietsleiter_email VARCHAR(255),    -- For GL notifications
phone VARCHAR(50),                   -- Not displayed in UI

-- Indexes
CREATE INDEX idx_markets_gebietsleiter_name ON markets(gebietsleiter_name);
CREATE INDEX idx_markets_maingroup ON markets(maingroup);
CREATE INDEX idx_markets_chain ON markets(chain);
```

## Import Process

1. Read Excel file with the column structure above
2. Parse each row according to the column mapping
3. Transform data to match database schema
4. Validate required fields (A, F, H, I, J, K)
5. Save to database with:
   - `gebietsleiter_name` from Row L (visible)
   - `ma_email` from Row M (hidden)
   - Auto-generate `internal_id` if not provided
6. Display success/error messages

## UI Display

### Visible Fields
- Market name (Row H)
- Channel (Row D)
- Banner (Row E)
- Handelskette/Chain (Row F) - **Displayed in colored pills**
- Address (Row K, I, J combined)
- Gebietsleiter name (Row L)
- Email (Row M)
- Status (Row N)
- Filiale (Row O)
- Frequenz (Row P)
- Besuchsdauer (Row Q)
- Maingroup (Row R)
- Subgroup (Row S)

### Hidden/Removed Fields
- `phone` - **Removed from UI** (Telefonnummer no longer displayed)

## Related Files

- `src/types/market-types.ts` - TypeScript interfaces
- `src/data/adminMarketsData.ts` - Mock data structure
- `src/services/marketService.ts` - Database transformations
- `database_schema_markets.sql` - Database schema


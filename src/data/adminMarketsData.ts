import { allMarkets } from './marketsData';
import type { AdminMarket } from '../types/market-types';

// ============================================
// Excel Column Mapping (A-S):
// ============================================
// Row A: ID
// Row B-C: Ignore
// Row D: Channel
// Row E: Banner
// Row F: Handelskette (Chain) - DISPLAYED IN UI PILLS
// Row G: Ignore
// Row H: Name
// Row I: PLZ (Postal Code)
// Row J: Stadt (City)
// Row K: Straße (Address)
// Row L: Gebietsleiter Name
// Row M: Email (Market contact email)
// Row N: Status (isActive)
// Row O: Filiale (Branch)
// Row P: Frequenz (Frequency)
// Row Q: Besuchsdauer (Visit duration)
// Row R: Maingroup
// Row S: Subgroup
// ============================================

// Subgroup codes for different chains (Row S)
const subgroups = [
  '3F - Adeg', '3R - BILLA Plus', '3A - Billa', '2A - Spar', 'AA - Spar Dornbirn',
  'AB - Spar Wörgl', 'AC - Spar Marchtrenk', 'AD - Spar Maria Saal', 'AE - Spar Graz',
  'AF - Spar St.Pölten', 'AJ - Spar Ebergassing', 'AY - Interspar', 'EC - Griesemann Zams',
  'WA - Hagebau (früher 3e)', 'WB - Nicht Org.', 'Y3 - Futterhaus', 'Z5 - Willi other SPT'
];

// Maingroups (Row R)
const maingroups = [
  'Rewe', 'Spar', 'Transgourmet', 'Fachhandel'
];

// All chain types (Row F: Handelskette) - DISPLAYED IN UI
const chainTypes = [
  'Adeg', 'Billa+', 'BILLA Plus', 'BILLA+ Privat', 'BILLA Privat', 'Eurospar', 
  'Futterhaus', 'Hagebau', 'Interspar', 'Spar', 'SPAR Privat Popovic', 'Spar Gourmet', 
  'Zoofachhandel', 'Hofer', 'Merkur'
];

// Channels (Row D)
const channels = ['Modern Trade', 'Fachhandel', 'Gastronomie'];

// Banners (Row E)
const banners = [
  'REWE-Billa Plus Fil.', 
  'SPAR-Eurospar Fil.', 
  'SPAR-Spar SM Privat',
  'Hofer-Hofer',
  'Transgourmet-Transgourmet'
];

// List of Gebietsleiter (Row L) with their emails (for notifications)
const gebietsleiterList = [
  { name: 'Mikel Hofbauer', email: 'mikel.hofbauer@marsrover.at' },
  { name: 'Max Mustermann', email: 'max.mustermann@marsrover.at' },
  { name: 'Anna Schmidt', email: 'anna.schmidt@marsrover.at' },
  { name: 'Peter Weber', email: 'peter.weber@marsrover.at' },
  { name: 'Laura Fischer', email: 'laura.fischer@marsrover.at' },
  { name: 'Michael Bauer', email: 'michael.bauer@marsrover.at' },
  { name: 'Sarah Hoffmann', email: 'sarah.hoffmann@marsrover.at' },
  { name: 'Thomas Müller', email: 'thomas.muller@marsrover.at' }
];

// Visit durations (Row Q: Besuchsdauer)
const visitDurations = ['30', '45', '60', '90'];

// Triple the markets to create enough data for scrolling
const expandedMarkets = [...allMarkets, ...allMarkets, ...allMarkets];

export const adminMarkets: AdminMarket[] = expandedMarkets.map((market, index) => {
  // Assign fields cyclically to ensure variety
  const assignedChain = chainTypes[index % chainTypes.length]; // Row F: Handelskette
  const assignedGL = gebietsleiterList[index % gebietsleiterList.length];
  const assignedChannel = channels[index % channels.length]; // Row D
  const assignedBanner = banners[index % banners.length]; // Row E
  const assignedMaingroup = maingroups[index % maingroups.length]; // Row R
  const assignedSubgroup = subgroups[index % subgroups.length]; // Row S
  const assignedDuration = visitDurations[index % visitDurations.length]; // Row Q
  
  return {
    ...market,
    id: `${market.id}-${index}`, // Row A: Make each ID unique
    chain: assignedChain, // Row F: Handelskette (displayed in UI pills)
    gebietsleiterName: assignedGL.name, // Row L: Gebietsleiter Name (visible)
    gebietsleiterEmail: assignedGL.email, // For GL assignment notifications (not from Excel)
    email: `market${index + 1}@store.local`, // Row M: Market contact email
    internalId: `MKT-${String(index + 1).padStart(3, '0')}`, // Auto-generated
    isActive: Math.random() > 0.2, // Row N: Status (80% active for demo)
    subgroup: assignedSubgroup, // Row S: Subgroup
    channel: assignedChannel, // Row D: Channel
    banner: assignedBanner, // Row E: Banner
    branch: `Filiale ${String(index + 1).padStart(2, '0')}`, // Row O: Filiale
    maingroup: assignedMaingroup, // Row R: Maingroup
    visitDuration: assignedDuration, // Row Q: Besuchsdauer (e.g., "30" minutes)
    // Note: phone field exists but is NOT displayed in UI anymore
  } as AdminMarket;
});


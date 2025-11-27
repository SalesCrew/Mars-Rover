import type { Market } from '../types/market-types';

export const allMarkets: Market[] = [
  // Vienna markets
  {
    id: 'billa-hauptstrasse',
    name: 'Billa Hauptstraße',
    address: 'Hauptstraße 45',
    city: 'Wien',
    postalCode: '1010',
    chain: 'Billa',
    frequency: 12,
    currentVisits: 8,
    lastVisitDate: '2024-10-15',
    coordinates: { lat: 48.2082, lng: 16.3738 }
  },
  {
    id: 'spar-mariahilf',
    name: 'Spar Mariahilf',
    address: 'Mariahilfer Str. 120',
    city: 'Wien',
    postalCode: '1070',
    chain: 'Spar',
    frequency: 12,
    currentVisits: 6,
    lastVisitDate: '2024-09-20',
    coordinates: { lat: 48.1992, lng: 16.3435 }
  },
  {
    id: 'hofer-favoriten',
    name: 'Hofer Favoriten',
    address: 'Favoritenstraße 88',
    city: 'Wien',
    postalCode: '1100',
    chain: 'Hofer',
    frequency: 12,
    currentVisits: 10,
    lastVisitDate: '2024-11-10',
    coordinates: { lat: 48.1717, lng: 16.3844 }
  },
  {
    id: 'merkur-landstrasse',
    name: 'Merkur Landstraße',
    address: 'Landstraßer Hauptstraße 50',
    city: 'Wien',
    postalCode: '1030',
    chain: 'Merkur',
    frequency: 12,
    currentVisits: 5,
    lastVisitDate: '2024-09-05',
    coordinates: { lat: 48.1992, lng: 16.3947 }
  },
  {
    id: 'billa-plus-floridsdorf',
    name: 'Billa Plus Floridsdorf',
    address: 'Brünner Straße 35',
    city: 'Wien',
    postalCode: '1210',
    chain: 'Billa Plus',
    frequency: 12,
    currentVisits: 7,
    lastVisitDate: '2024-10-20',
    coordinates: { lat: 48.2582, lng: 16.4013 }
  },
  {
    id: 'spar-gourmet-innere-stadt',
    name: 'Spar Gourmet Innere Stadt',
    address: 'Kärntner Straße 19',
    city: 'Wien',
    postalCode: '1010',
    chain: 'Spar Gourmet',
    frequency: 12,
    currentVisits: 9,
    lastVisitDate: '2024-11-08',
    isCompleted: true,
    coordinates: { lat: 48.2045, lng: 16.3716 }
  },
  {
    id: 'hofer-ottakring',
    name: 'Hofer Ottakring',
    address: 'Ottakringer Straße 112',
    city: 'Wien',
    postalCode: '1160',
    chain: 'Hofer',
    frequency: 12,
    currentVisits: 4,
    lastVisitDate: '2024-08-15',
    coordinates: { lat: 48.2147, lng: 16.3186 }
  },
  {
    id: 'billa-hietzing',
    name: 'Billa Hietzing',
    address: 'Hietzinger Hauptstraße 22',
    city: 'Wien',
    postalCode: '1130',
    chain: 'Billa',
    frequency: 12,
    currentVisits: 11,
    lastVisitDate: '2024-11-18',
    isCompleted: true,
    coordinates: { lat: 48.1859, lng: 16.3012 }
  },
  {
    id: 'merkur-donaustadt',
    name: 'Merkur Donaustadt',
    address: 'Donaustadtstraße 1',
    city: 'Wien',
    postalCode: '1220',
    chain: 'Merkur',
    frequency: 12,
    currentVisits: 3,
    lastVisitDate: '2024-07-30',
    coordinates: { lat: 48.2346, lng: 16.4474 }
  },
  {
    id: 'spar-penzing',
    name: 'Spar Penzing',
    address: 'Penzinger Straße 65',
    city: 'Wien',
    postalCode: '1140',
    chain: 'Spar',
    frequency: 12,
    currentVisits: 8,
    lastVisitDate: '2024-10-28',
    coordinates: { lat: 48.1963, lng: 16.3103 }
  },
  {
    id: 'billa-leopoldstadt',
    name: 'Billa Leopoldstadt',
    address: 'Taborstraße 44',
    city: 'Wien',
    postalCode: '1020',
    chain: 'Billa',
    frequency: 12,
    currentVisits: 10,
    lastVisitDate: '2024-11-12',
    coordinates: { lat: 48.2178, lng: 16.3840 }
  },
  {
    id: 'hofer-meidling',
    name: 'Hofer Meidling',
    address: 'Meidlinger Hauptstraße 73',
    city: 'Wien',
    postalCode: '1120',
    chain: 'Hofer',
    frequency: 12,
    currentVisits: 6,
    lastVisitDate: '2024-10-05',
    coordinates: { lat: 48.1753, lng: 16.3314 }
  },
];


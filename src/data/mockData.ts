import type { GLDashboard } from '../types/gl-types';

export const mockDashboardData: GLDashboard = {
  user: {
    firstName: 'Thomas',
    lastName: 'Müller',
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: 'gl',
  },
  bonuses: {
    yearTotal: 24580,
    percentageChange: 12.3,
    sellIns: 47,
    preOrders: 23,
    marketsVisited: {
      current: 142,
      target: 180,
    },
  },
  quickActions: {
    openVisitsToday: 3,
  },
  frequencyAlerts: [
    {
      marketId: 'billa-hauptstrasse',
      name: 'Billa Hauptstraße',
      address: 'Hauptstraße 45, 1010 Wien',
      visits: {
        current: 8,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 3,
    },
    {
      marketId: 'spar-mariahilf',
      name: 'Spar Mariahilf',
      address: 'Mariahilfer Str. 120, 1070 Wien',
      visits: {
        current: 6,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 5,
    },
    {
      marketId: 'hofer-favoriten',
      name: 'Hofer Favoriten',
      address: 'Favoritenstraße 88, 1100 Wien',
      visits: {
        current: 10,
        required: 12,
      },
      status: 'on-track',
      lastVisitWeeks: 2,
    },
    {
      marketId: 'merkur-landstrasse',
      name: 'Merkur Landstraße',
      address: 'Landstraßer Hauptstraße 50, 1030 Wien',
      visits: {
        current: 5,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 6,
    },
    {
      marketId: 'billa-plus-floridsdorf',
      name: 'Billa Plus Floridsdorf',
      address: 'Brünner Straße 35, 1210 Wien',
      visits: {
        current: 7,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 4,
    },
    {
      marketId: 'spar-gourmet-innere-stadt',
      name: 'Spar Gourmet Innere Stadt',
      address: 'Kärntner Straße 19, 1010 Wien',
      visits: {
        current: 9,
        required: 12,
      },
      status: 'on-track',
      lastVisitWeeks: 2,
    },
    {
      marketId: 'hofer-ottakring',
      name: 'Hofer Ottakring',
      address: 'Ottakringer Straße 112, 1160 Wien',
      visits: {
        current: 4,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 7,
    },
    {
      marketId: 'billa-hietzing',
      name: 'Billa Hietzing',
      address: 'Hietzinger Hauptstraße 22, 1130 Wien',
      visits: {
        current: 11,
        required: 12,
      },
      status: 'on-track',
      lastVisitWeeks: 1,
    },
    {
      marketId: 'merkur-donaustadt',
      name: 'Merkur Donaustadt',
      address: 'Donaustadtstraße 1, 1220 Wien',
      visits: {
        current: 3,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 8,
    },
    {
      marketId: 'spar-penzing',
      name: 'Spar Penzing',
      address: 'Penzinger Straße 65, 1140 Wien',
      visits: {
        current: 8,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 3,
    },
    {
      marketId: 'billa-leopoldstadt',
      name: 'Billa Leopoldstadt',
      address: 'Taborstraße 44, 1020 Wien',
      visits: {
        current: 10,
        required: 12,
      },
      status: 'on-track',
      lastVisitWeeks: 2,
    },
    {
      marketId: 'hofer-meidling',
      name: 'Hofer Meidling',
      address: 'Meidlinger Hauptstraße 73, 1120 Wien',
      visits: {
        current: 6,
        required: 12,
      },
      status: 'at-risk',
      lastVisitWeeks: 5,
    },
    {
      marketId: 'merkur-simmering',
      name: 'Merkur Simmering',
      address: 'Simmeringer Hauptstraße 96, 1110 Wien',
      visits: {
        current: 9,
        required: 12,
      },
      status: 'on-track',
      lastVisitWeeks: 2,
    },
  ],
  performanceMetrics: {
    averageVisitDuration: 42,
    sellInSuccessRate: 68,
    weeklyTrend: [
      { week: 'KW 44', sellIns: 10 },
      { week: 'KW 45', sellIns: 13 },
      { week: 'KW 46', sellIns: 8 },
      { week: 'KW 47', sellIns: 16 },
    ],
  },
};


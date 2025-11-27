// GL Dashboard TypeScript Types

export interface User {
  firstName: string;
  lastName: string;
  avatar: string;
  role: 'gl' | 'admin';
}

export interface Bonuses {
  yearTotal: number;
  percentageChange: number;
  sellIns: number;
  preOrders: number;
  marketsVisited: {
    current: number;
    target: number;
  };
}

export interface MarketFrequencyAlert {
  marketId: string;
  name: string;
  address: string;
  visits: {
    current: number;
    required: number;
  };
  status: 'on-track' | 'at-risk';
  lastVisitWeeks: number; // weeks since last visit
}

export interface PerformanceMetrics {
  averageVisitDuration: number; // in minutes
  sellInSuccessRate: number; // percentage
  weeklyTrend: Array<{
    week: string;
    sellIns: number;
  }>;
}

export interface GLDashboard {
  user: User;
  bonuses: Bonuses;
  frequencyAlerts: MarketFrequencyAlert[];
  performanceMetrics?: PerformanceMetrics;
  quickActions: {
    openVisitsToday: number;
  };
}

export type NavigationTab = 'dashboard' | 'markets' | 'sell-ins' | 'profile';



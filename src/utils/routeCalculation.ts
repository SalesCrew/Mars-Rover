import type { Market, TourRoute } from '../types/market-types';

/**
 * Mock route calculation function
 * In production, this would call Google Maps Directions API
 */
export function calculateOptimalRoute(markets: Market[]): TourRoute {
  if (markets.length === 0) {
    return {
      markets: [],
      totalDrivingTime: 0,
      totalWorkTime: 0,
      totalTime: 0,
      optimizedOrder: [],
      legs: [],
    };
  }

  if (markets.length === 1) {
    return {
      markets,
      totalDrivingTime: 0,
      totalWorkTime: 45,
      totalTime: 45,
      optimizedOrder: [markets[0].id],
      legs: [],
    };
  }

  // Mock optimization: Sort by district (extracted from address postal code)
  const sortedMarkets = [...markets].sort((a, b) => {
    const postalA = a.postalCode || '';
    const postalB = b.postalCode || '';
    return postalA.localeCompare(postalB);
  });

  // Calculate mock drive times between consecutive markets
  let totalDriveTime = 0;

  for (let i = 0; i < sortedMarkets.length - 1; i++) {
    // Mock: Random drive time between 5-20 minutes
    const driveTime = Math.floor(Math.random() * 16) + 5;
    totalDriveTime += driveTime;
  }

  const totalWorkTime = markets.length * 45; // 45 minutes per market
  const totalTime = totalDriveTime + totalWorkTime;

  return {
    markets: sortedMarkets,
    totalDrivingTime: totalDriveTime,
    totalWorkTime,
    totalTime,
    optimizedOrder: sortedMarkets.map(m => m.id),
    legs: [],
  };
}

/**
 * Format time in hours and minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} Min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}


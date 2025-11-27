import type { Market, TourRoute, RouteSegment } from '../types/gl-types';

/**
 * Mock route calculation function
 * In production, this would call Google Maps Directions API
 */
export function calculateOptimalRoute(markets: Market[]): TourRoute {
  if (markets.length === 0) {
    return {
      markets: [],
      drivingTime: 0,
      workTime: 0,
      totalTime: 0,
      segments: [],
    };
  }

  if (markets.length === 1) {
    return {
      markets,
      drivingTime: 0,
      workTime: 45,
      totalTime: 45,
      segments: [],
    };
  }

  // Mock optimization: Sort by district (extracted from address postal code)
  const sortedMarkets = [...markets].sort((a, b) => {
    const postalA = a.address.match(/\d{4}/)?.[0] || '';
    const postalB = b.address.match(/\d{4}/)?.[0] || '';
    return postalA.localeCompare(postalB);
  });

  // Calculate mock drive times between consecutive markets
  const segments: RouteSegment[] = [];
  let totalDriveTime = 0;

  for (let i = 0; i < sortedMarkets.length - 1; i++) {
    // Mock: Random drive time between 5-20 minutes
    const driveTime = Math.floor(Math.random() * 16) + 5;
    segments.push({
      from: sortedMarkets[i].id,
      to: sortedMarkets[i + 1].id,
      driveTime,
    });
    totalDriveTime += driveTime;
  }

  const workTime = markets.length * 45; // 45 minutes per market
  const totalTime = totalDriveTime + workTime;

  return {
    markets: sortedMarkets,
    drivingTime: totalDriveTime,
    workTime,
    totalTime,
    segments,
  };
}

/**
 * Recalculate route segments after manual reordering
 */
export function recalculateRouteSegments(markets: Market[]): RouteSegment[] {
  if (markets.length <= 1) return [];

  const segments: RouteSegment[] = [];

  for (let i = 0; i < markets.length - 1; i++) {
    // Mock: Random drive time between 5-20 minutes
    const driveTime = Math.floor(Math.random() * 16) + 5;
    segments.push({
      from: markets[i].id,
      to: markets[i + 1].id,
      driveTime,
    });
  }

  return segments;
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


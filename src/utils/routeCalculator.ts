import type { Market, TourRoute } from '../types/market-types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Calculate driving time based on distance
 * Assumes average city speed of 30 km/h + 5 min buffer per segment
 */
function calculateDrivingTime(distanceKm: number): number {
  const avgSpeedKmh = 30;
  const drivingMinutes = (distanceKm / avgSpeedKmh) * 60;
  const bufferMinutes = 5;
  
  return Math.round(drivingMinutes + bufferMinutes);
}

/**
 * Simple nearest neighbor algorithm for route optimization
 * Not perfect, but provides reasonable routes for demo purposes
 */
function nearestNeighborRoute(markets: Market[]): Market[] {
  if (markets.length <= 1) return markets;
  
  const unvisited = [...markets];
  const route: Market[] = [];
  
  // Start with first market
  let current = unvisited.shift()!;
  route.push(current);
  
  // Find nearest unvisited market at each step
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    
    unvisited.forEach((market, index) => {
      if (!current.coordinates || !market.coordinates) return;
      
      const distance = calculateDistance(
        current.coordinates.lat,
        current.coordinates.lng,
        market.coordinates.lat,
        market.coordinates.lng
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    
    current = unvisited.splice(nearestIndex, 1)[0];
    route.push(current);
  }
  
  return route;
}

/**
 * Calculate optimal tour route for selected markets
 * Returns ordered markets with time estimates
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
  
  // Optimize route using nearest neighbor
  const optimizedRoute = nearestNeighborRoute(markets);
  
  // Calculate driving times
  let totalDrivingTime = 0;
  
  for (let i = 0; i < optimizedRoute.length - 1; i++) {
    const from = optimizedRoute[i];
    const to = optimizedRoute[i + 1];
    
    if (!from.coordinates || !to.coordinates) continue;
    
    const distance = calculateDistance(
      from.coordinates.lat,
      from.coordinates.lng,
      to.coordinates.lat,
      to.coordinates.lng
    );
    
    const drivingMinutes = calculateDrivingTime(distance);
    totalDrivingTime += drivingMinutes;
  }
  
  // Calculate work time (45 minutes per market)
  const totalWorkTime = optimizedRoute.length * 45;
  const totalTime = totalDrivingTime + totalWorkTime;
  
  return {
    markets: optimizedRoute,
    totalDrivingTime,
    totalWorkTime,
    totalTime,
    optimizedOrder: optimizedRoute.map(m => m.id),
    legs: [],
  };
}

/**
 * Format minutes into human-readable time string
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} Min`;
  }
  
  if (mins === 0) {
    return `${hours} Std`;
  }
  
  return `${hours} Std ${mins} Min`;
}


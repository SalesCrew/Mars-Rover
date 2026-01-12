import { API_ENDPOINTS } from '../config/database';
import type { AdminMarket } from '../types/market-types';

class MarketService {
  /**
   * Fetch all markets from the API
   */
  async getAllMarkets(): Promise<AdminMarket[]> {
    try {
      const response = await fetch(API_ENDPOINTS.markets.getAll);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return this.transformMarketsFromDB(data || []);
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  /**
   * Get a single market by ID
   */
  async getMarketById(id: string): Promise<AdminMarket> {
    try {
      const response = await fetch(API_ENDPOINTS.markets.getById(id));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return this.transformMarketFromDB(data);
    } catch (error) {
      console.error(`Error fetching market ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new market
   */
  async createMarket(market: Partial<AdminMarket>): Promise<AdminMarket> {
    try {
      const dbMarket = this.transformMarketToDB(market);
      
      const response = await fetch(API_ENDPOINTS.markets.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbMarket),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformMarketFromDB(data);
    } catch (error) {
      console.error('Error creating market:', error);
      throw error;
    }
  }

  /**
   * Update an existing market
   */
  async updateMarket(id: string, market: Partial<AdminMarket>): Promise<AdminMarket> {
    try {
      const dbMarket = this.transformMarketToDB(market);
      
      const response = await fetch(API_ENDPOINTS.markets.update(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbMarket),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformMarketFromDB(data);
    } catch (error) {
      console.error(`Error updating market ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a market
   */
  async deleteMarket(id: string): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.markets.delete(id), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting market ${id}:`, error);
      throw error;
    }
  }

  /**
   * Record a visit to a market (increments visit count if not already visited today)
   */
  async recordVisit(marketId: string, glId?: string): Promise<{ incremented: boolean; current_visits: number }> {
    try {
      const response = await fetch(`${API_ENDPOINTS.markets.getById(marketId)}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gl_id: glId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error recording visit for market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Import multiple markets
   */
  async importMarkets(markets: AdminMarket[]): Promise<{ success: number; failed: number }> {
    try {
      const dbMarkets = markets.map(m => this.transformMarketToDB(m));
      
      const response = await fetch(API_ENDPOINTS.markets.import, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbMarkets),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error importing markets:', error);
      throw error;
    }
  }

  /**
   * Transform database record to AdminMarket format
   * Column mapping (January 2026):
   * A=ID, D=Channel, E=Banner, F=Handelskette, H=Name
   * I=PLZ, J=Straße, K=Stadt, M=GL Name, N=GL Email
   * O=Status, Q=Frequenz, U=Market Tel, V=Market Email
   */
  private transformMarketFromDB(dbMarket: any): AdminMarket {
    return {
      id: dbMarket.id,
      internalId: dbMarket.internal_id, // Row A
      name: dbMarket.name, // Row H
      address: dbMarket.address || '', // Row J (Straße)
      city: dbMarket.city || '', // Row K (Stadt)
      postalCode: dbMarket.postal_code || '', // Row I (PLZ)
      chain: dbMarket.chain || '', // Row F: Handelskette
      frequency: dbMarket.frequency || 12, // Row Q
      currentVisits: dbMarket.current_visits || 0,
      lastVisitDate: dbMarket.last_visit_date,
      isCompleted: dbMarket.is_completed || false,
      isActive: dbMarket.is_active ?? true, // Row O: Status
      gebietsleiter: dbMarket.gebietsleiter_id, // UUID - for GL assignment
      gebietsleiterName: dbMarket.gebietsleiter_name, // Row M
      gebietsleiterEmail: dbMarket.gebietsleiter_email, // Row N
      channel: dbMarket.channel, // Row D
      banner: dbMarket.banner, // Row E
      marketTel: dbMarket.market_tel, // Row U (NEW)
      marketEmail: dbMarket.market_email, // Row V (NEW)
      // Legacy fields (kept for backwards compatibility)
      email: dbMarket.email,
      branch: dbMarket.branch,
      subgroup: dbMarket.subgroup,
      visitDay: dbMarket.visit_day,
      visitDuration: dbMarket.visit_duration,
      customerType: dbMarket.customer_type,
      phone: dbMarket.phone,
      maingroup: dbMarket.maingroup,
      coordinates: dbMarket.latitude && dbMarket.longitude ? {
        lat: parseFloat(dbMarket.latitude),
        lng: parseFloat(dbMarket.longitude),
      } : undefined,
    };
  }

  /**
   * Transform multiple database records to AdminMarket format
   */
  private transformMarketsFromDB(dbMarkets: any[]): AdminMarket[] {
    return dbMarkets.map(m => this.transformMarketFromDB(m));
  }

  /**
   * Transform AdminMarket to database format
   * Column mapping (January 2026):
   * A=ID, D=Channel, E=Banner, F=Handelskette, H=Name
   * I=PLZ, J=Straße, K=Stadt, M=GL Name, N=GL Email
   * O=Status, Q=Frequenz, U=Market Tel, V=Market Email
   */
  private transformMarketToDB(market: Partial<AdminMarket>): any {
    return {
      id: market.id,
      internal_id: market.internalId, // Row A
      name: market.name, // Row H
      address: market.address, // Row J (Straße)
      city: market.city, // Row K (Stadt)
      postal_code: market.postalCode, // Row I (PLZ)
      chain: market.chain, // Row F: Handelskette
      frequency: market.frequency, // Row Q
      current_visits: market.currentVisits,
      last_visit_date: market.lastVisitDate,
      is_completed: market.isCompleted,
      is_active: market.isActive, // Row O: Status
      gebietsleiter_id: market.gebietsleiter, // UUID - for GL assignment
      gebietsleiter_name: market.gebietsleiterName, // Row M
      gebietsleiter_email: market.gebietsleiterEmail, // Row N
      channel: market.channel, // Row D
      banner: market.banner, // Row E
      market_tel: market.marketTel, // Row U (NEW)
      market_email: market.marketEmail, // Row V (NEW)
      // Legacy fields (kept for backwards compatibility)
      email: market.email,
      branch: market.branch,
      subgroup: market.subgroup,
      visit_day: market.visitDay,
      visit_duration: market.visitDuration,
      customer_type: market.customerType,
      phone: market.phone,
      maingroup: market.maingroup,
      latitude: market.coordinates?.lat,
      longitude: market.coordinates?.lng,
    };
  }
}

// Export singleton instance
export const marketService = new MarketService();


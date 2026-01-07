import { API_BASE_URL } from '../config/database';

export interface ActionHistoryEntry {
  id: string;
  action_type: 'assign' | 'swap' | 'remove';
  timestamp: string;
  market_id?: string;
  market_chain: string;
  market_address: string;
  market_postal_code?: string;
  market_city?: string;
  target_gl: string;
  previous_gl?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActionHistoryData {
  action_type: 'assign' | 'swap' | 'remove';
  market_id?: string;
  market_chain: string;
  market_address: string;
  market_postal_code?: string;
  market_city?: string;
  target_gl: string;
  previous_gl?: string;
  performed_by?: string;
  notes?: string;
}

class ActionHistoryService {
  private baseUrl = `${API_BASE_URL}/action-history`;

  async getAllHistory(targetGl?: string, limit = 100, offset = 0): Promise<ActionHistoryEntry[]> {
    try {
      const params = new URLSearchParams();
      if (targetGl) params.append('target_gl', targetGl);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch action history: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching action history:', error);
      throw error;
    }
  }

  async createHistoryEntry(data: CreateActionHistoryData): Promise<ActionHistoryEntry> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create action history: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating action history:', error);
      throw error;
    }
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete action history: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting action history:', error);
      throw error;
    }
  }
}

export const actionHistoryService = new ActionHistoryService();


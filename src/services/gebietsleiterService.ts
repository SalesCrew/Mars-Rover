const API_URL = 'http://localhost:3001/api';

export interface Gebietsleiter {
  id: string;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGebietsleiterDto {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  password: string;
  profilePictureUrl?: string | null;
}

export interface UpdateGebietsleiterDto {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  password?: string;
  profilePictureUrl?: string | null;
}

class GebietsleiterService {
  /**
   * Get all gebietsleiter
   */
  async getAllGebietsleiter(): Promise<Gebietsleiter[]> {
    try {
      const response = await fetch(`${API_URL}/gebietsleiter`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching gebietsleiter:', error);
      throw error;
    }
  }

  /**
   * Get a single gebietsleiter by ID
   */
  async getGebietsleiterById(id: string): Promise<Gebietsleiter> {
    try {
      const response = await fetch(`${API_URL}/gebietsleiter/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching gebietsleiter:', error);
      throw error;
    }
  }

  /**
   * Create a new gebietsleiter
   */
  async createGebietsleiter(dto: CreateGebietsleiterDto): Promise<Gebietsleiter> {
    try {
      const response = await fetch(`${API_URL}/gebietsleiter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating gebietsleiter:', error);
      throw error;
    }
  }

  /**
   * Update a gebietsleiter
   */
  async updateGebietsleiter(id: string, dto: UpdateGebietsleiterDto): Promise<Gebietsleiter> {
    try {
      const response = await fetch(`${API_URL}/gebietsleiter/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating gebietsleiter:', error);
      throw error;
    }
  }

  /**
   * Delete a gebietsleiter
   */
  async deleteGebietsleiter(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/gebietsleiter/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting gebietsleiter:', error);
      throw error;
    }
  }
}

export const gebietsleiterService = new GebietsleiterService();




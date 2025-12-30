import { API_BASE_URL } from '../config/database';
import type { AuthUser, LoginCredentials } from '../types/auth-types';

class AuthService {
  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    localStorage.removeItem('token');
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return !!localStorage.getItem('token');
  }
}

export const authService = new AuthService();

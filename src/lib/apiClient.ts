/**
 * Centralized API Client with automatic Firebase JWT token injection
 * Handles authentication, token refresh, and error handling for all backend API calls
 */

import { auth } from './firebase';

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_ENDPOINT;
  }

  /**
   * Get authentication headers with Firebase ID token
   * Automatically refreshes expired tokens
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get fresh Firebase ID token (auto-refreshes if expired)
    const idToken = await user.getIdToken();

    return {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make a POST request to the API
   */
  async post<T = any>(endpoint: string, body: any): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[API Client] POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a GET request to the API
   */
  async get<T = any>(endpoint: string): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[API Client] GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a PUT request to the API
   */
  async put<T = any>(endpoint: string, body: any): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[API Client] PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a DELETE request to the API
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[API Client] DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

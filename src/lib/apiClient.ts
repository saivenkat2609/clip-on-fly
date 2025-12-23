/**
 * Centralized API Client with automatic Firebase JWT token injection
 * Handles authentication, token refresh, error handling, and caching for all backend API calls
 */

import { auth } from './firebase';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface RequestDedupeEntry {
  promise: Promise<any>;
  timestamp: number;
}

class APIClient {
  private baseURL: string;
  private cache: Map<string, CacheEntry<any>>;
  private inFlightRequests: Map<string, RequestDedupeEntry>;
  private defaultCacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseURL = import.meta.env.VITE_API_ENDPOINT;
    this.cache = new Map();
    this.inFlightRequests = new Map();

    // Clean up expired cache entries every minute
    setInterval(() => this.cleanupCache(), 60 * 1000);
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
   * Get data from cache if available and not expired
   */
  private getFromCache<T>(key: string, ttl: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.defaultCacheTTL) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.cache.delete(key));

    // Also clean up stale in-flight requests (older than 30 seconds)
    const staleRequests: string[] = [];
    this.inFlightRequests.forEach((entry, key) => {
      if (now - entry.timestamp > 30000) {
        staleRequests.push(key);
      }
    });

    staleRequests.forEach((key) => this.inFlightRequests.delete(key));
  }

  /**
   * Make a GET request to the API with caching and request deduplication
   * @param endpoint - API endpoint
   * @param options - Cache options { ttl: cache TTL in ms, skipCache: skip cache }
   */
  async get<T = any>(
    endpoint: string,
    options: { ttl?: number; skipCache?: boolean } = {}
  ): Promise<T> {
    const { ttl = this.defaultCacheTTL, skipCache = false } = options;
    const cacheKey = `GET:${endpoint}`;

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cached = this.getFromCache<T>(cacheKey, ttl);
      if (cached !== null) {
        return cached;
      }

      // Request deduplication - if same request is in flight, return same promise
      const inFlight = this.inFlightRequests.get(cacheKey);
      if (inFlight) {
        return inFlight.promise;
      }
    }

    // Make the request
    const requestPromise = (async () => {
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

        const data = await response.json();

        // Cache the response
        if (!skipCache) {
          this.setCache(cacheKey, data);
        }

        return data;
      } catch (error) {
        console.error(`[API Client] GET ${endpoint} failed:`, error);
        throw error;
      } finally {
        // Remove from in-flight requests
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    // Track in-flight request
    if (!skipCache) {
      this.inFlightRequests.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now(),
      });
    }

    return requestPromise;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(endpoint: string): void {
    const cacheKey = `GET:${endpoint}`;
    this.cache.delete(cacheKey);
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

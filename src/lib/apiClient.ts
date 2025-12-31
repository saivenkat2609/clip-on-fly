/**
 * Centralized API Client with automatic Firebase JWT token injection
 * Handles authentication, token refresh, error handling, and caching for all backend API calls
 *
 * HIGH PRIORITY FIX #25: Added retry logic with exponential backoff
 * - Automatically retries on 429 (Rate Limit) and 503 (Service Unavailable)
 * - Exponential backoff: 1s, 2s, 4s between attempts
 * - Max 3 attempts
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
   * HIGH PRIORITY FIX #25: Exponential backoff delay
   * @param attempt - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.pow(2, attempt) * 1000;
  }

  /**
   * HIGH PRIORITY FIX #25: Check if error is retryable
   * @param status - HTTP status code
   * @returns true if should retry
   */
  private isRetryableStatus(status: number): boolean {
    return status === 429 || status === 503;
  }

  /**
   * HIGH PRIORITY FIX #25: Sleep for exponential backoff
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get authentication headers with Firebase ID token
   * Automatically refreshes expired tokens
   *
   * HIGH PRIORITY FIX #13: Added CSRF protection via custom header
   * While JWT-based APIs in Authorization headers are inherently CSRF-resistant
   * (browsers don't auto-send them like cookies), we add X-Requested-With
   * as defense-in-depth to prove the request came from our JavaScript app
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
      // HIGH PRIORITY FIX #13: CSRF protection header
      // Proves request originated from our JavaScript application, not a simple form
      // Browsers prevent other sites from setting custom headers via simple requests
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': '1.0.0', // Additional verification - can be checked server-side
    };
  }

  /**
   * Make a POST request to the API with retry logic
   * HIGH PRIORITY FIX #25: Automatically retries on 429 and 503 with exponential backoff
   */
  async post<T = any>(endpoint: string, body: any): Promise<T> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        // HIGH PRIORITY FIX #25: Check if we should retry
        if (this.isRetryableStatus(response.status) && attempt < maxRetries - 1) {
          const delay = this.getRetryDelay(attempt);
          console.warn(`[API Client] POST ${endpoint} returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          // HIGH PRIORITY FIX #24: Sanitize error messages to avoid exposing internal details
          const errorMessage = error.error || 'Request failed';
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        // If it's a network error and we have retries left, retry
        if (attempt < maxRetries - 1 && error instanceof TypeError) {
          const delay = this.getRetryDelay(attempt);
          console.warn(`[API Client] POST ${endpoint} network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        console.error(`[API Client] POST ${endpoint} failed after ${attempt + 1} attempts:`, error);
        throw error;
      }
    }

    throw new Error(`POST ${endpoint} failed after ${maxRetries} attempts`);
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
   * Make a GET request to the API with caching, request deduplication, and retry logic
   * HIGH PRIORITY FIX #25: Added retry logic with exponential backoff
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

    // Make the request with retry logic
    const requestPromise = (async () => {
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const headers = await this.getAuthHeaders();
          const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            headers,
          });

          // HIGH PRIORITY FIX #25: Check if we should retry
          if (this.isRetryableStatus(response.status) && attempt < maxRetries - 1) {
            const delay = this.getRetryDelay(attempt);
            console.warn(`[API Client] GET ${endpoint} returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
            await this.sleep(delay);
            continue;
          }

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            // HIGH PRIORITY FIX #24: Sanitize error messages
            const errorMessage = error.error || 'Request failed';
            throw new Error(errorMessage);
          }

          const data = await response.json();

          // Cache the response
          if (!skipCache) {
            this.setCache(cacheKey, data);
          }

          return data;
        } catch (error) {
          // If it's a network error and we have retries left, retry
          if (attempt < maxRetries - 1 && error instanceof TypeError) {
            const delay = this.getRetryDelay(attempt);
            console.warn(`[API Client] GET ${endpoint} network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
            await this.sleep(delay);
            continue;
          }

          console.error(`[API Client] GET ${endpoint} failed after ${attempt + 1} attempts:`, error);
          throw error;
        } finally {
          // Remove from in-flight requests only on last attempt or success
          if (attempt === maxRetries - 1) {
            this.inFlightRequests.delete(cacheKey);
          }
        }
      }

      throw new Error(`GET ${endpoint} failed after ${maxRetries} attempts`);
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
   * Make a PUT request to the API with retry logic
   * HIGH PRIORITY FIX #25: Automatically retries on 429 and 503 with exponential backoff
   */
  async put<T = any>(endpoint: string, body: any): Promise<T> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        // HIGH PRIORITY FIX #25: Check if we should retry
        if (this.isRetryableStatus(response.status) && attempt < maxRetries - 1) {
          const delay = this.getRetryDelay(attempt);
          console.warn(`[API Client] PUT ${endpoint} returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          // HIGH PRIORITY FIX #24: Sanitize error messages
          const errorMessage = error.error || 'Request failed';
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        // If it's a network error and we have retries left, retry
        if (attempt < maxRetries - 1 && error instanceof TypeError) {
          const delay = this.getRetryDelay(attempt);
          console.warn(`[API Client] PUT ${endpoint} network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        console.error(`[API Client] PUT ${endpoint} failed after ${attempt + 1} attempts:`, error);
        throw error;
      }
    }

    throw new Error(`PUT ${endpoint} failed after ${maxRetries} attempts`);
  }

  /**
   * Make a DELETE request to the API with retry logic
   * HIGH PRIORITY FIX #25: Automatically retries on 429 and 503 with exponential backoff
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'DELETE',
          headers,
        });

        // HIGH PRIORITY FIX #25: Check if we should retry
        if (this.isRetryableStatus(response.status) && attempt < maxRetries - 1) {
          const delay = this.getRetryDelay(attempt);
          console.warn(`[API Client] DELETE ${endpoint} returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          // HIGH PRIORITY FIX #24: Sanitize error messages
          const errorMessage = error.error || 'Request failed';
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        // If it's a network error and we have retries left, retry
        if (attempt < maxRetries - 1 && error instanceof TypeError) {
          const delay = this.getRetryDelay(attempt);
          console.warn(`[API Client] DELETE ${endpoint} network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        console.error(`[API Client] DELETE ${endpoint} failed after ${attempt + 1} attempts:`, error);
        throw error;
      }
    }

    throw new Error(`DELETE ${endpoint} failed after ${maxRetries} attempts`);
  }
}

// Export singleton instance
export const apiClient = new APIClient();

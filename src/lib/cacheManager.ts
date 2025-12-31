/**
 * Advanced cache manager with TTL and invalidation
 *
 * Provides a more sophisticated caching layer than simple sessionStorage.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheOptions {
  ttl?: number;
  storage?: 'memory' | 'sessionStorage' | 'localStorage';
  namespace?: string;
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private namespace: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(namespace: string = 'app') {
    this.namespace = namespace;
    this.startCleanup();
  }

  /**
   * Get item from cache
   */
  get<T>(key: string, storage: 'memory' | 'sessionStorage' | 'localStorage' = 'memory'): T | null {
    const fullKey = this.getFullKey(key);

    try {
      let entry: CacheEntry<T> | null = null;

      if (storage === 'memory') {
        entry = this.memoryCache.get(fullKey) || null;
      } else {
        const storageObj = storage === 'sessionStorage' ? sessionStorage : localStorage;
        const stored = storageObj.getItem(fullKey);
        if (stored) {
          entry = JSON.parse(stored);
        }
      }

      if (!entry) {
        return null;
      }

      // Check if expired
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        this.delete(key, storage);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set item in cache
   */
  set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): boolean {
    const {
      ttl = 5 * 60 * 1000, // Default: 5 minutes
      storage = 'memory'
    } = options;

    const fullKey = this.getFullKey(key);

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        key: fullKey
      };

      if (storage === 'memory') {
        this.memoryCache.set(fullKey, entry);
      } else {
        const storageObj = storage === 'sessionStorage' ? sessionStorage : localStorage;
        storageObj.setItem(fullKey, JSON.stringify(entry));
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string, storage: 'memory' | 'sessionStorage' | 'localStorage' = 'memory'): boolean {
    const fullKey = this.getFullKey(key);

    try {
      if (storage === 'memory') {
        return this.memoryCache.delete(fullKey);
      } else {
        const storageObj = storage === 'sessionStorage' ? sessionStorage : localStorage;
        storageObj.removeItem(fullKey);
        return true;
      }
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string, storage: 'memory' | 'sessionStorage' | 'localStorage' = 'memory'): number {
    let count = 0;

    try {
      if (storage === 'memory') {
        const keys = Array.from(this.memoryCache.keys());
        for (const key of keys) {
          if (key.includes(pattern)) {
            this.memoryCache.delete(key);
            count++;
          }
        }
      } else {
        const storageObj = storage === 'sessionStorage' ? sessionStorage : localStorage;
        const keys = Object.keys(storageObj);
        for (const key of keys) {
          if (key.includes(pattern)) {
            storageObj.removeItem(key);
            count++;
          }
        }
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear(storage?: 'memory' | 'sessionStorage' | 'localStorage'): void {
    try {
      if (!storage || storage === 'memory') {
        this.memoryCache.clear();
      }

      if (!storage || storage === 'sessionStorage') {
        const keys = Object.keys(sessionStorage);
        for (const key of keys) {
          if (key.startsWith(this.namespace)) {
            sessionStorage.removeItem(key);
          }
        }
      }

      if (!storage || storage === 'localStorage') {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(this.namespace)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryCount: number;
    sessionStorageCount: number;
    localStorageCount: number;
  } {
    let sessionStorageCount = 0;
    let localStorageCount = 0;

    try {
      const sessionKeys = Object.keys(sessionStorage);
      sessionStorageCount = sessionKeys.filter(k => k.startsWith(this.namespace)).length;

      const localKeys = Object.keys(localStorage);
      localStorageCount = localKeys.filter(k => k.startsWith(this.namespace)).length;
    } catch (error) {
      console.error('Cache stats error:', error);
    }

    return {
      memoryCount: this.memoryCache.size,
      sessionStorageCount,
      localStorageCount
    };
  }

  /**
   * Get full cache key with namespace
   */
  private getFullKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
let defaultInstance: CacheManager | null = null;

/**
 * Get default cache manager instance
 */
export function getCacheManager(namespace: string = 'app'): CacheManager {
  if (!defaultInstance) {
    defaultInstance = new CacheManager(namespace);
  }
  return defaultInstance;
}

/**
 * React hook for cache management
 */
import { useState, useEffect, useCallback } from 'react';

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cache = getCacheManager();
  const { ttl = 5 * 60 * 1000, storage = 'memory' } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = cache.get<T>(key, storage);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await fetcher();
      cache.set(key, result, { ttl, storage });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, storage]);

  const refetch = useCallback(async () => {
    cache.delete(key, storage);
    await fetchData();
  }, [fetchData, key, storage]);

  const invalidate = useCallback(() => {
    cache.delete(key, storage);
    setData(null);
  }, [key, storage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch, invalidate };
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions & { keyFn?: (...args: Parameters<T>) => string } = {}
): T {
  const cache = getCacheManager();
  const { ttl = 5 * 60 * 1000, storage = 'memory', keyFn } = options;

  return (async (...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : `${fn.name}:${JSON.stringify(args)}`;

    // Check cache
    const cached = cache.get(key, storage);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Store in cache
    cache.set(key, result, { ttl, storage });

    return result;
  }) as T;
}

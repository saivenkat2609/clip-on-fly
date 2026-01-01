/**
 * Error handling utility with retry logic and exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number, public response?: any) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Execute function with retry logic and exponential backoff
 *
 * @param fn - Function to execute
 * @param options - Retry options
 * @returns Promise with function result
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     backoffFactor: 2
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = defaultShouldRetry,
    onRetry
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      // Wait before retrying
      await sleep(Math.min(delay, maxDelay));

      // Increase delay for next retry (exponential backoff)
      delay *= backoffFactor;
    }
  }

  throw lastError;
}

/**
 * Default retry logic - retry on network errors and 5xx errors
 */
function defaultShouldRetry(error: any, attempt: number): boolean {
  // Don't retry on client errors (4xx except 429)
  if (error instanceof NetworkError && error.statusCode) {
    if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
      return false;
    }
  }

  // Retry on network errors, timeouts, and 5xx errors
  return (
    error instanceof NetworkError ||
    error instanceof TimeoutError ||
    error.name === 'TypeError' || // Network failures often show as TypeError
    error.message?.includes('fetch') ||
    error.message?.includes('network')
  );
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse and format API errors
 */
export function parseApiError(error: any): string {
  if (error instanceof NetworkError) {
    if (error.statusCode === 401) {
      return 'Authentication required. Please log in again.';
    }
    if (error.statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.statusCode === 404) {
      return 'Resource not found.';
    }
    if (error.statusCode === 429) {
      return 'Too many requests. Please try again later.';
    }
    if (error.statusCode && error.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    if (error.response?.error) {
      return error.response.error;
    }
    if (error.response?.message) {
      return error.response.message;
    }
  }

  if (error instanceof TimeoutError) {
    return 'Request timed out. Please check your connection and try again.';
  }

  if (error instanceof RateLimitError) {
    if (error.retryAfter) {
      return `Rate limit exceeded. Please try again in ${error.retryAfter} seconds.`;
    }
    return 'Rate limit exceeded. Please try again later.';
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Request timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Batch requests with concurrency limit
 */
export async function batchRequests<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const { concurrency = 5, onProgress } = options;
  const results: R[] = [];
  let completed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(item => fn(item)));
    results.push(...batchResults);

    completed += batch.length;
    if (onProgress) {
      onProgress(completed, items.length);
    }
  }

  return results;
}

/**
 * React hook for error handling
 */
import { useState, useCallback } from 'react';

export interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: any) => void;
  clearError: () => void;
  handleError: (error: any) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<string | null>(null);

  const setError = useCallback((error: any) => {
    const message = parseApiError(error);
    setErrorState(message);
    console.error('Error:', error);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: any) => {
    setError(error);
    // You can add global error reporting here (e.g., Sentry)
  }, [setError]);

  return { error, setError, clearError, handleError };
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // You can add global error reporting here
    });
  }
}

/**
 * Debounce utility for delaying function execution
 *
 * Delays the execution of a function until after a specified delay has passed
 * since the last time it was invoked. Useful for expensive operations like
 * API calls or re-renders triggered by user input.
 */

export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

/**
 * Creates a debounced function that delays invoking func until after delay milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version of the function with cancel() and flush() methods
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   api.search(query);
 * }, 300);
 *
 * // Call multiple times
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this call will execute (after 300ms)
 *
 * // Cancel pending execution
 * debouncedSearch.cancel();
 *
 * // Execute immediately
 * debouncedSearch.flush();
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  } as DebouncedFunction<T>;

  // Cancel pending execution
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  // Execute immediately with last arguments
  debounced.flush = function (this: any) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;

      if (lastArgs !== null) {
        func.apply(this, lastArgs);
        lastArgs = null;
      }
    }
  };

  return debounced;
}

/**
 * React hook for creating a debounced function
 *
 * @param func - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A memoized debounced function
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const debouncedSearch = useDebounce((query: string) => {
 *     api.search(query);
 *   }, 300);
 *
 *   return (
 *     <input
 *       onChange={(e) => debouncedSearch(e.target.value)}
 *     />
 *   );
 * };
 * ```
 */
import { useCallback, useEffect, useRef } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  const funcRef = useRef(func);
  const debouncedRef = useRef<DebouncedFunction<T>>();

  // Update function reference
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  // Create debounced function
  if (!debouncedRef.current) {
    debouncedRef.current = debounce(
      (...args: Parameters<T>) => funcRef.current(...args),
      delay
    );
  }

  // Cancel on unmount
  useEffect(() => {
    return () => {
      debouncedRef.current?.cancel();
    };
  }, []);

  return debouncedRef.current;
}

/**
 * React hook for debouncing a value
 *
 * @param value - The value to debounce
 * @param delay - The number of milliseconds to delay
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const [searchQuery, setSearchQuery] = useState('');
 *   const debouncedQuery = useDebouncedValue(searchQuery, 300);
 *
 *   useEffect(() => {
 *     // This will only run 300ms after user stops typing
 *     api.search(debouncedQuery);
 *   }, [debouncedQuery]);
 *
 *   return <input onChange={(e) => setSearchQuery(e.target.value)} />;
 * };
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useNonState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

// Helper hook for non-state value storage
function useNonState<T>(initialValue: T): [T, (value: T) => void] {
  const ref = useRef<T>(initialValue);

  const setValue = useCallback((value: T) => {
    ref.current = value;
  }, []);

  return [ref.current, setValue];
}

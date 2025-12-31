/**
 * Throttle utility for rate-limiting function execution
 *
 * Limits the rate at which a function can fire. Useful for performance-intensive
 * operations like scroll handlers, resize handlers, or mousemove events.
 */

export type ThrottledFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to wait between invocations
 * @param options - Throttle options (leading, trailing)
 * @returns A throttled version of the function with cancel() method
 *
 * @example
 * ```ts
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll event handled');
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 *
 * // Cancel pending execution
 * throttledScroll.cancel();
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): ThrottledFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;

  const { leading = true, trailing = true } = options;

  const invokeFunc = function (this: any, time: number) {
    const args = lastArgs!;
    lastArgs = null;
    lastInvokeTime = time;
    func.apply(this, args);
  };

  const startTimer = function (this: any, pendingFunc: () => void, wait: number) {
    timeoutId = setTimeout(pendingFunc.bind(this), wait);
  };

  const cancelTimer = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= wait
    );
  };

  const trailingEdge = function (this: any, time: number) {
    timeoutId = null;

    if (trailing && lastArgs) {
      invokeFunc.call(this, time);
    }

    lastArgs = null;
  };

  const timerExpired = function (this: any) {
    const time = Date.now();

    if (shouldInvoke(time)) {
      trailingEdge.call(this, time);
      return;
    }

    // Restart timer
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    startTimer.call(
      this,
      timerExpired,
      Math.min(timeWaiting, wait - timeSinceLastInvoke)
    );
  };

  const throttled = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        // First call or past wait time
        if (leading) {
          invokeFunc.call(this, time);
        }

        lastInvokeTime = time;
        startTimer.call(this, timerExpired, wait);
        return;
      }
    }

    if (timeoutId === null) {
      startTimer.call(this, timerExpired, wait);
    }
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    cancelTimer();
    lastArgs = null;
    lastCallTime = null;
    lastInvokeTime = 0;
  };

  return throttled;
}

/**
 * React hook for creating a throttled function
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to wait between invocations
 * @param options - Throttle options
 * @returns A memoized throttled function
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const throttledScroll = useThrottle(() => {
 *     console.log('Scroll handled');
 *   }, 100);
 *
 *   useEffect(() => {
 *     window.addEventListener('scroll', throttledScroll);
 *     return () => window.removeEventListener('scroll', throttledScroll);
 *   }, [throttledScroll]);
 *
 *   return <div>Content</div>;
 * };
 * ```
 */
import { useCallback, useEffect, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
  }
): ThrottledFunction<T> {
  const funcRef = useRef(func);
  const throttledRef = useRef<ThrottledFunction<T>>();

  // Update function reference
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  // Create throttled function
  if (!throttledRef.current) {
    throttledRef.current = throttle(
      (...args: Parameters<T>) => funcRef.current(...args),
      wait,
      options
    );
  }

  // Cancel on unmount
  useEffect(() => {
    return () => {
      throttledRef.current?.cancel();
    };
  }, []);

  return throttledRef.current;
}

/**
 * Throttle with requestAnimationFrame for smooth animations
 *
 * @param func - The function to throttle
 * @returns A throttled version using RAF
 *
 * @example
 * ```ts
 * const throttledAnimate = throttleWithRAF(() => {
 *   // Animation logic
 * });
 *
 * window.addEventListener('scroll', throttledAnimate);
 * ```
 */
export function throttleWithRAF<T extends (...args: any[]) => any>(
  func: T
): ThrottledFunction<T> {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(this, lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      lastArgs = null;
    }
  };

  return throttled;
}

/**
 * React hook for throttling with requestAnimationFrame
 *
 * @param func - The function to throttle
 * @returns A memoized throttled function using RAF
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const throttledAnimate = useThrottleRAF(() => {
 *     // Smooth animation logic
 *   });
 *
 *   return <div onScroll={throttledAnimate}>Content</div>;
 * };
 * ```
 */
export function useThrottleRAF<T extends (...args: any[]) => any>(
  func: T
): ThrottledFunction<T> {
  const funcRef = useRef(func);
  const throttledRef = useRef<ThrottledFunction<T>>();

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  if (!throttledRef.current) {
    throttledRef.current = throttleWithRAF(
      (...args: Parameters<T>) => funcRef.current(...args)
    );
  }

  useEffect(() => {
    return () => {
      throttledRef.current?.cancel();
    };
  }, []);

  return throttledRef.current;
}

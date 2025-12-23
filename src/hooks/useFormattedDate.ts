import { useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Hook to format dates with memoization
 * Prevents re-computing date formats on every render
 */
export function useFormattedDate(date: Date | string | number | undefined | null) {
  const relativeTime = useMemo(() => {
    if (!date) return '';

    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting relative date:', error);
      return '';
    }
  }, [date]);

  const fullDate = useMemo(() => {
    if (!date) return '';

    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'PPpp'); // "Apr 29, 2023, 11:45 AM"
    } catch (error) {
      console.error('Error formatting full date:', error);
      return '';
    }
  }, [date]);

  const shortDate = useMemo(() => {
    if (!date) return '';

    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'PP'); // "Apr 29, 2023"
    } catch (error) {
      console.error('Error formatting short date:', error);
      return '';
    }
  }, [date]);

  return {
    relativeTime, // "2 hours ago"
    fullDate,     // "Apr 29, 2023, 11:45 AM"
    shortDate,    // "Apr 29, 2023"
  };
}

/**
 * Hook to format duration in seconds to readable format
 */
export function useFormattedDuration(seconds: number | undefined) {
  return useMemo(() => {
    if (!seconds) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);
}

/**
 * Hook to format file size in bytes to readable format
 */
export function useFormattedFileSize(bytes: number | undefined) {
  return useMemo(() => {
    if (!bytes) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }, [bytes]);
}

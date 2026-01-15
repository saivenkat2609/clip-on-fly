import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';

export interface Video {
  id: string;
  userId: string;
  title: string;
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'pending' | 'failed';
  progress: number;
  createdAt: any;
  updatedAt: any;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoInfo?: {
    duration: number;
    size: number;
    format: string;
    resolution: string;
    title?: string;
    thumbnail?: string;
  };
  clips?: any[];
  error?: string;
  sessionId?: string;
  youtubeUrl?: string;
  projectName?: string;
  completedAt?: any;
}

const CACHE_KEY_PREFIX = 'user_videos_';
const SESSION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Smart caching hook for videos with real-time updates
 *
 * Strategy:
 * 1. Real-time mode (Dashboard): onSnapshot listener as primary source
 * 2. Cache mode (other pages): sessionStorage → React Query cache → Firestore
 * 3. Background updates: Silent refetch every 30s if data becomes stale
 * 4. Always show correct data with minimal API calls
 */
export function useVideos(options?: {
  status?: Video['status'];
  limit?: number;
  realTime?: boolean; // Enable real-time updates (only for Dashboard)
}) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = currentUser?.uid;
  const realTime = options?.realTime;

  const queryKey = useMemo(() => ['videos', userId], [userId]);

  // Track if we've received first real-time update (for loading state)
  const [hasReceivedRealtimeData, setHasReceivedRealtimeData] = useState(false);

  // Get cached data once for initialData (use cache in ALL modes for instant display)
  const initialCachedData = useMemo(() => {
    if (!userId) return undefined;

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        const ageMinutes = Math.floor(age / 1000 / 60);

        if (age < SESSION_CACHE_TTL) {
          console.log(`[useVideos] ✅ Using cached data: ${data.length} videos, age: ${ageMinutes}m, key: ${cacheKey}`);
          return data as Video[];
        } else {
          console.log(`[useVideos] ⏰ Cache expired (age: ${ageMinutes}m > 30m), will fetch fresh`);
        }
      } else {
        console.log(`[useVideos] ⚠️ No cached data found with key: ${cacheKey}`);
      }
    } catch (error) {
      console.error('[useVideos] ❌ Failed to read cached videos:', error);
    }

    return undefined;
  }, [userId, realTime]);

  // Real-time subscription - Primary data source for Dashboard
  useEffect(() => {
    // Reset loading state when switching modes or userId changes
    if (!realTime) {
      setHasReceivedRealtimeData(false);
    }

    if (!userId) {
      console.log('[useVideos] useEffect - No userId, skipping listener setup');
      setHasReceivedRealtimeData(false);
      return;
    }

    // For real-time mode, use onSnapshot listener
    if (realTime) {
      console.log('[useVideos] Setting up real-time listener for userId:', userId);
      console.log('[useVideos] Firestore db instance:', db ? 'Available' : 'NOT AVAILABLE');

      // Reset loading state when setting up new listener
      setHasReceivedRealtimeData(false);

      if (!db) {
        console.error('[useVideos] Firebase db is not initialized!');
        return undefined;
      }

      try {
        const videosRef = collection(db, `users/${userId}/videos`);
        console.log('[useVideos] Collection reference created:', `users/${userId}/videos`);

        // For real-time mode: fetch WITHOUT orderBy for faster initial load (sort client-side)
        console.log('[useVideos] Setting up onSnapshot without orderBy for faster load...');

        const startTime = Date.now();
        console.log('[useVideos] onSnapshot listener attached at:', startTime);

        const unsubscribe = onSnapshot(
          videosRef, // No orderBy - much faster
          (snapshot) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log('[useVideos] ⚡ onSnapshot triggered after', duration, 'ms - snapshot.size:', snapshot.size, 'snapshot.empty:', snapshot.empty);

          const videos: Video[] = [];
          snapshot.forEach((doc) => {
            const docData = doc.data();
            videos.push({
              id: doc.id,
              ...docData,
            } as Video);
          });

          // Sort client-side by createdAt (desc)
          videos.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
            return bTime - aTime;
          });

          console.log('[useVideos] Real-time update - received and sorted videos:', videos.length);

          // Mark that we've received data
          setHasReceivedRealtimeData(true);

          // Update React Query cache with original data
          queryClient.setQueryData(queryKey, videos);

          // Convert Firestore Timestamps to ISO strings for sessionStorage
          const cacheVideos = videos.map(v => ({
            ...v,
            createdAt: v.createdAt?.toDate?.() ? v.createdAt.toDate().toISOString() : v.createdAt,
            updatedAt: v.updatedAt?.toDate?.() ? v.updatedAt.toDate().toISOString() : v.updatedAt,
            completedAt: v.completedAt?.toDate?.() ? v.completedAt.toDate().toISOString() : v.completedAt,
          }));

          // Update sessionStorage for instant load on next visit (persists across tabs)
          try {
            const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
            const cacheData = {
              data: cacheVideos,
              timestamp: Date.now()
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log('[useVideos] ✅ Cached', cacheVideos.length, 'videos to sessionStorage with key:', cacheKey);
          } catch (error) {
            console.error('[useVideos] ❌ Failed to cache videos:', error);
          }
        },
        (error) => {
          console.error('[useVideos] Real-time listener error:', error);
          console.error('[useVideos] Error code:', error.code);
          console.error('[useVideos] Error message:', error.message);
        }
      );

      return () => {
        console.log('[useVideos] Cleaning up real-time listener for userId:', userId);
        unsubscribe();
      };
    } catch (error: any) {
      console.error('[useVideos] Error setting up real-time listener:', error);
      console.error('[useVideos] Error details:', error.code, error.message);
    }
  }

    return undefined;
  }, [userId, realTime]); // queryClient and queryKey are stable, don't include them

  // Query configuration - Smart caching with background updates
  const videoQuery = useQuery({
    queryKey,
    initialData: initialCachedData, // Always try cache first for instant UI
    queryFn: async () => {
      if (!userId) {
        console.log('[useVideos] queryFn - No userId, returning empty array');
        return [];
      }

      // In real-time mode, skip queryFn entirely - let onSnapshot handle everything
      if (realTime) {
        console.log('[useVideos] queryFn - Real-time mode enabled, returning empty array (onSnapshot will handle data)');
        return [];
      }

      console.log('[useVideos] queryFn executing - userId:', userId);
      console.log('[useVideos] queryFn - Firestore db instance:', db ? 'Available' : 'NOT AVAILABLE');

      if (!db) {
        console.error('[useVideos] queryFn - Firebase db is not initialized!');
        throw new Error('Firebase db is not initialized');
      }

      try {
        // Fetch from Firestore (one-time or fallback for non-real-time mode)
        const videosRef = collection(db, `users/${userId}/videos`);
        console.log('[useVideos] Collection path:', `users/${userId}/videos`);

        // Fetch without orderBy for faster query (sort client-side)
        console.log('[useVideos] Calling getDocs without orderBy...');

        const snapshot = await getDocs(videosRef);
        console.log('[useVideos] getDocs returned - snapshot.size:', snapshot.size, 'snapshot.empty:', snapshot.empty);

        const videos: Video[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          videos.push({
            id: doc.id,
            ...docData,
          } as Video);
        });

        // Sort client-side by createdAt (desc)
        videos.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return bTime - aTime;
        });

        console.log('[useVideos] queryFn fetched and sorted videos:', videos.length);

        // Convert Firestore Timestamps to ISO strings for sessionStorage
        const cacheVideos = videos.map(v => ({
          ...v,
          createdAt: v.createdAt?.toDate?.() ? v.createdAt.toDate().toISOString() : v.createdAt,
          updatedAt: v.updatedAt?.toDate?.() ? v.updatedAt.toDate().toISOString() : v.updatedAt,
          completedAt: v.completedAt?.toDate?.() ? v.completedAt.toDate().toISOString() : v.completedAt,
        }));

        // Cache in sessionStorage
        try {
          sessionStorage.setItem(
            `${CACHE_KEY_PREFIX}${userId}`,
            JSON.stringify({
              data: cacheVideos,
              timestamp: Date.now()
            })
          );
        } catch (error) {
          console.error('[useVideos] Failed to cache videos:', error);
        }

        return videos;
      } catch (error: any) {
        console.error('[useVideos] queryFn ERROR:', error);
        console.error('[useVideos] Error code:', error.code);
        console.error('[useVideos] Error message:', error.message);
        throw error;
      }
    },
    enabled: !!userId && !realTime, // Disable queryFn in real-time mode
    // Real-time mode: onSnapshot is the ONLY source, queryFn disabled
    // Cache mode: use aggressive caching with queryFn
    staleTime: Infinity, // Never consider stale - listener updates or cache is truth
    gcTime: Infinity, // Keep in cache forever
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Don't refetch on mount
    refetchOnReconnect: false,
    retry: 1,
  });

  // Filter by status if needed
  const filteredVideos = options?.status
    ? videoQuery.data?.filter(v => v.status === options.status)
    : videoQuery.data;

  // In real-time mode, use custom loading state (true only if no data and waiting for first onSnapshot)
  const isLoading = realTime
    ? !hasReceivedRealtimeData && !videoQuery.data?.length
    : videoQuery.isLoading;

  // Explicitly expose error and isError for better error handling
  return {
    data: filteredVideos,
    isLoading: videoQuery.isLoading,
    error: videoQuery.error,  // Expose error object
    isError: videoQuery.isError,  // Expose error boolean
    refetch: videoQuery.refetch,
    isFetching: videoQuery.isFetching,
    isSuccess: videoQuery.isSuccess,
  };
}

/**
 * Hook to get a single video by ID
 */
export function useVideo(videoId: string | undefined) {
  const { data: videos, isLoading } = useVideos();

  const video = videos?.find(v => v.id === videoId);

  return {
    data: video,
    isLoading,
    error: null,
  };
}

/**
 * Hook to get video statistics
 */
export function useVideoStats() {
  const { data: videos, ...rest } = useVideos();

  const stats = {
    total: videos?.length || 0,
    completed: videos?.filter((v) => v.status === 'completed').length || 0,
    processing: videos?.filter((v) => v.status === 'processing').length || 0,
    error: videos?.filter((v) => v.status === 'error' || v.status === 'failed').length || 0,
    totalDuration: videos?.reduce((sum, v) => sum + (v.videoInfo?.duration || 0), 0) || 0,
    totalSize: videos?.reduce((sum, v) => sum + (v.videoInfo?.size || 0), 0) || 0,
  };

  return {
    ...rest,
    data: stats,
  };
}

/**
 * Clear videos cache (call on logout or manual refresh)
 */
export function clearVideosCache(userId: string) {
  try {
    sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Failed to clear videos cache:', error);
  }
}

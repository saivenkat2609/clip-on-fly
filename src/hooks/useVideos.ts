import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

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
 * Aggressive caching hook for videos
 *
 * Strategy:
 * 1. Check sessionStorage first (instant)
 * 2. Check React Query cache (instant)
 * 3. Fetch from Firestore only if both miss (one time per session)
 * 4. Real-time updates ONLY enabled on pages that pass realTime: true (Dashboard)
 *
 * Most pages: Zero API calls, pure cache reads
 * Dashboard: Real-time updates for video processing status
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

  const queryKey = ['videos', userId];

  // Real-time subscription ONLY if explicitly enabled
  useEffect(() => {
    if (!userId || !realTime) return;

    const videosRef = collection(db, `users/${userId}/videos`);
    const firestoreQuery = query(videosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(firestoreQuery, (snapshot) => {
      const videos: Video[] = [];
      snapshot.forEach((doc) => {
        videos.push({
          id: doc.id,
          ...doc.data(),
        } as Video);
      });

      // Update React Query cache with original data
      queryClient.setQueryData(['videos', userId], videos);

      // Convert Firestore Timestamps to ISO strings for sessionStorage
      const cacheVideos = videos.map(v => ({
        ...v,
        createdAt: v.createdAt?.toDate?.() ? v.createdAt.toDate().toISOString() : v.createdAt,
        updatedAt: v.updatedAt?.toDate?.() ? v.updatedAt.toDate().toISOString() : v.updatedAt,
        completedAt: v.completedAt?.toDate?.() ? v.completedAt.toDate().toISOString() : v.completedAt,
      }));

      // Update sessionStorage
      try {
        sessionStorage.setItem(
          `${CACHE_KEY_PREFIX}${userId}`,
          JSON.stringify({
            data: cacheVideos,
            timestamp: Date.now()
          })
        );
      } catch (error) {
        console.error('Failed to cache videos:', error);
      }
    });

    return () => unsubscribe();
  }, [userId, realTime, queryClient]);

  // Get cached data synchronously for initialData
  const getCachedData = (): Video[] | undefined => {
    if (!userId) return undefined;

    try {
      const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < SESSION_CACHE_TTL) {
          console.log('[useVideos] Using cached data from sessionStorage');
          return data as Video[];
        }
      }
    } catch (error) {
      console.error('Failed to read cached videos:', error);
    }

    return undefined;
  };

  // Query configuration with aggressive caching
  const videoQuery = useQuery({
    queryKey,
    initialData: getCachedData(), // CRITICAL: Populate immediately with cache
    queryFn: async () => {
      if (!userId) return [];

      // Try sessionStorage first (instant, no API call)
      try {
        const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
        if (cached) {
          const { data, timestamp} = JSON.parse(cached);
          if (Date.now() - timestamp < SESSION_CACHE_TTL) {
            console.log('[useVideos] Returning cached data from queryFn');
            return data as Video[];
          }
        }
      } catch (error) {
        console.error('Failed to read cached videos:', error);
      }

      // Only fetch from Firestore if cache miss
      console.log('[useVideos] Cache miss - fetching from Firestore');
      const videosRef = collection(db, `users/${userId}/videos`);
      const firestoreQuery = query(videosRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(firestoreQuery);

      const videos: Video[] = [];
      snapshot.forEach((doc) => {
        videos.push({
          id: doc.id,
          ...doc.data(),
        } as Video);
      });

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
        console.error('Failed to cache videos:', error);
      }

      return videos;
    },
    enabled: !!userId,
    staleTime: Infinity, // Never consider data stale
    gcTime: Infinity, // Keep in cache forever (until browser close)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Filter by status if needed
  const filteredVideos = options?.status
    ? videoQuery.data?.filter(v => v.status === options.status)
    : videoQuery.data;

  return {
    ...videoQuery,
    data: filteredVideos,
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

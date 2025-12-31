/**
 * Paginated videos hook using React Query infinite queries
 *
 * Replaces the existing useVideos hook with cursor-based pagination
 * for better performance with large video collections.
 */

import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export interface Video {
  session_id: string;
  user_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  video_info?: {
    title: string;
    duration: number;
    thumbnail?: string;
  };
  clips_count?: number;
  source?: 'youtube' | 'upload';
}

export interface PaginatedVideosResponse {
  videos: Video[];
  pagination: {
    has_more: boolean;
    next_cursor?: string;
    limit: number;
    total_count?: number;
  };
}

export interface UseVideosPaginatedOptions {
  limit?: number;
  status?: string;
  source?: 'youtube' | 'upload';
  enabled?: boolean;
}

/**
 * Hook for fetching videos with cursor-based pagination
 *
 * @param options - Query options
 * @returns Infinite query result with videos and pagination controls
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading
 * } = useVideosPaginated({ limit: 20 });
 *
 * const videos = data?.pages.flatMap(page => page.videos) ?? [];
 *
 * return (
 *   <>
 *     {videos.map(video => <VideoCard key={video.session_id} video={video} />)}
 *     {hasNextPage && (
 *       <button onClick={() => fetchNextPage()}>
 *         {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *       </button>
 *     )}
 *   </>
 * );
 * ```
 */
export function useVideosPaginated(
  options: UseVideosPaginatedOptions = {}
): UseInfiniteQueryResult<PaginatedVideosResponse, Error> {
  const {
    limit = 20,
    status,
    source,
    enabled = true
  } = options;

  return useInfiniteQuery<PaginatedVideosResponse, Error>({
    queryKey: ['videos-paginated', { limit, status, source }],
    queryFn: async ({ pageParam }) => {
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(pageParam && { cursor: pageParam as string }),
        ...(status && { status }),
        ...(source && { source })
      });

      // Fetch from API
      const response = await apiClient.get(`/user/videos?${params.toString()}`);

      return response as PaginatedVideosResponse;
    },
    getNextPageParam: (lastPage) => {
      // Return next cursor if there are more pages
      return lastPage.pagination.has_more
        ? lastPage.pagination.next_cursor
        : undefined;
    },
    initialPageParam: undefined,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
}

/**
 * Hook for fetching videos with automatic infinite scroll
 *
 * Uses Intersection Observer to automatically load more videos when
 * the user scrolls near the bottom of the list.
 *
 * @param options - Query options
 * @returns Query result and observer ref
 *
 * @example
 * ```tsx
 * const { videos, observerRef, isLoading } = useVideosInfiniteScroll({ limit: 20 });
 *
 * return (
 *   <>
 *     {videos.map(video => <VideoCard key={video.session_id} video={video} />)}
 *     <div ref={observerRef} className="h-10" />
 *   </>
 * );
 * ```
 */
import { useEffect, useRef } from 'react';

export function useVideosInfiniteScroll(options: UseVideosPaginatedOptions = {}) {
  const query = useVideosPaginated(options);
  const observerRef = useRef<HTMLDivElement>(null);

  // Flatten pages into single array
  const videos = query.data?.pages.flatMap(page => page.videos) ?? [];

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerRef.current || !query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && query.hasNextPage) {
          query.fetchNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // Start loading 100px before reaching the element
      }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return {
    videos,
    observerRef,
    ...query
  };
}

/**
 * Hook for getting total video count
 *
 * @returns Total count of videos for the current user
 *
 * @example
 * ```tsx
 * const { count, isLoading } = useVideosCount();
 *
 * return <div>Total videos: {count}</div>;
 * ```
 */
import { useQuery } from '@tanstack/react-query';

export function useVideosCount() {
  return useQuery({
    queryKey: ['videos-count'],
    queryFn: async () => {
      const response = await apiClient.get('/user/videos/count');
      return response.count as number;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });
}

/**
 * Hook for filtering and sorting videos
 *
 * @param videos - Array of videos to filter/sort
 * @param filters - Filter options
 * @returns Filtered and sorted videos
 *
 * @example
 * ```tsx
 * const filteredVideos = useVideosFilter(videos, {
 *   searchQuery: 'tutorial',
 *   status: 'completed',
 *   sortBy: 'created_at',
 *   sortOrder: 'desc'
 * });
 * ```
 */
export interface VideoFilters {
  searchQuery?: string;
  status?: string;
  source?: 'youtube' | 'upload';
  sortBy?: 'created_at' | 'completed_at' | 'title' | 'clips_count';
  sortOrder?: 'asc' | 'desc';
}

export function useVideosFilter(videos: Video[], filters: VideoFilters): Video[] {
  const {
    searchQuery,
    status,
    source,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  let filtered = [...videos];

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(video =>
      video.video_info?.title?.toLowerCase().includes(query) ||
      video.session_id.toLowerCase().includes(query)
    );
  }

  // Filter by status
  if (status) {
    filtered = filtered.filter(video => video.status === status);
  }

  // Filter by source
  if (source) {
    filtered = filtered.filter(video => video.source === source);
  }

  // Sort videos
  filtered.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'completed_at':
        aValue = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        bValue = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        break;
      case 'title':
        aValue = a.video_info?.title || '';
        bValue = b.video_info?.title || '';
        break;
      case 'clips_count':
        aValue = a.clips_count || 0;
        bValue = b.clips_count || 0;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return filtered;
}

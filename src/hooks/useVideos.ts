import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

// Map Supabase snake_case → camelCase Video shape
function mapRow(row: any): Video {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    progress: row.progress ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    videoInfo: row.video_info,
    clips: row.clips,
    error: row.error,
    sessionId: row.session_id,
    youtubeUrl: row.youtube_url,
    projectName: row.project_name,
    completedAt: row.completed_at,
  };
}

const CACHE_KEY_PREFIX = 'user_videos_';
const SESSION_CACHE_TTL = 30 * 60 * 1000;

export function useVideos(options?: {
  status?: Video['status'];
  limit?: number;
  realTime?: boolean;
}) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = currentUser?.uid;
  const realTime = options?.realTime;

  const queryKey = useMemo(() => ['videos', userId], [userId]);
  const [hasReceivedRealtimeData, setHasReceivedRealtimeData] = useState(false);

  const initialCachedData = useMemo(() => {
    if (!userId) return undefined;
    try {
      const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < SESSION_CACHE_TTL) return data as Video[];
      }
    } catch {}
    return undefined;
  }, [userId]);

  // Real-time subscription — replaces Firestore onSnapshot
  useEffect(() => {
    if (!realTime) { setHasReceivedRealtimeData(false); return; }
    if (!userId) { setHasReceivedRealtimeData(false); return; }

    setHasReceivedRealtimeData(false);

    // Initial fetch
    supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data: rows }) => {
        const videos = (rows ?? []).map(mapRow);
        setHasReceivedRealtimeData(true);
        queryClient.setQueryData(queryKey, videos);
        try {
          sessionStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify({ data: videos, timestamp: Date.now() }));
        } catch {}
      });

    // Listen for any INSERT/UPDATE/DELETE on this user's videos
    const channel = supabase
      .channel(`videos_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'videos',
        filter: `user_id=eq.${userId}`,
      }, () => {
        // Re-fetch on any change to keep data consistent
        supabase
          .from('videos')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .then(({ data: rows }) => {
            const videos = (rows ?? []).map(mapRow);
            queryClient.setQueryData(queryKey, videos);
            try {
              sessionStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify({ data: videos, timestamp: Date.now() }));
            } catch {}
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, realTime]);

  const videoQuery = useQuery({
    queryKey,
    initialData: initialCachedData,
    queryFn: async () => {
      if (!userId || realTime) return [];

      const { data: rows, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const videos = (rows ?? []).map(mapRow);

      try {
        sessionStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify({ data: videos, timestamp: Date.now() }));
      } catch {}

      return videos;
    },
    enabled: !!userId && !realTime,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const filteredVideos = options?.status
    ? videoQuery.data?.filter(v => v.status === options.status)
    : videoQuery.data;

  return {
    data: filteredVideos,
    isLoading: realTime ? !hasReceivedRealtimeData && !videoQuery.data?.length : videoQuery.isLoading,
    error: videoQuery.error,
    isError: videoQuery.isError,
    refetch: videoQuery.refetch,
    isFetching: videoQuery.isFetching,
    isSuccess: videoQuery.isSuccess,
  };
}

export function useVideo(videoId: string | undefined) {
  const { data: videos, isLoading } = useVideos();
  return { data: videos?.find(v => v.id === videoId), isLoading, error: null };
}

export function useVideoStats() {
  const { data: videos, ...rest } = useVideos();
  return {
    ...rest,
    data: {
      total: videos?.length || 0,
      completed: videos?.filter(v => v.status === 'completed').length || 0,
      processing: videos?.filter(v => v.status === 'processing').length || 0,
      error: videos?.filter(v => v.status === 'error' || v.status === 'failed').length || 0,
      totalDuration: videos?.reduce((sum, v) => sum + (v.videoInfo?.duration || 0), 0) || 0,
      totalSize: videos?.reduce((sum, v) => sum + (v.videoInfo?.size || 0), 0) || 0,
    },
  };
}

export function clearVideosCache(userId: string) {
  try { sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`); } catch {}
}

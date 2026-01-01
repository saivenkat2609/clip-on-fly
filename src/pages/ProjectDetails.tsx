import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPreviewModal } from "@/components/VideoPreviewModal";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { YouTubePostModal } from "@/components/YouTubePostModal";
import { TemplateSelectionModal } from "@/components/TemplateSelectionModal";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Download, Eye, Loader2, AlertCircle, Calendar, Clock, Youtube, ThumbsUp, ThumbsDown, Filter, ArrowUpDown, Palette, RefreshCw, CheckCircle2, Circle, ArrowDownToLine, MessageSquare, Sparkles, Video, Edit3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Template, templates } from "@/lib/templates";
import { useTemplateReprocess } from "@/hooks/useTemplateReprocess";
import { useVideoStatus } from "@/hooks/useWebSocket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants, fadeInVariants, bounceVariants } from "@/lib/animations";
import { celebrateSuccess } from "@/lib/confetti";
import { VideoEditorModal } from "@/components/VideoEditor";

interface VideoClip {
  clipIndex: number;
  downloadUrl: string;
  s3Key: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
  title?: string;
  virality_score?: number;
  score_breakdown?: {
    hook: number;
    flow: number;
    engagement: number;
    trend: number;
  };
  liked?: boolean;
  disliked?: boolean;
  edited?: boolean;
  templateId?: string;
  template_id?: string;  // Also support snake_case from backend
  template_name?: string;  // NEW: Template name from backend
}

interface Video {
  id: string;
  sessionId: string;
  youtubeUrl: string;
  projectName: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: any;
  completedAt?: any;
  videoInfo?: {
    title?: string;
    duration?: number;
    thumbnail?: string;
  };
  clips?: VideoClip[];
  error?: string;
}

type FilterType = "all" | "liked" | "disliked" | "edited" | "short";
type SortType = "virality" | "chronological";

export default function ProjectDetails() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI/UX FIX #96: Validate route parameter
  if (!sessionId || sessionId.trim() === '') {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Session</h1>
            <p className="text-muted-foreground mb-6">The video session ID is missing or invalid.</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // UI/UX FIX #97: Validate navigation state before using
  const navigationState = (() => {
    const state = location.state;
    if (state && typeof state === 'object' && !Array.isArray(state)) {
      return state as { videoTitle?: string; videoThumbnail?: string; initialStatus?: string };
    }
    return null;
  })();
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string; index: number } | null>(null);
  const [youtubePostClip, setYoutubePostClip] = useState<{ url: string; title: string; index: number } | null>(null);

  // Video Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorClip, setEditorClip] = useState<{ url: string; title: string; index: number; editorState?: any } | null>(null);

  // Template state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedClipForTemplate, setSelectedClipForTemplate] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<'Free' | 'Starter' | 'Professional'>('Free');

  // Filter and Sort state
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("chronological");

  // Template reprocess hook
  const { reprocessClip, isReprocessing } = useTemplateReprocess();

  // Real-time WebSocket updates for progress
  const wsEnabled = !!sessionId && (!video || video?.status === 'processing');

  console.log('[ProjectDetails] WebSocket Config:', {
    sessionId,
    hasVideo: !!video,
    videoStatus: video?.status,
    wsEnabled,
    timestamp: new Date().toISOString()
  });

  const { status: wsStatus, progress: wsProgress, isConnected } = useVideoStatus({
    sessionId: sessionId || '',
    // Enable WebSocket if we have a sessionId and video is processing OR still loading
    enabled: wsEnabled,
    onComplete: (data) => {
      console.log('[ProjectDetails] 🎉 WebSocket: Processing complete event received', data);
      // No need to refetch - Firestore listener will automatically update the UI
    },
    onProgress: (data) => {
      console.log('[ProjectDetails] 📊 WebSocket: Progress update', {
        status: data.status,
        progress: data.data?.progress,
        fullData: data
      });
    },
    onError: (data) => {
      console.error('[ProjectDetails] ❌ WebSocket: Error received', data);
    }
  });

  // Log WebSocket state changes
  useEffect(() => {
    console.log('[ProjectDetails] 🔄 WebSocket State Changed:', {
      wsStatus,
      wsProgress,
      isConnected,
      currentStageIndex: getCurrentStageIndex(),
      timestamp: new Date().toISOString()
    });
  }, [wsStatus, wsProgress, isConnected]);

  // Fetch user plan
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserPlan = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserPlan(userData.plan || 'Free');
        }
      } catch (err) {
        console.error("Error fetching user plan:", err);
      }
    };

    fetchUserPlan();
  }, [currentUser]);

  // Real-time Firestore listener for video updates
  useEffect(() => {
    if (!currentUser || !sessionId) {
      setLoading(false);
      return;
    }

    console.log(`[ProjectDetails] Setting up real-time listener for session: ${sessionId}`);

    const videoRef = doc(db, `users/${currentUser.uid}/videos`, sessionId);
    let previousClipsCount = 0;

    // Try to get cached data first for instant display
    const tryGetCachedVideo = async () => {
      try {
        const cacheKey = `user_videos_${currentUser.uid}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data: videos } = JSON.parse(cached);
          const cachedVideo = videos?.find((v: Video) => v.id === sessionId);
          if (cachedVideo) {
            console.log('[ProjectDetails] Found cached video data - showing immediately');
            setVideo(cachedVideo);
            setLoading(false);
            previousClipsCount = cachedVideo.clips?.length || 0;
            return true;
          }
        }
      } catch (error) {
        console.error('[ProjectDetails] Error reading cache:', error);
      }
      return false;
    };

    // Try cache first
    tryGetCachedVideo();

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      videoRef,
      (videoSnap) => {
        if (videoSnap.exists()) {
          const videoData = {
            id: videoSnap.id,
            ...videoSnap.data()
          } as Video;

          const currentClipsCount = videoData.clips?.length || 0;

          console.log(`[ProjectDetails] Video data updated:`, {
            status: videoData.status,
            clipsCount: currentClipsCount,
            hasClips: currentClipsCount > 0,
            previousClipsCount
          });

          // Show toast and confetti when clips are first added
          if (currentClipsCount > 0 && previousClipsCount === 0) {
            console.log(`[ProjectDetails] ✓ Clips loaded! Showing ${currentClipsCount} clips`);
            toast.success(`Processing complete! ${currentClipsCount} clips generated`);
            // Celebrate with confetti!
            setTimeout(() => celebrateSuccess(), 500);
          }

          previousClipsCount = currentClipsCount;
          setVideo(videoData);
          setLoading(false);
          setError("");
        } else {
          console.error("[ProjectDetails] Video not found");
          setError("Video not found");
          setLoading(false);
        }
      },
      (err) => {
        console.error("[ProjectDetails] Firestore listener error:", err);
        setError("Failed to load video details");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("[ProjectDetails] Cleaning up Firestore listener");
      unsubscribe();
    };
  }, [currentUser, sessionId]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle like/dislike
  const handleLike = async (clipIndex: number) => {
    if (!currentUser || !sessionId || !video) return;

    const updatedClips = video.clips?.map((clip) => {
      if (clip.clipIndex === clipIndex) {
        return {
          ...clip,
          liked: !clip.liked,
          disliked: clip.liked ? clip.disliked : false, // Remove dislike if liking
        };
      }
      return clip;
    });

    try {
      const videoRef = doc(db, `users/${currentUser.uid}/videos`, sessionId);
      await updateDoc(videoRef, { clips: updatedClips });
      setVideo({ ...video, clips: updatedClips });
      toast.success(updatedClips?.find(c => c.clipIndex === clipIndex)?.liked ? "Clip liked" : "Like removed");
    } catch (err) {
      console.error("Error updating like:", err);
      toast.error("Failed to update like");
    }
  };

  const handleDislike = async (clipIndex: number) => {
    if (!currentUser || !sessionId || !video) return;

    const updatedClips = video.clips?.map((clip) => {
      if (clip.clipIndex === clipIndex) {
        return {
          ...clip,
          disliked: !clip.disliked,
          liked: clip.disliked ? clip.liked : false, // Remove like if disliking
        };
      }
      return clip;
    });

    try {
      const videoRef = doc(db, `users/${currentUser.uid}/videos`, sessionId);
      await updateDoc(videoRef, { clips: updatedClips });
      setVideo({ ...video, clips: updatedClips });
      toast.success(updatedClips?.find(c => c.clipIndex === clipIndex)?.disliked ? "Clip disliked" : "Dislike removed");
    } catch (err) {
      console.error("Error updating dislike:", err);
      toast.error("Failed to update dislike");
    }
  };

  // Handle template selection and reprocessing
  const handleTemplateSelect = async (template: Template) => {
    if (!currentUser || !sessionId || !video || selectedClipForTemplate === null) return;

    // Store clip index before clearing state
    const clipIndex = selectedClipForTemplate;

    // Close modal immediately
    setSelectedClipForTemplate(null);
    setTemplateModalOpen(false);

    try {
      // Call reprocess API (this will take ~60 seconds)
      const result = await reprocessClip({
        session_id: sessionId,
        clip_index: clipIndex,
        template_id: template.id,
      });

      // When processing completes, update BOTH template name AND video URL
      if (result) {
        console.log('[ProjectDetails] Reprocessing completed, updating UI with fresh video and template name');

        // Generate aggressive cache-busting URL
        const cacheBuster = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        let freshUrl = result.download_url;
        const separator = freshUrl.includes('?') ? '&' : '?';
        freshUrl = `${freshUrl}${separator}_v=${cacheBuster}&_r=${randomId}`;

        // Update with new template name AND video URL
        const updatedClips = video.clips?.map((clip) => {
          if (clip.clipIndex === clipIndex) {
            return {
              ...clip,
              templateId: result.template_id, // Update template ID from result
              template_id: result.template_id, // Also set snake_case for consistency
              template_name: result.template_name, // Update template name from result (snake_case to match UI)
              downloadUrl: freshUrl, // Aggressively cache-busted URL
              s3Key: result.s3_clip_key,
              edited: true, // Mark clip as edited
              lastUpdated: new Date().toISOString(), // Add timestamp to force refresh
              reprocessedAt: cacheBuster, // Track reprocessing timestamp
            };
          }
          return clip;
        });

        // Update Firestore
        const videoRef = doc(db, `users/${currentUser.uid}/videos`, sessionId);
        await updateDoc(videoRef, { clips: updatedClips });

        // Force immediate UI update with new video and template name
        setVideo({ ...video, clips: updatedClips });

        console.log('[ProjectDetails] ✅ UI updated with new video URL and template:', result.template_name);
      }
    } catch (err) {
      console.error("Error applying template:", err);
      // Error toast is already shown by the reprocessClip hook
    }
  };

  const openTemplateModal = (clipIndex: number) => {
    setSelectedClipForTemplate(clipIndex);
    setTemplateModalOpen(true);
  };

  // Filter clips
  const filterClips = (clips: VideoClip[]) => {
    if (activeFilters.includes("all")) return clips;

    return clips.filter((clip) => {
      if (activeFilters.includes("liked") && clip.liked) return true;
      if (activeFilters.includes("disliked") && clip.disliked) return true;
      if (activeFilters.includes("edited") && clip.edited) return true;
      if (activeFilters.includes("short") && clip.duration && clip.duration < 180) return true;
      return false;
    });
  };

  // Sort clips
  const sortClips = (clips: VideoClip[]) => {
    const sorted = [...clips];
    if (sortBy === "virality") {
      return sorted.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));
    }
    // chronological (by clipIndex)
    return sorted.sort((a, b) => a.clipIndex - b.clipIndex);
  };

  // Apply filters and sorting
  const getFilteredAndSortedClips = () => {
    if (!video?.clips) return [];
    const filtered = filterClips(video.clips);
    return sortClips(filtered);
  };

  const filteredClips = getFilteredAndSortedClips();

  // Handle filter toggle
  const toggleFilter = (filter: FilterType) => {
    if (filter === "all") {
      setActiveFilters(["all"]);
    } else {
      setActiveFilters((prev) => {
        const withoutAll = prev.filter((f) => f !== "all");
        if (withoutAll.includes(filter)) {
          const newFilters = withoutAll.filter((f) => f !== filter);
          return newFilters.length === 0 ? ["all"] : newFilters;
        }
        return [...withoutAll, filter];
      });
    }
  };

  // Determine video title based on loading state
  const getVideoTitle = () => {
    if (loading) {
      // During loading, use navigation state if available (from just uploaded video)
      if (navigationState?.videoTitle) {
        return navigationState.videoTitle;
      }
      // Otherwise show generic placeholder
      return sessionId ? `Video ${sessionId.substring(0, 8)}` : 'Loading...';
    }

    if (!video) {
      return 'Video Not Found';
    }

    // After loading, prioritize real titles
    if (video.videoInfo?.title) {
      return video.videoInfo.title;
    }

    if (video.projectName && video.projectName !== "Untitled Project") {
      return video.projectName;
    }

    // For completed videos without a title, show "Untitled Video" (not session ID)
    return "Untitled Video";
  };

  const videoTitle = getVideoTitle();

  // Processing stages configuration
  const processingStages = [
    { id: 'downloading', label: 'Downloading', icon: ArrowDownToLine, color: 'text-blue-500' },
    { id: 'transcribing', label: 'Transcribing', icon: MessageSquare, color: 'text-purple-500' },
    { id: 'detecting', label: 'Detecting Clips', icon: Sparkles, color: 'text-yellow-500' },
    { id: 'processing_clips', label: 'Processing Clips', icon: Video, color: 'text-green-500' },
  ];

  // Map numeric status codes to stage IDs
  const mapStatusToStageId = (status: any): string | null => {
    // If status is already a string, return it directly
    if (typeof status === 'string') {
      return status;
    }

    // Map numeric status codes to stage IDs
    const statusMap: { [key: number]: string } = {
      10: 'downloading',
      20: 'transcribing',
      30: 'detecting',       // Transcription complete, moving to detection
      40: 'processing_clips'
    };

    return statusMap[status] || null;
  };

  // Determine which stage is currently active
  const getCurrentStageIndex = () => {
    // ALWAYS show downloading stage when video is processing (even without WebSocket)
    if (video?.status === 'processing') {
      if (!wsStatus || wsStatus === 'pending') {
        console.log('[ProjectDetails] Video is processing, showing downloading stage');
        return 0; // Show downloading by default
      }

      // Convert status to stage ID (handles both numeric and string statuses)
      const stageId = mapStatusToStageId(wsStatus);

      if (!stageId) {
        console.log('[ProjectDetails] Unknown status:', wsStatus, '→ Defaulting to downloading');
        return 0; // Default to downloading if unknown status
      }

      const stageIndex = processingStages.findIndex(stage => stage.id === stageId);
      console.log('[ProjectDetails] WebSocket status:', wsStatus, '→ Stage ID:', stageId, '→ Stage index:', stageIndex);
      return stageIndex >= 0 ? stageIndex : 0; // Default to downloading if not found
    }

    return -1; // Not processing
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header - Always visible */}
        <div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {loading ? (
            /* Show minimal loading state with title and processing stages if from navigation */
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{videoTitle}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge className="bg-blue-500 text-white">
                    {navigationState?.initialStatus === 'processing' ? 'Processing' : 'Loading...'}
                  </Badge>
                </div>
              </div>

              {/* Show processing stages immediately if we know it's processing */}
              {navigationState?.initialStatus === 'processing' ? (
                <Card className="border-border/40 overflow-hidden shadow-lg">
                  <CardContent className="p-0">
                    {/* Header with subtle styling */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-border/40">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground">
                            Processing Your Video
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <p className="text-sm text-muted-foreground">
                              {isConnected ? 'Connected' : 'Connecting...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vertical Stepper - Similar to Reference Image */}
                    <div className="p-8 bg-white dark:bg-slate-950">
                      <div className="relative">
                        {processingStages.map((stage, index) => {
                          const StageIcon = stage.icon;
                          const isCompleted = index < currentStageIndex;
                          const isActive = index === currentStageIndex;
                          const isPending = index > currentStageIndex;

                          return (
                            <div
                              key={stage.id}
                              className="relative flex items-start gap-4 pb-8 last:pb-0"
                            >
                              {/* Vertical connecting line */}
                              {index < processingStages.length - 1 && (
                                <div className="absolute left-5 top-12 w-0.5 h-full">
                                  {/* Background line */}
                                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />

                                  {/* Animated progress line */}
                                  <div
                                    className={`absolute inset-0 transition-all duration-1000 origin-top ${
                                      isCompleted
                                        ? 'bg-emerald-500 scale-y-100'
                                        : 'bg-emerald-500 scale-y-0'
                                    }`}
                                  />
                                </div>
                              )}

                              {/* Step indicator circle */}
                              <div className="relative flex-shrink-0 z-10">
                                {/* Active pulse ring */}
                                {isActive && (
                                  <div className="absolute -inset-1 bg-blue-500/20 rounded-full animate-pulse" />
                                )}

                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isCompleted
                                      ? 'bg-emerald-500 text-white shadow-md'
                                      : isActive
                                      ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/50'
                                      : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : isActive ? (
                                    <StageIcon className="h-5 w-5" />
                                  ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                  )}
                                </div>
                              </div>

                              {/* Step content */}
                              <div className="flex-1 pt-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs font-medium uppercase tracking-wider ${
                                      isCompleted
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-400 dark:text-slate-600'
                                    }`}
                                  >
                                    Step {index + 1}
                                  </span>
                                  {isActive && (
                                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                  )}
                                </div>
                                <h4
                                  className={`font-semibold transition-all duration-300 ${
                                    isCompleted
                                      ? 'text-foreground'
                                      : isActive
                                      ? 'text-foreground text-base'
                                      : 'text-slate-400 dark:text-slate-600'
                                  }`}
                                >
                                  {stage.label}
                                </h4>
                                {isActive && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Processing now...
                                  </p>
                                )}
                                {isCompleted && (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                    ✓ Completed
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer - Clean */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-3 border-t border-border/40">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span className="text-slate-600 dark:text-slate-400">
                            {isConnected ? 'Connected' : 'Connecting...'}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-500 text-xs">
                          Clips will appear as they're ready
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Loading video details...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : error || !video ? (
            /* Show error state */
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Video not found"}</AlertDescription>
            </Alert>
          ) : (
            /* Show full video details */
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{videoTitle}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {video.createdAt?.toDate
                        ? video.createdAt.toDate().toLocaleDateString()
                        : new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {video.videoInfo?.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(video.videoInfo.duration)}</span>
                    </div>
                  )}
                  <Badge
                    className={`${
                      video.status === 'completed'
                        ? 'bg-green-500'
                        : video.status === 'processing'
                        ? 'bg-blue-500'
                        : video.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    } text-white`}
                  >
                    {video.status === 'completed'
                      ? `${video.clips?.length || 0} clips`
                      : video.status}
                  </Badge>
                </div>
              </div>

              {video.status === 'failed' && video.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{video.error}</AlertDescription>
                </Alert>
              )}

              {video.status === 'processing' && (
                <Card className="border-border/40 overflow-hidden shadow-lg">
                  <CardContent className="p-0">
                    {/* Header with subtle styling */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-border/40">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground">
                            Processing Your Video
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <p className="text-sm text-muted-foreground">
                              {isConnected ? 'Connected' : 'Connecting...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vertical Stepper - Similar to Reference Image */}
                    <div className="p-8 bg-white dark:bg-slate-950">
                      <div className="relative">
                        {processingStages.map((stage, index) => {
                          const StageIcon = stage.icon;
                          const isCompleted = index < currentStageIndex;
                          const isActive = index === currentStageIndex;
                          const isPending = index > currentStageIndex;

                          return (
                            <div
                              key={stage.id}
                              className="relative flex items-start gap-4 pb-8 last:pb-0"
                            >
                              {/* Vertical connecting line */}
                              {index < processingStages.length - 1 && (
                                <div className="absolute left-5 top-12 w-0.5 h-full">
                                  {/* Background line */}
                                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />

                                  {/* Animated progress line */}
                                  <div
                                    className={`absolute inset-0 transition-all duration-1000 origin-top ${
                                      isCompleted
                                        ? 'bg-emerald-500 scale-y-100'
                                        : 'bg-emerald-500 scale-y-0'
                                    }`}
                                  />
                                </div>
                              )}

                              {/* Step indicator circle */}
                              <div className="relative flex-shrink-0 z-10">
                                {/* Active pulse ring */}
                                {isActive && (
                                  <div className="absolute -inset-1 bg-blue-500/20 rounded-full animate-pulse" />
                                )}

                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isCompleted
                                      ? 'bg-emerald-500 text-white shadow-md'
                                      : isActive
                                      ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/50'
                                      : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : isActive ? (
                                    <StageIcon className="h-5 w-5" />
                                  ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                  )}
                                </div>
                              </div>

                              {/* Step content */}
                              <div className="flex-1 pt-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs font-medium uppercase tracking-wider ${
                                      isCompleted
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-400 dark:text-slate-600'
                                    }`}
                                  >
                                    Step {index + 1}
                                  </span>
                                  {isActive && (
                                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                  )}
                                </div>
                                <h4
                                  className={`font-semibold transition-all duration-300 ${
                                    isCompleted
                                      ? 'text-foreground'
                                      : isActive
                                      ? 'text-foreground text-base'
                                      : 'text-slate-400 dark:text-slate-600'
                                  }`}
                                >
                                  {stage.label}
                                </h4>
                                {isActive && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Processing now...
                                  </p>
                                )}
                                {isCompleted && (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                    ✓ Completed
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer - Clean */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-3 border-t border-border/40">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span className="text-slate-600 dark:text-slate-400">
                            {isConnected ? 'Connected' : 'Connecting...'}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-500 text-xs">
                          Clips will appear as they're ready
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Clips Grid - Only show when video is loaded and completed */}
        {!loading && video && video.status === 'completed' && video.clips && video.clips.length > 0 && (
          <div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold">
                All Clips ({filteredClips.length}/{video.clips.length})
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {!activeFilters.includes("all") && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.includes("all")}
                      onCheckedChange={() => toggleFilter("all")}
                    >
                      All Clips
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.includes("liked")}
                      onCheckedChange={() => toggleFilter("liked")}
                    >
                      <ThumbsUp className="h-3 w-3 mr-2" />
                      Liked
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.includes("disliked")}
                      onCheckedChange={() => toggleFilter("disliked")}
                    >
                      <ThumbsDown className="h-3 w-3 mr-2" />
                      Disliked
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.includes("edited")}
                      onCheckedChange={() => toggleFilter("edited")}
                    >
                      Edited
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.includes("short")}
                      onCheckedChange={() => toggleFilter("short")}
                    >
                      Short (&lt;3min)
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chronological">Chronological</SelectItem>
                    <SelectItem value="virality">Virality Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filteredClips.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clips match your filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filter settings to see more clips
                </p>
                <Button onClick={() => setActiveFilters(["all"])} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {filteredClips.map((clip, index) => (
                <motion.div
                  key={clip.clipIndex}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card
                    className="group overflow-hidden shadow-medium hover:shadow-large transition-shadow h-full"
                  >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <VideoThumbnail
                      key={`${clip.clipIndex}-${clip.reprocessedAt || clip.lastUpdated || clip.downloadUrl}`}
                      videoUrl={clip.downloadUrl}
                      alt={clip.title || `${videoTitle} - Clip ${clip.clipIndex + 1}`}
                      onClick={() => {
                        setPreviewVideo({
                          url: clip.downloadUrl,
                          title: clip.title || `${videoTitle} - Clip ${clip.clipIndex + 1}`,
                          index: clip.clipIndex
                        });
                      }}
                      showPlayButton={true}
                    />
                    <Badge className="absolute top-2 right-2 z-10 bg-black/70 text-white">
                      Clip {clip.clipIndex + 1}
                    </Badge>
                    {clip.virality_score !== undefined && (
                      <div className="absolute top-2 left-2 z-10 text-sm font-semibold text-white drop-shadow-lg">
                        🔥 {clip.virality_score}
                      </div>
                    )}
                    {/* Like/Dislike overlay buttons */}
                    <div className="absolute bottom-2 left-2 z-10 flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(clip.clipIndex);
                        }}
                        className="transition-all"
                        title="Like"
                      >
                        <ThumbsUp className={`h-5 w-5 transition-all drop-shadow-lg ${
                          clip.liked
                            ? 'fill-primary text-primary scale-110'
                            : 'text-white hover:scale-110'
                        }`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDislike(clip.clipIndex);
                        }}
                        className="transition-all"
                        title="Dislike"
                      >
                        <ThumbsDown className={`h-5 w-5 transition-all drop-shadow-lg ${
                          clip.disliked
                            ? 'fill-slate-500 text-slate-500 scale-110'
                            : 'text-white hover:scale-110'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {clip.title || `Clip ${clip.clipIndex + 1}`}
                    </h3>
                    {/* {clip.score_breakdown && (
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-2">
                        <div>Hook: {clip.score_breakdown.hook}</div>
                        <div>Flow: {clip.score_breakdown.flow}</div>
                        <div>Engagement: {clip.score_breakdown.engagement}</div>
                        <div>Trend: {clip.score_breakdown.trend}</div>
                      </div>
                    )} */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
                      {clip.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(clip.duration)}</span>
                        </div>
                      )}
                      {(clip.templateId || clip.template_id) && (
                        <Badge variant="secondary" className="text-xs">
                          <Palette className="h-2.5 w-2.5 mr-1" />
                          {clip.template_name || templates.find(t => t.id === (clip.templateId || clip.template_id))?.name || 'Custom'}
                        </Badge>
                      )}
                      {isReprocessing(clip.clipIndex) && (
                        <Badge variant="outline" className="text-xs animate-pulse">
                          <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
                          Applying Template...
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button
                        onClick={() => {
                          setEditorClip({
                            url: clip.downloadUrl,
                            title: clip.title || `${videoTitle} - Clip ${clip.clipIndex + 1}`,
                            index: clip.clipIndex,
                            editorState: (clip as any).editorState,
                          });
                          setEditorOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <a
                        href={clip.downloadUrl}
                        download
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </a>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button
                        onClick={() => openTemplateModal(clip.clipIndex)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={isReprocessing(clip.clipIndex)}
                      >
                        {isReprocessing(clip.clipIndex) ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Palette className="h-3 w-3 mr-1" />
                            Template
                          </>
                        )}
                      </Button>
                    </div>
                    <div>
                      <Button
                        onClick={() => setYoutubePostClip({
                          url: clip.downloadUrl,
                          title: clip.title || `${videoTitle} - Clip ${clip.clipIndex + 1}`,
                          index: clip.clipIndex
                        })}
                        variant="default"
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Youtube className="h-3 w-3 mr-1" />
                        Post to YouTube
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <VideoPreviewModal
          key={previewVideo.url}
          open={!!previewVideo}
          onOpenChange={(open) => !open && setPreviewVideo(null)}
          videoUrl={previewVideo.url}
          videoTitle={previewVideo.title}
          clipIndex={previewVideo.index}
        />
      )}

      {/* YouTube Post Modal */}
      {youtubePostClip && (
        <YouTubePostModal
          open={!!youtubePostClip}
          onOpenChange={(open) => !open && setYoutubePostClip(null)}
          videoUrl={youtubePostClip.url}
          defaultTitle={youtubePostClip.title}
          clipIndex={youtubePostClip.index}
        />
      )}

      {/* Template Selection Modal */}
      {templateModalOpen && selectedClipForTemplate !== null && (
        <TemplateSelectionModal
          open={templateModalOpen}
          onClose={() => {
            setTemplateModalOpen(false);
            setSelectedClipForTemplate(null);
          }}
          onSelectTemplate={handleTemplateSelect}
          currentTemplateId={video?.clips?.find(c => c.clipIndex === selectedClipForTemplate)?.templateId}
          userPlan={userPlan}
        />
      )}

      {/* Video Editor Modal - Always mount but control open state */}
      <VideoEditorModal
        open={editorOpen && !!editorClip}
        onClose={() => {
          setEditorOpen(false);
          setEditorClip(null);
        }}
        videoUrl={editorClip?.url || ''}
        videoTitle={editorClip?.title || ''}
        clipIndex={editorClip?.index || 0}
        sessionId={sessionId || ''}
        existingEditorState={editorClip?.editorState}
        onExportComplete={(newUrl) => {
          console.log('[ProjectDetails] Video editor export complete:', newUrl);
          // Video will be updated via Firestore listener
          setEditorOpen(false);
          setEditorClip(null);
        }}
      />
    </AppLayout>
  );
}

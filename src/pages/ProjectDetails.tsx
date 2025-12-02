import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPreviewModal } from "@/components/VideoPreviewModal";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { YouTubePostModal } from "@/components/YouTubePostModal";
import { TemplateSelectionModal } from "@/components/TemplateSelectionModal";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Download, Eye, Loader2, AlertCircle, Calendar, Clock, Youtube, ThumbsUp, ThumbsDown, Filter, ArrowUpDown, Palette } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Template } from "@/lib/templates";
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
  const { currentUser } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string; index: number } | null>(null);
  const [youtubePostClip, setYoutubePostClip] = useState<{ url: string; title: string; index: number } | null>(null);

  // Template state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedClipForTemplate, setSelectedClipForTemplate] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<'Free' | 'Starter' | 'Professional'>('Free');

  // Filter and Sort state
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("chronological");

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

  useEffect(() => {
    if (!currentUser || !sessionId) {
      setLoading(false);
      return;
    }

    const fetchVideo = async () => {
      try {
        const videoRef = doc(db, `users/${currentUser.uid}/videos`, sessionId);
        const videoSnap = await getDoc(videoRef);

        if (videoSnap.exists()) {
          setVideo({
            id: videoSnap.id,
            ...videoSnap.data()
          } as Video);
        } else {
          setError("Video not found");
        }
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to load video details");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
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

  // Handle template selection
  const handleTemplateSelect = async (template: Template) => {
    if (!currentUser || !sessionId || !video || selectedClipForTemplate === null) return;

    const updatedClips = video.clips?.map((clip) => {
      if (clip.clipIndex === selectedClipForTemplate) {
        return {
          ...clip,
          templateId: template.id,
          edited: true // Mark clip as edited
        };
      }
      return clip;
    });

    try {
      const videoRef = doc(db, `users/${currentUser.uid}/videos`, sessionId);
      await updateDoc(videoRef, { clips: updatedClips });
      setVideo({ ...video, clips: updatedClips });
      setSelectedClipForTemplate(null);
    } catch (err) {
      console.error("Error updating template:", err);
      toast.error("Failed to apply template");
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !video) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Video not found"}</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  const videoTitle = video.videoInfo?.title || (video.projectName !== "Untitled Project" ? video.projectName : null) || `Video ${video.sessionId.substring(0, 8)}`;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

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
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Your video is being processed. Clips will appear here when ready.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Clips Grid */}
        {video.status === 'completed' && video.clips && video.clips.length > 0 && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClips.map((clip) => (
                <Card
                  key={clip.clipIndex}
                  className="group overflow-hidden shadow-medium hover:shadow-large transition-smooth"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <VideoThumbnail
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
                      <Badge
                        className={`absolute top-2 left-2 z-10 ${
                          clip.virality_score >= 80
                            ? 'bg-green-500'
                            : clip.virality_score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        } text-white`}
                      >
                        🔥 {clip.virality_score}
                      </Badge>
                    )}
                    {/* Status badges */}
                    <div className="absolute bottom-2 left-2 z-10 flex gap-1">
                      {clip.liked && (
                        <Badge className="bg-green-500 text-white text-xs">
                          <ThumbsUp className="h-2.5 w-2.5 fill-current" />
                        </Badge>
                      )}
                      {clip.disliked && (
                        <Badge className="bg-red-500 text-white text-xs">
                          <ThumbsDown className="h-2.5 w-2.5 fill-current" />
                        </Badge>
                      )}
                      {clip.edited && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          Edited
                        </Badge>
                      )}
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      {clip.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(clip.duration)}</span>
                        </div>
                      )}
                      {/* {clip.startTime !== undefined && (
                        <span className="text-xs">
                          {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
                        </span>
                      )} */}
                    </div>
                    {/* Like/Dislike Buttons */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        onClick={() => handleLike(clip.clipIndex)}
                        variant={clip.liked ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 ${clip.liked ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                      >
                        <ThumbsUp className={`h-3 w-3 mr-1 ${clip.liked ? 'fill-current' : ''}`} />
                        Like
                      </Button>
                      <Button
                        onClick={() => handleDislike(clip.clipIndex)}
                        variant={clip.disliked ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 ${clip.disliked ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
                      >
                        <ThumbsDown className={`h-3 w-3 mr-1 ${clip.disliked ? 'fill-current' : ''}`} />
                        Dislike
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPreviewVideo({
                          url: clip.downloadUrl,
                          title: clip.title || `${videoTitle} - Clip ${clip.clipIndex + 1}`,
                          index: clip.clipIndex
                        })}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
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
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => openTemplateModal(clip.clipIndex)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        {clip.templateId ? 'Change Template' : 'Apply Template'}
                      </Button>
                      <Button
                        onClick={() => setYoutubePostClip({
                          url: clip.downloadUrl,
                          title: clip.title || `${videoTitle} - Clip ${clip.clipIndex + 1}`,
                          index: clip.clipIndex
                        })}
                        variant="default"
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Youtube className="h-3 w-3 mr-1" />
                        Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <VideoPreviewModal
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
    </AppLayout>
  );
}

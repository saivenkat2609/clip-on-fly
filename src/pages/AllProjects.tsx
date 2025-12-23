import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Calendar, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVideos } from "@/hooks/useVideos";

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

export default function AllProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Use cached videos hook with shared listener
  const { data: videos = [], isLoading: loading, error: queryError } = useVideos();
  const [error, setError] = useState("");

  // Set error from query if any
  if (queryError && !error) {
    setError("Failed to load videos. Please try again.");
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">All Projects</h1>
              <p className="text-muted-foreground">
                {loading ? "Loading..." : `${videos.length} total projects`}
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Projects Grid */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first video to start creating clips
                </p>
                <Button
                  onClick={() => navigate('/upload')}
                  className="gradient-primary"
                >
                  Upload Video
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className="group overflow-hidden shadow-soft hover:shadow-large transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30 rounded-xl"
                  onClick={() => navigate(`/project/${video.sessionId}`)}
                >
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                    {/* Smart Thumbnail: YouTube for YT videos, first frame for uploads */}
                    <VideoThumbnail
                      // For YouTube videos: Use YouTube thumbnail
                      youtubeUrl={video.youtubeUrl}
                      youtubeThumbnail={video.videoInfo?.thumbnail}
                      // For uploaded videos: Use first clip frame as fallback
                      videoUrl={video.status === 'completed' && video.clips && video.clips.length > 0
                        ? video.clips[0].downloadUrl
                        : undefined}
                      alt={video.videoInfo?.title || (video.projectName !== "Untitled Project" ? video.projectName : null) || `Video ${video.sessionId.substring(0, 8)}`}
                      showPlayButton={true}
                    />

                    {/* Status Badge - Sleeker design */}
                    <Badge
                      className={`absolute top-3 right-3 z-10 text-xs font-semibold px-2.5 py-1 shadow-lg backdrop-blur-sm border ${
                        video.status === 'completed'
                          ? 'bg-green-500/90 border-green-400/50'
                          : video.status === 'processing'
                          ? 'bg-blue-500/90 border-blue-400/50'
                          : video.status === 'failed'
                          ? 'bg-red-500/90 border-red-400/50'
                          : 'bg-gray-500/90 border-gray-400/50'
                      } text-white`}
                    >
                      {video.status === 'completed'
                        ? `${video.clips?.length || 0} ${video.clips?.length === 1 ? 'clip' : 'clips'}`
                        : video.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[2.5rem]">
                      {video.videoInfo?.title || (video.projectName !== "Untitled Project" ? video.projectName : null) || `Video ${video.sessionId.substring(0, 8)}`}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {video.createdAt?.toDate
                          ? video.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {video.status === 'failed' && video.error && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/60">
                        <p className="text-xs text-destructive line-clamp-2 font-medium">{video.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

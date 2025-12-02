import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Calendar, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for user's videos
    const videosRef = collection(db, `users/${currentUser.uid}/videos`);
    const q = query(videosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const videosData: Video[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Video));

        setVideos(videosData);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Error fetching videos:", err);
        setError("Failed to load videos. Please try again.");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className="group overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/50"
                  onClick={() => navigate(`/project/${video.sessionId}`)}
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {/* Show clip thumbnail for completed videos, YouTube thumbnail for others */}
                    {video.status === 'completed' && video.clips && video.clips.length > 0 ? (
                      <VideoThumbnail
                        videoUrl={video.clips[0].downloadUrl}
                        alt={video.videoInfo?.title || (video.projectName !== "Untitled Project" ? video.projectName : null) || `Video ${video.sessionId.substring(0, 8)}`}
                        showPlayButton={true}
                      />
                    ) : video.videoInfo?.thumbnail ? (
                      <img
                        src={video.videoInfo.thumbnail}
                        alt={video.videoInfo.title || video.projectName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white/70 group-hover:scale-110 transition-transform" />
                      </div>
                    )}

                    <Badge
                      className={`absolute top-2 right-2 z-10 text-xs ${
                        video.status === 'completed'
                          ? 'bg-green-500'
                          : video.status === 'processing'
                          ? 'bg-blue-500'
                          : video.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      } text-white shadow-sm`}
                    >
                      {video.status === 'completed'
                        ? `${video.clips?.length || 0} clips`
                        : video.status}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                      {video.videoInfo?.title || (video.projectName !== "Untitled Project" ? video.projectName : null) || `Video ${video.sessionId.substring(0, 8)}`}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {video.createdAt?.toDate
                          ? video.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {video.status === 'failed' && video.error && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-red-500 line-clamp-1">{video.error}</p>
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

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Play, Clock, Calendar, Loader2, AlertCircle, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "https://your-api-gateway-url.amazonaws.com/prod";

interface VideoClip {
  clip_index: number;
  download_url: string;
  s3_key: string;
}

interface Video {
  session_id: string;
  status: string;
  clips_count: number;
  video_info?: {
    title?: string;
    duration?: number;
  };
  created_at: string;
  clips?: VideoClip[];
}

const projects = [
  {
    id: 1,
    title: "Marketing Webinar Highlights",
    thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=225&fit=crop",
    duration: "45:30",
    clips: 8,
    date: "2 days ago",
    status: "completed"
  },
  {
    id: 2,
    title: "Product Demo Session",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop",
    duration: "28:15",
    clips: 5,
    date: "1 week ago",
    status: "completed"
  },
  {
    id: 3,
    title: "Podcast Episode #42",
    thumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=225&fit=crop",
    duration: "1:12:45",
    clips: 12,
    date: "2 weeks ago",
    status: "completed"
  },
  {
    id: 4,
    title: "Interview with CEO",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=225&fit=crop",
    duration: "35:20",
    clips: 6,
    date: "3 weeks ago",
    status: "completed"
  },
  {
    id: 5,
    title: "Tutorial Series Compilation",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop",
    duration: "52:10",
    clips: 10,
    date: "1 month ago",
    status: "completed"
  },
  {
    id: 6,
    title: "Live Stream Recap",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=225&fit=crop",
    duration: "2:15:30",
    clips: 15,
    date: "1 month ago",
    status: "completed"
  }
];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchUserVideos();
    }
  }, [currentUser]);

  const fetchUserVideos = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_ENDPOINT}/user/${currentUser.uid}/videos`);

      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err: any) {
      setError(err.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">Manage and edit your video projects</p>
          </div>
          <Link to="/upload">
            <Button size="lg" className="gradient-primary shadow-medium">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Videos",
              value: loading ? "..." : videos.length.toString(),
              change: `${videos.filter(v => v.status === 'completed').length} completed`
            },
            {
              label: "Clips Generated",
              value: loading ? "..." : videos.reduce((sum, v) => sum + (v.clips_count || 0), 0).toString(),
              change: "Total clips"
            },
            {
              label: "Processing",
              value: loading ? "..." : videos.filter(v => v.status === 'processing').length.toString(),
              change: "Videos in queue"
            },
            {
              label: "This Month",
              value: loading ? "..." : videos.filter(v => {
                const date = new Date(v.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length.toString(),
              change: "Videos processed"
            }
          ].map((stat) => (
            <Card key={stat.label} className="shadow-soft">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Projects</h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first video to start creating clips
                </p>
                <Link to="/upload">
                  <Button className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card
                  key={video.session_id}
                  className="group overflow-hidden shadow-medium hover:shadow-large transition-smooth"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Play className="h-16 w-16 text-white/80" />
                    </div>
                    <Badge
                      className={`absolute top-2 right-2 ${
                        video.status === 'completed'
                          ? 'bg-green-500'
                          : video.status === 'processing'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                      } text-white`}
                    >
                      {video.status === 'completed' ? `${video.clips_count} clips` : video.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">
                      {video.video_info?.title || `Video ${video.session_id.substring(0, 8)}`}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {video.status === 'completed' && video.clips && video.clips.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Download Clips:</p>
                        <div className="flex flex-wrap gap-2">
                          {video.clips.map((clip) => (
                            <a
                              key={clip.clip_index}
                              href={clip.download_url}
                              download
                              className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Clip {clip.clip_index + 1}
                            </a>
                          ))}
                        </div>
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

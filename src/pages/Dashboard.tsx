import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { UploadHero } from "@/components/UploadHero";
import { FAQSection } from "@/components/FAQSection";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Play, Calendar, Loader2, AlertCircle, Bell, AlertTriangle, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useVideos } from "@/hooks/useVideos";
import { useUserPlanRealtime, useUserProfileRealtime } from "@/hooks/useUserProfile";
import { useVideoStatus } from "@/hooks/useWebSocket";
import { useRemainingCredits } from "@/hooks/useRemainingCredits";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants, fadeInVariants, shakeVariants } from "@/lib/animations";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Skeleton } from "@/components/ui/skeleton";

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

interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
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
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Use cached hooks - ONLY Dashboard gets real-time updates for video processing status
  const { data: videos = [], isLoading: loading, error: queryError, isError, refetch } = useVideos({ realTime: true });

  // Debug logging
  useEffect(() => {
    console.log('[Dashboard] Videos data:', {
      videos,
      count: videos.length,
      loading,
      error: queryError,
      currentUser: currentUser?.uid
    });
  }, [videos, loading, queryError, currentUser]);

  const { data: userProfile } = useUserProfileRealtime();
  const { plan: userPlan = "Free", totalCredits = 30, creditsExpiryDate, isLoading: loadingCredits } = useUserPlanRealtime();

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  // Get processing videos for WebSocket connection
  const processingVideos = useMemo(
    () => videos.filter(v => v.status === 'processing' || v.status === 'pending'),
    [videos]
  );

  // WebSocket for real-time Lambda updates
  const { isConnected, status: wsStatus, progress: wsProgress } = useVideoStatus({
    sessionId: processingVideos[0]?.sessionId || '',
    enabled: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true' && processingVideos.length > 0,
    onProgress: (data) => {
      console.log('📡 Processing progress:', data);
      // Firestore listener will automatically pick up status updates
    },
    onComplete: (data) => {
      console.log('✅ Processing complete:', data);
      // Firestore listener will automatically refresh the video
    },
    onError: (data) => {
      console.error('❌ Processing error:', data);
    }
  });

  // Convert Firestore timestamp or ISO string to Date
  const creditsExpiry = useMemo(() => {
    if (!creditsExpiryDate) return null;

    // Handle Firestore Timestamp
    if (creditsExpiryDate?.toDate) {
      return creditsExpiryDate.toDate();
    }

    // Handle ISO string from cache
    if (typeof creditsExpiryDate === 'string') {
      return new Date(creditsExpiryDate);
    }

    return null;
  }, [creditsExpiryDate]);

  // Check if subscription has expired
  const isSubscriptionExpired = useMemo(() => {
    if (!creditsExpiry || userPlan === 'Free') return false;
    return creditsExpiry < new Date();
  }, [creditsExpiry, userPlan]);

  // Display plan - show "Free" if subscription expired
  const displayPlan = isSubscriptionExpired ? 'Free' : userPlan;

  // Set error from query if any
  if (queryError && !error) {
    setError("Failed to load videos. Please try again.");
  }

  // Notifications listener - ONLY for admin users
  useEffect(() => {
    if (!currentUser || !isAdmin) return;

    const notificationsRef = collection(db, `users/${currentUser.uid}/notifications`);
    const notifQuery = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribeNotifications = onSnapshot(
      notifQuery,
      (snapshot) => {
        const notificationsData: Notification[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));

        setNotifications(notificationsData);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
      }
    );

    return () => unsubscribeNotifications();
  }, [currentUser, isAdmin]);

  // Use shared hook for credits calculation
  const remainingCredits = useRemainingCredits();

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Calculate days until credits expire
  const getDaysUntilExpiry = () => {
    if (!creditsExpiry) return null;
    const now = new Date();
    const diffTime = creditsExpiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Critical Error Display (when entire videos fetch fails) */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h2 className="text-2xl font-bold mb-2">Failed to Load Videos</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {queryError?.message || 'An error occurred while fetching your videos. Please try again.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => refetch()}
                    variant="default"
                    size="lg"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Page
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  If this problem persists, please contact support.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* General Error Alert (for non-critical errors) */}
        <AnimatePresence mode="wait">
          {error && !isError && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              variants={shakeVariants}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Live Connection Indicator - ONLY visible for admin users */}
            {isAdmin && import.meta.env.VITE_ENABLE_WEBSOCKET === 'true' && processingVideos.length > 0 && (
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={`${
                  isConnected
                    ? 'bg-green-500/10 text-green-600 border-green-500/30'
                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30'
                } ml-2`}
              >
                {isConnected ? '🟢 Live' : '🔴 Offline'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications - ONLY visible for admin users */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadNotifications > 0 && (
                      <Badge variant="secondary">{unreadNotifications} new</Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <DropdownMenuItem
                          key={notif.id}
                          className={`flex flex-col items-start p-3 cursor-pointer ${
                            !notif.read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2 w-full">
                            <div
                              className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                                notif.type === 'success'
                                  ? 'bg-green-500'
                                  : notif.type === 'error'
                                  ? 'bg-red-500'
                                  : notif.type === 'warning'
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notif.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notif.createdAt?.toDate
                                  ? notif.createdAt.toDate().toLocaleString()
                                  : new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Credits Display with Hover Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1.5 px-3 py-2 h-auto hover:bg-accent"
                >
                  <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-bold">
                    {loadingCredits ? "..." : <AnimatedCounter value={remainingCredits} duration={0.8} />}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 space-y-4">
                  {/* Plan Info */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{displayPlan} Plan</span>
                    <Badge variant="secondary" className={isSubscriptionExpired ? "bg-gray-500/10 text-gray-600 border-gray-500/20" : "bg-green-500/10 text-green-600 border-green-500/20"}>
                      {isSubscriptionExpired ? "Expired" : "Active"}
                    </Badge>
                  </div>

                  {/* Credits Info */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Credits</span>
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-bold">
                          {remainingCredits.toLocaleString()} / {totalCredits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {remainingCredits} minutes remaining
                    </p>
                    {daysUntilExpiry !== null && (
                      <p className="text-xs text-muted-foreground">
                        Renews on {creditsExpiry?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate('/billing')}
                      className="w-full gradient-primary"
                    >
                      Add more credits
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // TODO: Navigate to credits info page or open modal
                        console.log("Learn how credits work");
                      }}
                    >
                      Learn how credits work
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Add More Credits Button */}
            <Button
              onClick={() => navigate('/billing')}
              size="lg"
              className="gradient-primary shadow-medium"
            >
              {/* <Plus className="h-5 w-5 mr-2" /> */}
              Add Credits
            </Button>
          </div>
        </div>

        {/* Upload Hero Section */}
        <UploadHero />

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Videos",
              value: loading ? "..." : videos.length.toString(),
              change: `${videos.filter(v => v.status === 'completed').length} completed`
            },
            {
              label: "Clips Generated",
              value: loading ? "..." : videos.reduce((sum, v) => sum + (v.clips?.length || 0), 0).toString(),
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
                if (!v.createdAt) return false;
                const date = v.createdAt.toDate ? v.createdAt.toDate() : new Date(v.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length.toString(),
              change: "Videos processed"
            }
          ].map((stat) => (
            <Card key={stat.label} className="shadow-soft border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div> */}

        {/* Projects Grid */}
        <div>
          <h2 className="text-lg font-bold mb-3">Recent Projects</h2>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5"
            >
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </motion.div>
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
            <>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {videos.slice(0, 8).map((video, index) => (
                <motion.div
                  key={video.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card
                    className="group overflow-hidden shadow-soft hover:shadow-large transition-shadow duration-300 cursor-pointer border-border/50 hover:border-primary/30 rounded-xl h-full"
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
                </motion.div>
                ))}
              </motion.div>

              {/* Show More Button - Sleeker design */}
              {videos.length > 8 && (
                <motion.div
                  className="flex justify-center mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <Button
                    onClick={() => navigate('/projects')}
                    variant="outline"
                    size="lg"
                    className="gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all shadow-sm hover:shadow-md"
                  >
                    View All Projects ({videos.length})
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* FAQ Section */}
        <FAQSection />
      </div>
    </AppLayout>
  );
}

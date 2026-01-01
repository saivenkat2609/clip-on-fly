// Updated UploadHero component that uses Cloudflare Worker
// This version bypasses R2 CORS issues by uploading through a Worker proxy

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Link as LinkIcon, Sparkles, Type, Crop, Loader2, FileVideo, X, Palette, CheckCircle2, Clock, Smartphone, Monitor, Youtube, Layers } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { apiClient } from "@/lib/apiClient";
import { TemplateSelectionModal } from "@/components/TemplateSelectionModal";
import { templates, Template } from "@/lib/templates";
import { useRemainingCredits } from "@/hooks/useRemainingCredits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInVariants, bounceVariants, slideUpVariants } from "@/lib/animations";

const WORKER_UPLOAD_URL = import.meta.env.VITE_WORKER_UPLOAD_URL; // Cloudflare Worker URL

// Generate UUID (simplified version)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fetch YouTube video metadata using oEmbed API
async function fetchYouTubeMetadata(url: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }

    const data = await response.json();
    return {
      title: data.title || 'Untitled Video',
      thumbnail: data.thumbnail_url || '',
      author: data.author_name || '',
    };
  } catch (error) {
    console.error('[YouTube] Failed to fetch metadata:', error);
    return {
      title: 'Untitled Video',
      thumbnail: '',
      author: '',
    };
  }
}

export function UploadHero() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUrlError, setShowUrlError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use shared credits calculation hook
  const remainingCredits = useRemainingCredits();

  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('prof-modern-minimal');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<'Free' | 'Starter' | 'Professional'>('Free');

  // Resolution and timeframe state
  const [selectedResolution, setSelectedResolution] = useState<'9:16' | '16:9'>('9:16');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('auto'); // 'auto', '15', '30', '60'
  const [selectedNumClips, setSelectedNumClips] = useState<string>('4'); // '1', '2', '4', '6'

  // SECURITY FIX: Enhanced YouTube URL validation to prevent injection attacks
  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;

    // Remove whitespace
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return false;

    // YouTube URL patterns - must be exactly 11 characters for video ID
    // Supports:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://m.youtube.com/watch?v=VIDEO_ID
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/,
      /^https?:\/\/youtu\.be\/[\w-]{11}$/,
      /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]{11}$/,
    ];

    // Check if URL matches any valid pattern
    return youtubePatterns.some(pattern => pattern.test(trimmedUrl));
  };

  const handleQuickProcess = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube or Twitch URL to continue",
        variant: "destructive",
      });
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to process videos",
        variant: "destructive",
      });
      return;
    }

    // Check credits
    if (remainingCredits <= 0) {
      toast({
        title: "Credit Limit Reached",
        description: "Please upgrade your plan to continue processing videos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Fetch YouTube video metadata instantly
      const metadata = await fetchYouTubeMetadata(videoUrl);
      const projectName = metadata.title;

      // SECURE: Use API client with automatic JWT token injection
      // user_id and user_email are extracted from the verified JWT token on the backend
      const data = await apiClient.post('/process', {
        youtube_url: videoUrl,
        project_name: projectName,
        template_id: selectedTemplateId,  // Template selection
        aspect_ratio: selectedResolution,  // Resolution (9:16 or 16:9)
        timeframe: selectedTimeframe,  // 'auto', '15', '30', '60'
        num_clips: parseInt(selectedNumClips),  // Number of clips to generate
        startFrom: "download"
      });

      const sessionId = data.session_id;

      // Create video document in Firestore with real video metadata
      const videoDocRef = doc(db, `users/${currentUser.uid}/videos`, sessionId);
      await setDoc(videoDocRef, {
        sessionId: sessionId,
        youtubeUrl: videoUrl,
        projectName: projectName,
        status: "processing",
        createdAt: serverTimestamp(),
        videoInfo: {
          title: metadata.title,
          thumbnail: metadata.thumbnail,
          author: metadata.author,
        },
        // Processing settings
        settings: {
          templateId: selectedTemplateId,
          aspectRatio: selectedResolution,
          timeframe: selectedTimeframe,
          numClips: parseInt(selectedNumClips),
        },
        clips: [],
        error: null
      });

      // Increment user's totalVideos count
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        totalVideos: increment(1)
      });

      toast({
        title: "Processing started!",
        description: `Processing: ${projectName}`,
      });

      // Clear the input
      setVideoUrl("");

      // Navigate to project page with video metadata in state
      navigate(`/project/${sessionId}`, {
        state: {
          videoTitle: projectName,
          videoThumbnail: metadata.thumbnail,
          initialStatus: 'processing'
        }
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to start video processing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a video file (MP4, MOV, AVI, WebM, MKV)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5GB max)
    const maxSize = 5 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a video smaller than 5GB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File Selected",
      description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    });
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file first",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to upload videos",
        variant: "destructive",
      });
      return;
    }

    // Check credits
    if (remainingCredits <= 0) {
      toast({
        title: "Credit Limit Reached",
        description: "Please upgrade your plan to continue processing videos.",
        variant: "destructive",
      });
      return;
    }

    if (!WORKER_UPLOAD_URL) {
      toast({
        title: "Configuration Error",
        description: "Worker upload URL not configured. Please add VITE_WORKER_UPLOAD_URL to .env",
        variant: "destructive",
      });
      console.error("[Upload] VITE_WORKER_UPLOAD_URL not set in environment variables");
      return;
    }

    setUploadingFile(true);

    try {
      // Generate session ID on frontend
      const session_id = generateUUID();

      console.log(`[Upload] Starting upload via Cloudflare Worker...`);
      console.log(`[Upload] Session ID: ${session_id}`);
      console.log(`[Upload] Worker URL: ${WORKER_UPLOAD_URL}`);
      console.log(`[Upload] File details:`, {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });

      // Step 1: Upload directly to Cloudflare Worker
      toast({
        title: "Uploading...",
        description: `Uploading ${selectedFile.name} to storage`,
      });

      const uploadResponse = await fetch(`${WORKER_UPLOAD_URL}/upload/${session_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
          "X-Session-Id": session_id,
          "X-User-Id": currentUser.uid,
        },
        body: selectedFile,
      }).catch(err => {
        console.error("[Upload] Worker fetch error:", err);
        throw new Error(`Failed to connect to upload service: ${err.message}`);
      });

      console.log(`[Upload] Worker response status: ${uploadResponse.status}`);

      if (!uploadResponse.ok) {
        let errorData;
        try {
          errorData = await uploadResponse.json();
        } catch (e) {
          const text = await uploadResponse.text();
          console.error("[Upload] Worker error response:", text);
          throw new Error(`Upload failed (${uploadResponse.status}): ${text}`);
        }
        throw new Error(errorData.error || `Upload failed (${uploadResponse.status})`);
      }

      const uploadData = await uploadResponse.json();
      console.log(`[Upload] File uploaded successfully to Worker:`, uploadData);

      const s3_key = uploadData.s3_key || `${session_id}/uploaded_video.mp4`;

      // Step 2: Start processing via API Gateway
      console.log(`[Upload] Starting processing...`);

      // SECURE: Use API client with automatic JWT token injection
      // user_id and user_email are extracted from the verified JWT token on the backend
      const processData = await apiClient.post('/upload/start', {
        session_id: session_id,
        videoTitle: selectedFile.name.replace(/\.[^/.]+$/, ""),
        videoDescription: "Uploaded from dashboard",
        s3_key: s3_key,
        template_id: selectedTemplateId,  // Template selection
        aspect_ratio: selectedResolution,  // Resolution (9:16 or 16:9)
        timeframe: selectedTimeframe,  // 'auto', '15', '30', '60'
        num_clips: parseInt(selectedNumClips),  // Number of clips to generate
      });

      console.log(`[Upload] Processing started:`, processData);

      // Step 3: Create video document in Firestore
      const videoDocRef = doc(db, `users/${currentUser.uid}/videos`, session_id);
      await setDoc(videoDocRef, {
        sessionId: session_id,
        youtubeUrl: "",
        projectName: selectedFile.name.replace(/\.[^/.]+$/, ""),
        status: "processing",
        createdAt: serverTimestamp(),
        videoInfo: {
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          duration: 0,
          description: "Uploaded from dashboard",
          thumbnail: "",
        },
        // Processing settings
        settings: {
          templateId: selectedTemplateId,
          aspectRatio: selectedResolution,
          timeframe: selectedTimeframe,
          numClips: parseInt(selectedNumClips),
        },
        s3VideoKey: s3_key,
        uploadedFile: true,
        clips: [],
        error: null
      });

      // Increment user's totalVideos count
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        totalVideos: increment(1)
      });

      toast({
        title: "Upload Successful!",
        description: `Processing: ${selectedFile.name.replace(/\.[^/.]+$/, "")}`,
      });

      // Clear the selected file
      clearSelectedFile();

      // Navigate to project page with video metadata in state
      navigate(`/project/${session_id}`, {
        state: {
          videoTitle: selectedFile.name.replace(/\.[^/.]+$/, ""),
          initialStatus: 'processing'
        }
      });

    } catch (err: any) {
      console.error("[Upload] Error:", err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <Card className="shadow-large border-border/50 overflow-hidden">
        <CardContent className="p-8 md:p-10">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Main Content Box */}
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-2xl p-6 md:p-8 border border-border/40 shadow-sm hover:shadow-md transition-shadow">

              {/* Input Section with integrated button */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-8 z-10">
                      <svg
                        className="w-7 h-7 fill-red-600"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <Input
                      placeholder="Paste your YouTube URL here..."
                      className={`h-14 pl-14 pr-4 text-base bg-background/60 border-border/60 hover:border-border/80 focus:border-primary/60 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 shadow-sm hover:shadow transition-all ${
                        showUrlError && videoUrl.trim() && !isValidYouTubeUrl(videoUrl) ? 'border-destructive/60 focus:border-destructive/60' : ''
                      }`}
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        // Show error only after user has typed something and it's invalid
                        if (e.target.value.trim() && !isValidYouTubeUrl(e.target.value)) {
                          setShowUrlError(true);
                        } else {
                          setShowUrlError(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading && remainingCredits > 0 && isValidYouTubeUrl(videoUrl)) {
                          handleQuickProcess();
                        }
                      }}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="h-14 px-8 gradient-primary text-base font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all rounded-xl"
                    onClick={handleQuickProcess}
                    disabled={loading || remainingCredits <= 0 || !isValidYouTubeUrl(videoUrl)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Clips
                      </>
                    )}
                  </Button>
                </div>

                {/* URL Validation Error Message */}
                <AnimatePresence>
                  {showUrlError && videoUrl.trim() && !isValidYouTubeUrl(videoUrl) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg"
                    >
                      <Youtube className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive font-medium">
                        Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Or separator */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-border/60"></div>
                  <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2">Or</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/60 to-border/60"></div>
                </div>

                {/* File input (hidden) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Selected file display */}
                <AnimatePresence mode="wait">
                  {selectedFile ? (
                    <motion.div
                      key="selected-file"
                      variants={slideUpVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <motion.div
                        variants={bounceVariants}
                        initial="initial"
                        animate="animate"
                        className="p-2 rounded-lg bg-primary/10"
                      >
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                        onClick={clearSelectedFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-primary flex-shrink-0 shadow-sm hover:shadow-md rounded-lg"
                        onClick={handleFileUpload}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Process File"
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    /* Upload button */
                    <motion.div
                      key="upload-button"
                      variants={fadeInVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-12 gap-2 bg-background/40 hover:bg-primary/10 border-border/60 hover:border-primary/40 text-foreground hover:text-primary transition-all shadow-sm hover:shadow-md rounded-xl group"
                        onClick={handleUploadClick}
                      >
                        <Upload className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Upload from Computer</span>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Compact Settings Row - Single line */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">

                {/* Template Selection Dropdown */}
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="h-9 w-[180px] bg-background/60 border-border/60">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Timeframe Dropdown - With Clock Icon */}
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="h-9 w-[120px] bg-background/60 border-border/60">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="15">15sec</SelectItem>
                    <SelectItem value="30">30sec</SelectItem>
                    <SelectItem value="60">60sec</SelectItem>
                  </SelectContent>
                </Select>

                {/* Number of Clips Dropdown - With Layers Icon */}
                <Select value={selectedNumClips} onValueChange={setSelectedNumClips}>
                  <SelectTrigger className="h-9 w-[120px] bg-background/60 border-border/60">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 clip</SelectItem>
                    <SelectItem value="2">2 clips</SelectItem>
                    <SelectItem value="4">4 clips</SelectItem>
                    <SelectItem value="6">6 clips</SelectItem>
                  </SelectContent>
                </Select>

                {/* Resolution Icon Buttons - Grouped Phone & Monitor icons */}
                <div className="flex border border-border/60 rounded-md overflow-hidden bg-background/60">
                  <Button
                    type="button"
                    variant={selectedResolution === '9:16' ? "default" : "ghost"}
                    size="sm"
                    className={`h-9 w-9 p-0 rounded-none border-0 ${
                      selectedResolution === '9:16'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    onClick={() => setSelectedResolution('9:16')}
                    title="9:16 Vertical (Mobile)"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                  <div className="w-px bg-border/60"></div>
                  <Button
                    type="button"
                    variant={selectedResolution === '16:9' ? "default" : "ghost"}
                    size="sm"
                    className={`h-9 w-9 p-0 rounded-none border-0 ${
                      selectedResolution === '16:9'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    onClick={() => setSelectedResolution('16:9')}
                    title="16:9 Horizontal (Desktop)"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </div>

                {/* Browse All Templates Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-2 bg-background/40 hover:bg-primary/10 border-border/60 hover:border-primary/40 text-foreground hover:text-primary transition-all shadow-sm hover:shadow-md rounded-xl group"
                  onClick={() => setTemplateModalOpen(true)}
                >
                  <Palette className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Browse Templates</span>
                </Button>
              </div>
            </div>

            {/* Features Grid - Using Theme Primary Color */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-5 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all group cursor-default">
                <div className="mb-3 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1 text-foreground">Viral Clips</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">AI finds engaging moments</p>
              </div>

              <div className="flex flex-col items-center text-center p-5 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all group cursor-default">
                <div className="mb-3 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Type className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1 text-foreground">Auto Captions</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Smart subtitle generation</p>
              </div>

              <div className="flex flex-col items-center text-center p-5 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all group cursor-default">
                <div className="mb-3 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Crop className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1 text-foreground">Smart Reframe</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Perfect crop every time</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelectTemplate={(template: Template) => {
          setSelectedTemplateId(template.id);
          setTemplateModalOpen(false);
        }}
        currentTemplateId={selectedTemplateId}
        userPlan={userPlan}
      />
    </div>
  );
}

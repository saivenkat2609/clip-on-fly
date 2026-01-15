import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, FileVideo, AlertCircle, Loader2, Sparkles, Type, Crop, X, CheckCircle2, Palette, Clock, Layers, Smartphone, Monitor, Youtube } from "lucide-react";
import { validateVideo, formatDuration, formatFileSize, VideoValidationResult } from "@/lib/videoValidator";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { apiClient } from "@/lib/apiClient";
import { useRemainingCredits } from "@/hooks/useRemainingCredits";
import { UsageWarningBanner } from "@/components/UsageWarningBanner";
import { TemplateSelectionModal } from "@/components/TemplateSelectionModal";
import { templates, Template } from "@/lib/templates";
import { useYouTubeValidation } from "@/hooks/useYouTubeValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInVariants, bounceVariants, slideUpVariants } from "@/lib/animations";

// Use proxy in development, direct URL in production
const WORKER_UPLOAD_URL = import.meta.env.MODE === 'development'
  ? '/upload-proxy'  // Use Vite proxy in development
  : import.meta.env.VITE_WORKER_UPLOAD_URL;  // Use direct URL in production

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fetch YouTube metadata
async function fetchYouTubeMetadata(url: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('Failed to fetch video metadata');
    const data = await response.json();
    return {
      title: data.title || 'Untitled Video',
      thumbnail: data.thumbnail_url || '',
      author: data.author_name || '',
    };
  } catch (error) {
    console.error('[YouTube] Failed to fetch metadata:', error);
    return { title: 'Untitled Video', thumbnail: '', author: '' };
  }
}

export default function Upload() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [validationStage, setValidationStage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video validation state
  const [validationResult, setValidationResult] = useState<VideoValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use shared credits calculation hook
  const remainingCredits = useRemainingCredits();

  // YouTube URL validation
  const youtubeValidation = useYouTubeValidation(videoUrl);

  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('prof-modern-minimal');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<'Free' | 'Starter' | 'Professional'>('Free');

  // Settings state
  const [selectedResolution, setSelectedResolution] = useState<'9:16' | '16:9'>('9:16');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('auto');
  const [selectedNumClips, setSelectedNumClips] = useState<string>('4');

  const handleQuickProcess = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube or Twitch URL to continue",
        variant: "destructive",
      });
      return;
    }

    // Check if validation is in progress
    if (youtubeValidation.isValidating) {
      toast({
        title: "Validation in Progress",
        description: "Please wait while we validate the video",
      });
      return;
    }

    // Check if URL is valid
    if (!youtubeValidation.isValid) {
      toast({
        title: "Invalid Video",
        description: youtubeValidation.error || "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be") && !videoUrl.includes("twitch.tv")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube or Twitch URL",
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
      setTimeout(() => navigate("/billing"), 2000);
      return;
    }

    // Check if user has enough credits for this video
    if (youtubeValidation.creditsRequired > remainingCredits) {
      toast({
        title: "Insufficient Credits",
        description: `This video requires ${youtubeValidation.creditsRequired} credits, but you only have ${remainingCredits} remaining.`,
        variant: "destructive",
      });
      setTimeout(() => navigate("/billing"), 2000);
      return;
    }

    setLoading(true);

    try {
      // Validation already done by hook - start processing immediately!
      setValidationStage("Starting video processing...");

      const metadata = await fetchYouTubeMetadata(videoUrl);
      const projectName = metadata.title;

      const data = await apiClient.post('/process', {
        youtube_url: videoUrl,
        project_name: projectName,
        template_id: selectedTemplateId,
        aspect_ratio: selectedResolution,
        timeframe: selectedTimeframe,
        num_clips: parseInt(selectedNumClips),
        startFrom: "download"
      });

      const sessionId = data.session_id;

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
        settings: {
          templateId: selectedTemplateId,
          aspectRatio: selectedResolution,
          timeframe: selectedTimeframe,
          numClips: parseInt(selectedNumClips),
        },
        clips: [],
        error: null
      });

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        totalVideos: increment(1)
      });

      toast({
        title: "Processing started!",
        description: `Processing: ${projectName}`,
      });

      setVideoUrl("");

      navigate(`/project/${sessionId}`, {
        state: {
          videoTitle: projectName,
          videoThumbnail: metadata.thumbnail,
          initialStatus: 'processing'
        }
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to start video processing";

      // Check for specific validation errors from backend
      if (errorMessage.includes("too long") || errorMessage.includes("maximum")) {
        toast({
          title: "Video Too Long",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (errorMessage.includes("too short") || errorMessage.includes("minimum")) {
        toast({
          title: "Video Too Short",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (errorMessage.includes("credit") || errorMessage.includes("quota")) {
        toast({
          title: "Insufficient Credits",
          description: errorMessage,
          variant: "destructive",
        });
        setTimeout(() => navigate("/billing"), 2000);
      } else if (errorMessage.includes("private") || errorMessage.includes("unavailable")) {
        toast({
          title: "Video Not Available",
          description: "This video is private, deleted, or restricted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setValidationStage("");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Validate video using HTML5 Video API
      const result = await validateVideo(file);
      setValidationResult(result);

      if (!result.isValid) {
        toast({
          title: "Video Validation Failed",
          description: result.errors[0],
          variant: "destructive",
        });
      } else if (result.warnings.length > 0) {
        toast({
          title: "Video Selected with Warnings",
          description: result.warnings[0],
        });
      } else {
        toast({
          title: "Video Validated Successfully",
          description: `${file.name} (${formatFileSize(result.metadata.size)}, ${formatDuration(result.metadata.duration)})`,
        });
      }
    } catch (error: any) {
      console.error('[Upload] Validation error:', error);
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate video",
        variant: "destructive",
      });
      setValidationResult({
        isValid: false,
        errors: [error.message || "Failed to validate video"],
        warnings: [],
        metadata: {
          duration: 0,
          width: 0,
          height: 0,
          size: file.size,
          type: file.type,
          canPlay: false
        }
      });
    } finally {
      setIsValidating(false);
    }
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

    // Check if video has been validated and is valid
    if (!validationResult || !validationResult.isValid) {
      toast({
        title: "Invalid Video",
        description: validationResult?.errors[0] || "Please select a valid video file",
        variant: "destructive",
      });
      return;
    }

    if (isValidating) {
      toast({
        title: "Validation In Progress",
        description: "Please wait for video validation to complete",
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

    if (!WORKER_UPLOAD_URL) {
      toast({
        title: "Configuration Error",
        description: "Worker upload URL not configured",
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
      setTimeout(() => navigate("/billing"), 2000);
      return;
    }

    setUploadingFile(true);

    try {
      const session_id = generateUUID();

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
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed (${uploadResponse.status})`);
      }

      const uploadData = await uploadResponse.json();
      const s3_key = uploadData.s3_key || `${session_id}/uploaded_video.mp4`;

      const processData = await apiClient.post('/upload/start', {
        session_id: session_id,
        videoTitle: selectedFile.name.replace(/\.[^/.]+$/, ""),
        videoDescription: "Uploaded from dashboard",
        s3_key: s3_key,
        template_id: selectedTemplateId,
        aspect_ratio: selectedResolution,
        timeframe: selectedTimeframe,
        num_clips: parseInt(selectedNumClips),
      });

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

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        totalVideos: increment(1)
      });

      toast({
        title: "Upload Successful!",
        description: `Processing: ${selectedFile.name.replace(/\.[^/.]+$/, "")}`,
      });

      clearSelectedFile();

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

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
          <p className="text-muted-foreground">Transform your long-form content into viral short clips</p>
        </div>

        {/* Usage Warning Banner */}
        <UsageWarningBanner />

        {/* Main Upload Card */}
        <Card className="shadow-lg border-border/50 overflow-hidden">
          <CardContent className="p-8">
            <div className="space-y-6">

              {/* YouTube URL Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">YouTube URL</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-8 z-10">
                      <Youtube className="h-5 w-5 text-red-600" />
                    </div>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-12 pl-12 pr-4 text-base bg-background/60 border-border/60 hover:border-border/80 focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/50 shadow-sm hover:shadow transition-all"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !loading &&
                          !youtubeValidation.isValidating &&
                          youtubeValidation.isValid
                        ) {
                          handleQuickProcess();
                        }
                      }}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="h-12 px-8 gradient-primary text-base font-semibold"
                    onClick={handleQuickProcess}
                    disabled={
                      loading ||
                      remainingCredits <= 0 ||
                      !youtubeValidation.isValid ||
                      youtubeValidation.isValidating ||
                      !youtubeValidation.hasEnoughCredits
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {validationStage || 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Clips
                      </>
                    )}
                  </Button>
                </div>

                {/* Validation Progress (shown when loading) */}
                <AnimatePresence mode="wait">
                  {loading && validationStage && (
                    <motion.div
                      variants={slideUpVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {validationStage}
                          </p>
                          {validationStage.includes("All checks passed") && (
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                              Preparing to start video processing...
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Validation Feedback */}
                <AnimatePresence mode="wait">
                  {videoUrl && !loading && (
                    <motion.div
                      key={
                        youtubeValidation.isValidating
                          ? 'validating'
                          : youtubeValidation.isValid
                          ? 'valid'
                          : 'error'
                      }
                      variants={slideUpVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="mt-3"
                    >
                      {/* Validating State */}
                      {youtubeValidation.isValidating && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                          <span className="text-sm text-blue-900 dark:text-blue-100">Validating video (checking duration and credits)...</span>
                        </div>
                      )}

                      {/* Valid State - Show Video Info */}
                      {!youtubeValidation.isValidating && youtubeValidation.isValid && youtubeValidation.videoInfo && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          {/* Thumbnail */}
                          {youtubeValidation.videoInfo.thumbnail && (
                            <img
                              src={youtubeValidation.videoInfo.thumbnail}
                              alt="Video thumbnail"
                              className="w-16 h-12 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                                  {youtubeValidation.videoInfo.title}
                                </p>
                                <div className="mt-1 text-xs text-green-700 dark:text-green-400">
                                  <span>By {youtubeValidation.videoInfo.author}</span>
                                  {youtubeValidation.videoInfo.duration > 0 && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>{youtubeValidation.videoInfo.durationFormatted}</span>
                                    </>
                                  )}
                                  {youtubeValidation.creditsRequired > 0 && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span className="font-medium">{youtubeValidation.creditsRequired} credits required</span>
                                    </>
                                  )}
                                </div>
                                {youtubeValidation.hasEnoughCredits && youtubeValidation.creditsRequired > 0 && (
                                  <p className="mt-1 text-xs text-green-600 dark:text-green-500 font-medium">
                                    ✓ Ready to process
                                  </p>
                                )}
                                {!youtubeValidation.hasEnoughCredits && youtubeValidation.creditsRequired > 0 && (
                                  <p className="mt-1 text-xs text-red-600 dark:text-red-500 font-medium">
                                    ⚠ Insufficient credits (need {youtubeValidation.creditsRequired}, have {remainingCredits})
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error State */}
                      {!youtubeValidation.isValidating && !youtubeValidation.isValid && youtubeValidation.error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                              {youtubeValidation.error}
                            </p>
                            {youtubeValidation.videoInfo && (
                              <div className="mt-1 text-xs text-red-700 dark:text-red-400">
                                Video: {youtubeValidation.videoInfo.title}
                                {youtubeValidation.creditsRequired > 0 && (
                                  <> • {youtubeValidation.creditsRequired} credits would be required</>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Upload File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {selectedFile ? (
                    <motion.div
                      key="selected-file"
                      variants={slideUpVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg"
                    >
                      <motion.div
                        variants={bounceVariants}
                        initial="initial"
                        animate="animate"
                        className="p-2 rounded-lg bg-primary/10"
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={clearSelectedFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-primary flex-shrink-0"
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
                        className="w-full h-12 gap-2 bg-background/40 hover:bg-primary/10 border-border/60 hover:border-primary/40 text-foreground hover:text-primary transition-all shadow-sm hover:shadow-md group"
                        onClick={handleUploadClick}
                      >
                        <UploadIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Click to upload (Max 5GB)</span>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Settings Section */}
              <div>
                <label className="text-sm font-medium mb-3 block">Processing Settings</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                  {/* Template Selector */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Template</label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Aspect Ratio</label>
                    <div className="flex border border-border rounded-md overflow-hidden h-10">
                      <Button
                        type="button"
                        variant={selectedResolution === '9:16' ? "default" : "ghost"}
                        size="sm"
                        className={`flex-1 h-full rounded-none border-0 ${
                          selectedResolution === '9:16'
                            ? 'bg-primary text-primary-foreground'
                            : ''
                        }`}
                        onClick={() => setSelectedResolution('9:16')}
                      >
                        <Smartphone className="h-4 w-4 mr-1.5" />
                        9:16
                      </Button>
                      <div className="w-px bg-border"></div>
                      <Button
                        type="button"
                        variant={selectedResolution === '16:9' ? "default" : "ghost"}
                        size="sm"
                        className={`flex-1 h-full rounded-none border-0 ${
                          selectedResolution === '16:9'
                            ? 'bg-primary text-primary-foreground'
                            : ''
                        }`}
                        onClick={() => setSelectedResolution('16:9')}
                      >
                        <Monitor className="h-4 w-4 mr-1.5" />
                        16:9
                      </Button>
                    </div>
                  </div>

                  {/* Timeframe Selector */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Clip Length</label>
                    <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                      <SelectTrigger className="h-10">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Number of Clips Selector */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Number of Clips</label>
                    <Select value={selectedNumClips} onValueChange={setSelectedNumClips}>
                      <SelectTrigger className="h-10">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
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
                  </div>
                </div>

                {/* Browse Templates Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => setTemplateModalOpen(true)}
                >
                  <Palette className="h-4 w-4" />
                  Browse All Templates
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

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
    </AppLayout>
  );
}

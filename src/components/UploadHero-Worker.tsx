// Updated UploadHero component that uses Cloudflare Worker
// This version bypasses R2 CORS issues by uploading through a Worker proxy

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Link as LinkIcon, Sparkles, Type, Crop, Loader2, FileVideo, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "https://your-api-gateway-url.amazonaws.com/prod";
const WORKER_UPLOAD_URL = import.meta.env.VITE_WORKER_UPLOAD_URL; // New: Cloudflare Worker URL

// Generate UUID (simplified version)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function UploadHero() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickProcess = async () => {
    // ... YouTube processing code (unchanged)
    // Keep existing handleQuickProcess implementation
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

      const processResponse = await fetch(`${API_ENDPOINT}/upload/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: session_id,
          user_id: currentUser.uid,
          user_email: currentUser.email || "",
          videoTitle: selectedFile.name.replace(/\.[^/.]+$/, ""),
          videoDescription: "Uploaded from dashboard",
          s3_key: s3_key,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || errorData.message || "Failed to start processing");
      }

      const processData = await processResponse.json();
      console.log(`[Upload] Processing started:`, processData);

      await supabase.from('videos').insert({
        user_id: currentUser.uid,
        session_id: session_id,
        youtube_url: '',
        project_name: selectedFile.name.replace(/\.[^/.]+$/, ''),
        status: 'processing',
        video_info: {
          title: selectedFile.name.replace(/\.[^/.]+$/, ''),
          duration: 0,
          description: 'Uploaded from dashboard',
          thumbnail: '',
        },
        s3_video_key: s3_key,
        uploaded_file: true,
        clips: [],
        error: null,
      });

      const { data: ud } = await supabase.from('users').select('total_videos').eq('id', currentUser.uid).single();
      await supabase.from('users').update({ total_videos: (ud?.total_videos ?? 0) + 1 }).eq('id', currentUser.uid);

      toast({
        title: "Upload Successful!",
        description: "Your video is being processed. Check recent projects below.",
      });

      // Clear the selected file
      clearSelectedFile();

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
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-2xl p-6 md:p-8 border border-border/30 shadow-sm">

              {/* Input Section with integrated button */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <LinkIcon className="h-5 w-5" />
                    </div>
                    <Input
                      placeholder="Paste your YouTube URL here..."
                      className="h-14 pl-12 pr-4 text-base bg-background/60 backdrop-blur-sm border-border/60 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/50 shadow-sm"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                          handleQuickProcess();
                        }
                      }}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="h-14 px-8 gradient-primary text-base font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={handleQuickProcess}
                    disabled={loading}
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

                {/* Or separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/50"></div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Or</span>
                  <div className="flex-1 h-px bg-border/50"></div>
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
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <FileVideo className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
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
                  </div>
                ) : (
                  /* Upload button */
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 gap-2 bg-background/40 hover:bg-background/60 border-border/60"
                    onClick={handleUploadClick}
                  >
                    <Upload className="h-5 w-5" />
                    Upload from Computer
                  </Button>
                )}
              </div>
            </div>

            {/* Features Grid - Different Layout */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all group">
                <div className="mb-3 p-3 rounded-full bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Viral Clips</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">AI finds engaging moments</p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/40 transition-all group">
                <div className="mb-3 p-3 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Type className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Auto Captions</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Smart subtitle generation</p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                <div className="mb-3 p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Crop className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Smart Reframe</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Perfect crop every time</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

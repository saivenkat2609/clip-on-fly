import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, Link as LinkIcon, FileVideo, AlertCircle, Loader2 } from "lucide-react";

// Replace this with your actual API Gateway endpoint URL
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "https://your-api-gateway-url.amazonaws.com/prod";

export default function Upload() {
  const [videoUrl, setVideoUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleProcessVideo = async () => {
    setError("");

    // Validation
    if (!videoUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be")) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    if (!currentUser) {
      setError("Please sign in to process videos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINT}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.dumps({
          youtube_url: videoUrl,
          user_id: currentUser.uid,
          user_email: currentUser.email || "",
          project_name: projectName || "Untitled Project"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start processing");
      }

      toast({
        title: "Processing started!",
        description: `Your video is being processed. Session ID: ${data.session_id.substring(0, 8)}...`,
      });

      // Navigate to dashboard to see processing status
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to start video processing");
      toast({
        title: "Error",
        description: err.message || "Failed to start video processing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
          <p className="text-muted-foreground">Upload your long-form content to start creating clips</p>
        </div>

        <Card className="shadow-large">
          <CardContent className="p-8">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="url">From URL</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-12 bg-muted/30 hover:bg-muted/50 transition-smooth cursor-pointer group text-center">
                    <UploadIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-smooth" />
                    <h3 className="text-xl font-semibold mb-2">Drop your video here</h3>
                    <p className="text-muted-foreground mb-4">
                      or click to browse files
                    </p>
                    <Button variant="outline" size="lg">
                      <FileVideo className="h-5 w-5 mr-2" />
                      Browse Files
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Supported formats: MP4, MOV, AVI, WebM (Max 5GB)
                    </p>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input 
                        id="project-name" 
                        placeholder="e.g., Marketing Webinar Q4" 
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input 
                        id="description" 
                        placeholder="Brief description of your video" 
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="url">
                <div className="space-y-6">
                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* URL Input */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="video-url">YouTube URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="video-url"
                          placeholder="https://youtube.com/watch?v=..."
                          className="flex-1"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Paste a YouTube video URL to automatically extract clips
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="project-name-url">Project Name (Optional)</Label>
                      <Input
                        id="project-name-url"
                        placeholder="e.g., Podcast Episode #42"
                        className="mt-2"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* URL Preview Placeholder */}
                  {videoUrl && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-6 text-center">
                        <FileVideo className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Ready to process: {videoUrl}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className="gradient-primary"
                onClick={handleProcessVideo}
                disabled={loading || !videoUrl}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Start Processing"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            {
              title: "Fast Processing",
              description: "Most videos process in 2-5 minutes"
            },
            {
              title: "AI Detection",
              description: "Automatically finds the best moments"
            },
            {
              title: "Full Control",
              description: "Edit and customize every clip"
            }
          ].map((item) => (
            <Card key={item.title} className="shadow-soft">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, Link as LinkIcon, FileVideo } from "lucide-react";

export default function Upload() {
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
                  {/* URL Input */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="video-url">Video URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input 
                          id="video-url" 
                          placeholder="https://youtube.com/watch?v=..." 
                          className="flex-1"
                        />
                        <Button>
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Supported platforms: YouTube, Vimeo, Google Drive, Dropbox
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="project-name-url">Project Name</Label>
                      <Input 
                        id="project-name-url" 
                        placeholder="e.g., Podcast Episode #42" 
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* URL Preview Placeholder */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-6 text-center">
                      <FileVideo className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Video preview will appear here after pasting URL
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
              <Button variant="outline" size="lg">
                Cancel
              </Button>
              <Button size="lg" className="gradient-primary">
                Start Processing
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

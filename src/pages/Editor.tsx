import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Download, 
  Maximize, 
  Volume2,
  Scissors,
  Type,
  Palette,
  Wand2,
  Sparkles
} from "lucide-react";

const clips = [
  { id: 1, time: "0:45", duration: "15s", title: "Opening Hook" },
  { id: 2, time: "3:20", duration: "22s", title: "Key Insight" },
  { id: 3, time: "7:15", duration: "18s", title: "Story Moment" },
  { id: 4, time: "12:40", duration: "25s", title: "Call to Action" },
  { id: 5, time: "18:05", duration: "20s", title: "Emotional Peak" }
];

export default function Editor() {
  return (
    <AppLayout>
      <div className="flex flex-col h-screen">
        {/* Top Bar */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-background/95 backdrop-blur">
          <div>
            <h2 className="font-semibold">Marketing Webinar Highlights</h2>
            <p className="text-sm text-muted-foreground">8 clips generated</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Scissors className="h-4 w-4 mr-2" />
              Split
            </Button>
            <Button className="gradient-primary">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col p-6 overflow-auto">
            {/* Video Preview */}
            <Card className="mb-6 shadow-large">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&h=450&fit=crop" 
                    alt="Video preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="lg" variant="secondary" className="rounded-full h-16 w-16">
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  <Badge className="absolute top-4 right-4 bg-primary">
                    9:16 Vertical
                  </Badge>
                </div>
                
                {/* Video Controls */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <Button size="sm" variant="ghost">
                      <Play className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                      <Slider defaultValue={[33]} max={100} step={1} />
                    </div>
                    <span className="text-sm text-muted-foreground min-w-[80px] text-right">
                      0:45 / 2:30
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button size="sm" variant="ghost">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">16:9</Button>
                      <Button size="sm" variant="default">9:16</Button>
                      <Button size="sm" variant="outline">1:1</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-medium">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Timeline</h3>
                  <Button size="sm" variant="ghost">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Add Clip
                  </Button>
                </div>
                <div className="space-y-2">
                  {clips.map((clip) => (
                    <div 
                      key={clip.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-smooth cursor-pointer group"
                    >
                      <div className="w-20 aspect-video bg-primary/20 rounded overflow-hidden flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{clip.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {clip.time} • {clip.duration}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-smooth">
                        <Scissors className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Controls */}
          <div className="w-80 border-l border-border bg-muted/30 p-6 overflow-auto">
            <Tabs defaultValue="style" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="style">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="text">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Wand2 className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Video Style</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Modern Minimal
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Bold & Energetic
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Professional
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Playful
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Colors</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {['bg-primary', 'bg-accent', 'bg-destructive', 'bg-muted', 'bg-foreground'].map((color) => (
                      <button
                        key={color}
                        className={`aspect-square rounded-lg ${color} hover:scale-110 transition-smooth`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Captions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-captions">Auto Captions</Label>
                      <Switch id="auto-captions" defaultChecked />
                    </div>
                    <div>
                      <Label>Font Style</Label>
                      <div className="space-y-2 mt-2">
                        <Button variant="outline" className="w-full justify-start font-bold">
                          Bold Impact
                        </Button>
                        <Button variant="outline" className="w-full justify-start font-serif">
                          Elegant Serif
                        </Button>
                        <Button variant="outline" className="w-full justify-start font-mono">
                          Modern Mono
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Caption Position</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Button variant="outline" size="sm">Top</Button>
                        <Button variant="default" size="sm">Center</Button>
                        <Button variant="outline" size="sm">Bottom</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">AI Features</h3>
                  <div className="space-y-4">
                    <Card className="shadow-soft">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="enhance-audio">Enhance Audio</Label>
                          <Switch id="enhance-audio" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Remove background noise and balance levels
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-soft">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="auto-broll">Auto B-Roll</Label>
                          <Switch id="auto-broll" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Insert relevant stock footage automatically
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-soft">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="smart-crop">Smart Crop</Label>
                          <Switch id="smart-crop" defaultChecked />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Keep speaker centered in frame
                        </p>
                      </CardContent>
                    </Card>

                    <Button className="w-full gradient-primary">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate More Clips
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

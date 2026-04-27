import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Youtube, Instagram, Zap } from "lucide-react";
import { YouTubeConnection } from "@/components/YouTubeConnection";

export default function Social() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1">Social Accounts</h1>
          <p className="text-muted-foreground">Connect your social platforms to publish clips directly.</p>
        </div>

        {/* YouTube */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <Youtube className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-base font-semibold">YouTube</h2>
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-200">
              <Zap className="h-3 w-3 mr-1" />
              Available
            </Badge>
          </div>
          <YouTubeConnection />
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
              <Instagram className="h-4 w-4 text-pink-500" />
            </div>
            <h2 className="text-base font-semibold">Instagram</h2>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </div>
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-5 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
                <Instagram className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm mb-1">Instagram Integration</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Publish Reels and Stories directly from your clips. We're working on bringing Instagram publishing to the platform.
                </CardDescription>
              </div>
              <Badge variant="outline" className="flex-shrink-0 text-xs text-muted-foreground">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

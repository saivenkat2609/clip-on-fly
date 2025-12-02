import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPreview } from "./VideoPreview";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface VideoPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  videoTitle: string;
  clipIndex: number;
}

export function VideoPreviewModal({
  open,
  onOpenChange,
  videoUrl,
  videoTitle,
  clipIndex,
}: VideoPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold pr-8">
              {videoTitle} - Clip {clipIndex + 1}
            </DialogTitle>
          </div>

          {/* Action buttons above video */}
          <div className="flex items-center gap-2 pb-2">
            <a href={videoUrl} download className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download Video
              </Button>
            </a>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogHeader>

        {/* Video player */}
        <div className="w-full rounded-lg overflow-hidden shadow-medium bg-black">
          <VideoPreview src={videoUrl} />
        </div>

        {/* Helper text */}
        <p className="text-sm text-muted-foreground text-center">
          Use player controls to play, pause, and adjust volume. Click "Download Video" to save locally.
        </p>
      </DialogContent>
    </Dialog>
  );
}

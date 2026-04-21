import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, CheckCircle2 } from 'lucide-react';
import { useEditorStore } from '@/lib/videoEditor/editorStore';
import { exportToJSON } from '@/lib/videoEditor/utils';
import { ExportSettings } from '@/lib/videoEditor/types';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  clipIndex: number;
  onExportComplete?: (newVideoUrl: string) => void;
}

export function ExportModal({
  open,
  onClose,
  sessionId,
  clipIndex,
  onExportComplete,
}: ExportModalProps) {
  const { currentUser } = useAuth();
  const { layers, videoMetadata, exportForBackend, validateExportState } = useEditorStore();
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    resolution: 'original',
    aspectRatio: 'original',
    quality: 'high',
  });

  // Validate on open
  useEffect(() => {
    if (open) {
      const validation = validateExportState();
      setValidationErrors(validation.errors);
    }
  }, [open, layers, validateExportState]);

  // Trigger confetti animation on export success
  useEffect(() => {
    if (exportSuccess) {
      triggerConfetti();
    }
  }, [exportSuccess]);

  // Simple confetti animation using canvas
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Create confetti particles using DOM elements for simplicity
      for (let i = 0; i < particleCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)];
        confetti.style.left = randomInRange(0, window.innerWidth) + 'px';
        confetti.style.top = '-20px';
        confetti.style.opacity = '1';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        confetti.style.borderRadius = '50%';

        document.body.appendChild(confetti);

        const angle = randomInRange(0, 360);
        const velocity = randomInRange(10, 30);
        const gravity = 0.5;
        let x = parseFloat(confetti.style.left);
        let y = -20;
        let vx = Math.cos(angle * Math.PI / 180) * velocity;
        let vy = Math.sin(angle * Math.PI / 180) * velocity;

        const animateParticle = () => {
          x += vx;
          y += vy;
          vy += gravity;
          confetti.style.left = x + 'px';
          confetti.style.top = y + 'px';
          confetti.style.opacity = String(Math.max(0, 1 - (Date.now() - (animationEnd - duration)) / duration));

          if (y < window.innerHeight && parseFloat(confetti.style.opacity) > 0) {
            requestAnimationFrame(animateParticle);
          } else {
            confetti.remove();
          }
        };

        requestAnimationFrame(animateParticle);
      }
    }, 250);
  };

  const handleExport = async () => {
    if (!currentUser) {
      toast.error('Please sign in to export videos');
      return;
    }

    // Validate before export
    const validation = validateExportState();
    if (!validation.valid) {
      toast.error(`Cannot export: ${validation.errors[0]}`);
      setValidationErrors(validation.errors);
      return;
    }

    setExporting(true);
    setExportSuccess(false);

    try {
      // Use the new exportForBackend function
      const exportData = exportForBackend();

      console.log('[VideoEditor] Exporting with parameters:', exportData);
      console.log('[VideoEditor] Number of layers:', exportData.layers.length);

      // Call backend API to reprocess clip with editor parameters
      const result = await apiClient.post('/reprocess-clip', {
        session_id: sessionId,
        clip_index: clipIndex,
        edit_parameters: exportData,
      });

      console.log('[VideoEditor] Export result:', result);

      // Generate cache-busting URL
      const cacheBuster = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      let freshUrl = result.download_url;
      const separator = freshUrl.includes('?') ? '&' : '?';
      freshUrl = `${freshUrl}${separator}_v=${cacheBuster}&_r=${randomId}`;

      // Fetch current clips, update the specific one, write back
      const { data: videoData, error: fetchError } = await supabase
        .from('videos')
        .select('clips')
        .eq('session_id', sessionId)
        .eq('user_id', currentUser.uid)
        .single();
      if (fetchError) throw fetchError;

      const updatedClips = [...(videoData.clips || [])];
      updatedClips[clipIndex] = {
        ...updatedClips[clipIndex],
        downloadUrl: freshUrl,
        editorState: exportData,
        edited: true,
        lastModified: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('videos')
        .update({ clips: updatedClips })
        .eq('session_id', sessionId)
        .eq('user_id', currentUser.uid);
      if (updateError) throw updateError;

      setExportedVideoUrl(freshUrl);
      setExportSuccess(true);
      toast.success('Video exported successfully!');

      if (onExportComplete) {
        onExportComplete(freshUrl);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      console.error('[VideoEditor] Export error:', error);
      toast.error(error.message || 'Failed to export video');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (!exporting) {
      setExportSuccess(false);
      setExportedVideoUrl('');
      onClose();
    }
  };

  // Estimate file size based on export settings
  const estimateFileSize = (): string => {
    const duration = videoMetadata.duration;

    // Base bitrates in Mbps
    const qualityBitrates = {
      low: 1.5,
      medium: 2.5,
      high: 4.0,
      custom: 3.0,
    };

    // Resolution multipliers
    const resolutionMultipliers = {
      '720p': 1.0,
      '1080p': 1.5,
      '4k': 4.0,
      'original': videoMetadata.resolution.height >= 1440 ? 2.5 : videoMetadata.resolution.height >= 1080 ? 1.5 : 1.0,
    };

    const baseBitrate = qualityBitrates[exportSettings.quality];
    const resolutionMultiplier = resolutionMultipliers[exportSettings.resolution];
    const effectiveBitrate = baseBitrate * resolutionMultiplier;

    // File size in MB = (bitrate in Mbps * duration in seconds) / 8
    const estimatedSizeMB = (effectiveBitrate * duration) / 8;

    // Format the size
    if (estimatedSizeMB < 1) {
      return `${(estimatedSizeMB * 1024).toFixed(0)} KB`;
    } else if (estimatedSizeMB > 1000) {
      return `${(estimatedSizeMB / 1024).toFixed(2)} GB`;
    } else {
      return `${estimatedSizeMB.toFixed(1)} MB`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Video</DialogTitle>
          <DialogDescription>
            Configure export settings and render your edited video
          </DialogDescription>
        </DialogHeader>

        {exportSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold">Export Successful!</p>
            <p className="text-sm text-muted-foreground text-center">
              Your video has been processed with the edits applied.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                <p className="font-semibold text-destructive text-sm mb-2">Cannot Export:</p>
                <ul className="text-sm text-destructive/90 space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Resolution */}
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select
                value={exportSettings.resolution}
                onValueChange={(value: any) =>
                  setExportSettings({ ...exportSettings, resolution: value })
                }
                disabled={exporting}
              >
                <SelectTrigger id="resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select
                value={exportSettings.aspectRatio}
                onValueChange={(value: any) =>
                  setExportSettings({ ...exportSettings, aspectRatio: value })
                }
                disabled={exporting}
              >
                <SelectTrigger id="aspect-ratio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep Original</SelectItem>
                  <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                  <SelectItem value="9:16">9:16 (TikTok/Reels)</SelectItem>
                  <SelectItem value="1:1">1:1 (Instagram)</SelectItem>
                  <SelectItem value="4:5">4:5 (Instagram Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select
                value={exportSettings.quality}
                onValueChange={(value: any) =>
                  setExportSettings({ ...exportSettings, quality: value })
                }
                disabled={exporting}
              >
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Faster)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">High (Best Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="bg-muted/50 border rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Processing Info:</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Layers: {layers.length}</li>
                <li>• Duration: {Math.round(videoMetadata.duration)}s</li>
                <li>• Estimated file size: {estimateFileSize()}</li>
                <li>• Estimated time: 30-90 seconds</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          {!exportSuccess && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={exporting}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="gradient-primary"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

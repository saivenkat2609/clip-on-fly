import { useState, useEffect, memo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Save, Undo, Redo, Play, Pause, Loader2, HelpCircle } from 'lucide-react';
import { useEditorStore } from '@/lib/videoEditor/editorStore';
import { createDefaultTextLayer } from '@/lib/videoEditor/utils';
import { CanvasEditor } from './CanvasEditor';
import { EditorToolbar } from './EditorToolbar';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { Timeline } from './Timeline';
import { ExportModal } from './ExportModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { TutorialModal } from './TutorialModal';
import { toast } from 'sonner';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface VideoEditorModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle: string;
  clipIndex: number;
  sessionId: string;
  onExportComplete?: (newVideoUrl: string) => void;
  existingEditorState?: any;
}

const VideoEditorModalComponent = ({
  open,
  onClose,
  videoUrl,
  videoTitle,
  clipIndex,
  sessionId,
  onExportComplete,
  existingEditorState,
}: VideoEditorModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);

  const {
    currentTime,
    setCurrentTime,
    undo,
    redo,
    history,
    loadEditorState,
    resetEditor,
    videoMetadata,
  } = useEditorStore();

  // Load existing editor state if available and reset loading state
  useEffect(() => {
    if (open && videoUrl) {
      setVideoLoading(true);
      if (existingEditorState) {
        loadEditorState(existingEditorState);
      }

      // Show tutorial on first use
      const tutorialCompleted = localStorage.getItem('video-editor-tutorial-completed');
      if (!tutorialCompleted) {
        // Show tutorial after video loads
        setTimeout(() => {
          setTutorialModalOpen(true);
        }, 1000);
      }
    }
  }, [open, existingEditorState, videoUrl, loadEditorState]);

  // Load video metadata when video is ready
  const handleVideoLoaded = (video: HTMLVideoElement) => {
    setVideoElement(video);
    setVideoLoading(false);
    setIsPlaying(false); // Ensure video starts paused
    useEditorStore.setState({
      videoMetadata: {
        duration: video.duration,
        resolution: {
          width: video.videoWidth,
          height: video.videoHeight,
        },
        aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
      },
    });
    toast.success('Video loaded successfully');
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      const { layers, selectedLayerId, selectedLayerIds, updateLayer, duplicateLayer, deleteLayer, rippleDeleteLayer, selectLayer, copyLayer, pasteLayer, groupSelectedLayers } = useEditorStore.getState();
      const selectedLayer = layers.find(l => l.id === selectedLayerId);

      // Ctrl+G - Group selected layers
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        if (selectedLayerIds.length >= 2) {
          groupSelectedLayers();
          toast.success(`Grouped ${selectedLayerIds.length} layers`);
        } else {
          toast.error('Select at least 2 layers to group (Shift+Click)');
        }
      }

      // Ctrl+C - Copy layer
      if (e.ctrlKey && e.key === 'c' && selectedLayerId) {
        e.preventDefault();
        copyLayer(selectedLayerId);
        toast.success('Layer copied');
      }

      // Ctrl+V - Paste layer
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteLayer();
        toast.success('Layer pasted');
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        toast.success('Undo');
      }

      // Ctrl+Shift+Z or Ctrl+Y - Redo
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        redo();
        toast.success('Redo');
      }

      // Ctrl+D - Duplicate layer
      if (e.ctrlKey && e.key === 'd' && selectedLayerId) {
        e.preventDefault();
        duplicateLayer(selectedLayerId);
        toast.success('Layer duplicated');
      }

      // Delete or Backspace - Delete selected layer (with ripple if Shift held)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        e.preventDefault();
        if (e.shiftKey) {
          rippleDeleteLayer(selectedLayerId);
          toast.success('Layer deleted (ripple)');
        } else {
          deleteLayer(selectedLayerId);
          toast.success('Layer deleted');
        }
      }

      // Arrow Keys - Nudge layer position
      if (selectedLayer && !selectedLayer.locked) {
        const nudgeAmount = e.shiftKey ? 10 : 1;
        let newPosition = { ...selectedLayer.position };

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          newPosition.x -= nudgeAmount;
          updateLayer(selectedLayerId!, { position: newPosition });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          newPosition.x += nudgeAmount;
          updateLayer(selectedLayerId!, { position: newPosition });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          newPosition.y -= nudgeAmount;
          updateLayer(selectedLayerId!, { position: newPosition });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          newPosition.y += nudgeAmount;
          updateLayer(selectedLayerId!, { position: newPosition });
        }
      }

      // Space - Play/Pause
      if (e.key === ' ' && videoElement) {
        e.preventDefault();
        if (isPlaying) {
          videoElement.pause();
          setIsPlaying(false);
        } else {
          videoElement.play();
          setIsPlaying(true);
        }
      }

      // Escape - Deselect or Close modal
      if (e.key === 'Escape') {
        if (selectedLayerId) {
          selectLayer(null);
          toast.info('Layer deselected');
        } else {
          handleClose();
        }
      }

      // T - Add text layer (quick add)
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const { addLayer, currentTime } = useEditorStore.getState();
        const newTextLayer = createDefaultTextLayer(currentTime);
        addLayer(newTextLayer);
        toast.success('Text layer added');
      }

      // ? - Show keyboard shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }

      // S - Split layer at playhead
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const { selectedLayerId, layers, currentTime, splitLayerAtTime } = useEditorStore.getState();
        if (selectedLayerId) {
          const selectedLayer = layers.find(l => l.id === selectedLayerId);
          if (selectedLayer && currentTime > selectedLayer.timing.start && currentTime < selectedLayer.timing.end) {
            splitLayerAtTime(selectedLayerId, currentTime);
            toast.success(`Split "${selectedLayer.name}" at ${currentTime.toFixed(1)}s`);
          } else {
            toast.error('Playhead must be within layer timing');
          }
        } else {
          toast.error('Select a layer to split');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isPlaying, videoElement, undo, redo, setShortcutsModalOpen]);

  const handleClose = () => {
    if (!open) return; // Prevent multiple closes
    resetEditor();
    onClose();
  };

  const handlePlayPause = () => {
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play();
      setIsPlaying(true);
    }
  };

  // Only render dialog content when we have valid data
  if (!open) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
          <VisuallyHidden>
            <DialogTitle>Video Editor</DialogTitle>
            <DialogDescription>
              Edit your video with text overlays, effects, and more
            </DialogDescription>
          </VisuallyHidden>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b bg-gradient-to-r from-background via-background to-muted/20 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Video Editor
                  </h2>
                  <span className="text-xs text-muted-foreground truncate max-w-md">
                    {videoTitle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Undo/Redo Group */}
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={history.past.length === 0}
                  title="Undo (Ctrl+Z)"
                  className="h-8 w-8 hover:scale-110 transition-all duration-200 hover:bg-background"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={history.future.length === 0}
                  title="Redo (Ctrl+Shift+Z)"
                  className="h-8 w-8 hover:scale-110 transition-all duration-200 hover:bg-background"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              {/* Help Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTutorialModalOpen(true)}
                className="h-8 w-8 hover:scale-110 transition-all duration-200 hover:bg-primary/10"
                title="Tutorial & Help"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>

              {/* Export Button */}
              <Button
                variant="default"
                size="sm"
                className="gradient-primary hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl h-9 px-4"
                onClick={() => setExportModalOpen(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="font-semibold">Export Video</span>
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 hover:scale-110 transition-transform duration-200 hover:text-destructive hover:bg-destructive/10"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Toolbar (Left) */}
            <div className="w-16 border-r bg-muted/30 flex flex-col items-center py-4 gap-3">
              <EditorToolbar onShowShortcuts={() => setShortcutsModalOpen(true)} />
            </div>

            {/* Canvas Area (Center) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Canvas */}
              <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden p-4 relative">
                {videoLoading && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-50">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-white text-lg">Loading video...</p>
                    <p className="text-gray-400 text-sm mt-2">Please wait</p>
                  </div>
                )}
                <CanvasEditor
                  videoUrl={videoUrl}
                  onVideoLoaded={handleVideoLoaded}
                  isPlaying={isPlaying}
                  onPlayingChange={setIsPlaying}
                />
              </div>

              {/* Timeline */}
              <div className="h-32 border-t bg-background">
                <Timeline
                  videoElement={videoElement}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                />
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-80 border-l bg-background flex flex-col overflow-hidden">
              {/* Layers Panel */}
              <div className="flex-1 overflow-y-auto border-b">
                <LayersPanel />
              </div>

              {/* Properties Panel */}
              <div className="flex-1 overflow-y-auto">
                <PropertiesPanel />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        sessionId={sessionId}
        clipIndex={clipIndex}
        onExportComplete={onExportComplete}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        open={tutorialModalOpen}
        onClose={() => setTutorialModalOpen(false)}
      />
    </>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
export const VideoEditorModal = memo(VideoEditorModalComponent);

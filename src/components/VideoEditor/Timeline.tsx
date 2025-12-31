import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Maximize2, Clock, Scissors } from 'lucide-react';
import { useEditorStore } from '@/lib/videoEditor/editorStore';
import { formatTime } from '@/lib/videoEditor/utils';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface TimelineProps {
  videoElement: HTMLVideoElement | null;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function Timeline({ videoElement, isPlaying, onPlayPause }: TimelineProps) {
  const { currentTime, videoMetadata, layers, selectedLayerId, splitLayerAtTime, updateLayer, selectLayer, settings } = useEditorStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [layerDragState, setLayerDragState] = useState<{
    layerId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalTiming: { start: number; end: number };
  } | null>(null);
  const [dragTooltip, setDragTooltip] = useState<{ time: number; x: number; y: number } | null>(null);

  const duration = videoMetadata.duration || 0;
  const snapThreshold = 0.2; // Snap to nearest 0.2 seconds when snap is enabled

  // Split selected layer at current time
  const handleSplitLayer = () => {
    if (!selectedLayerId) {
      toast.error('Select a layer to split');
      return;
    }

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    // Check if current time is within the layer's timing
    if (currentTime <= selectedLayer.timing.start || currentTime >= selectedLayer.timing.end) {
      toast.error('Playhead must be within layer timing');
      return;
    }

    splitLayerAtTime(selectedLayerId, currentTime);
    toast.success(`Split "${selectedLayer.name}" at ${currentTime.toFixed(1)}s`);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoElement) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    videoElement.currentTime = Math.max(0, Math.min(newTime, duration));
  };

  const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current || !videoElement) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(x / rect.width, 1));
    const newTime = percentage * duration;

    videoElement.currentTime = newTime;
  };

  const handleSkipBackward = () => {
    if (!videoElement) return;
    videoElement.currentTime = Math.max(0, videoElement.currentTime - 5);
  };

  const handleSkipForward = () => {
    if (!videoElement) return;
    videoElement.currentTime = Math.min(duration, videoElement.currentTime + 5);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Snap time to grid if snap is enabled
  const snapTime = (time: number) => {
    if (!settings.snapToGrid) return time;
    return Math.round(time / snapThreshold) * snapThreshold;
  };

  // Layer dragging handlers
  const handleLayerMouseDown = (
    layerId: string,
    type: 'move' | 'resize-start' | 'resize-end',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!timelineRef.current) return;

    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.locked) return;

    selectLayer(layerId);
    const rect = timelineRef.current.getBoundingClientRect();
    setLayerDragState({
      layerId,
      type,
      startX: e.clientX,
      originalTiming: { ...layer.timing },
    });
  };

  const handleLayerMouseMove = (e: React.MouseEvent) => {
    if (!layerDragState || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - layerDragState.startX;
    const deltaTime = (deltaX / rect.width) * duration;

    const layer = layers.find(l => l.id === layerDragState.layerId);
    if (!layer) return;

    let newStart = layerDragState.originalTiming.start;
    let newEnd = layerDragState.originalTiming.end;
    let tooltipTime = 0;

    if (layerDragState.type === 'move') {
      // Move entire layer
      const rawStart = layerDragState.originalTiming.start + deltaTime;
      newStart = snapTime(Math.max(0, Math.min(duration - (layerDragState.originalTiming.end - layerDragState.originalTiming.start), rawStart)));
      newEnd = newStart + (layerDragState.originalTiming.end - layerDragState.originalTiming.start);
      tooltipTime = newStart;
    } else if (layerDragState.type === 'resize-start') {
      // Resize from start
      const rawStart = layerDragState.originalTiming.start + deltaTime;
      newStart = snapTime(Math.max(0, Math.min(layerDragState.originalTiming.end - 0.1, rawStart)));
      tooltipTime = newStart;
    } else if (layerDragState.type === 'resize-end') {
      // Resize from end
      const rawEnd = layerDragState.originalTiming.end + deltaTime;
      newEnd = snapTime(Math.max(layerDragState.originalTiming.start + 0.1, Math.min(duration, rawEnd)));
      tooltipTime = newEnd;
    }

    updateLayer(layerDragState.layerId, {
      timing: { start: newStart, end: newEnd },
    });

    // Show drag tooltip
    setDragTooltip({
      time: tooltipTime,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleLayerMouseUp = () => {
    if (layerDragState) {
      toast.success('Layer timing updated');
    }
    setLayerDragState(null);
    setDragTooltip(null);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20 border-t-2">
      {/* Playback Controls */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background/95 backdrop-blur">
        {/* Transport Controls */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipBackward}
            className="h-8 w-8 hover:scale-110 transition-transform duration-200"
            title="Skip backward 5s"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onPlayPause}
            className="h-8 w-8 gradient-primary hover:scale-110 transition-all duration-200 shadow-lg"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipForward}
            className="h-8 w-8 hover:scale-110 transition-transform duration-200"
            title="Skip forward 5s"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-lg">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="text-sm font-mono font-medium">
            <span className="text-primary">{formatTime(currentTime)}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Split Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSplitLayer}
          disabled={!selectedLayerId}
          className={cn(
            "h-8 px-3 text-xs hover:scale-105 transition-all duration-200",
            selectedLayerId && "hover:bg-primary/10 hover:border-primary/50"
          )}
          title="Split layer at playhead (S)"
        >
          <Scissors className="h-3.5 w-3.5 mr-1.5" />
          Split
        </Button>

        <div className="flex-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="h-8 w-8 hover:scale-110 transition-transform duration-200"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <div className="w-20 px-2">
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={5}
              step={0.5}
              className="cursor-pointer"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            className="h-8 w-8 hover:scale-110 transition-transform duration-200"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="h-8 w-8 hover:scale-110 transition-transform duration-200"
            title="Reset zoom"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
          {zoom.toFixed(1)}x
        </div>
      </div>

      {/* Timeline Track */}
      <div className="flex-1 relative overflow-x-auto">
        <div
          className="relative h-full bg-gradient-to-b from-muted/10 to-muted/30"
          style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
        >
          {/* Timeline ruler */}
          <div className="sticky top-0 left-0 right-0 h-8 border-b bg-background/95 backdrop-blur flex items-center px-2 z-20">
            {Array.from({ length: Math.ceil(duration / zoom) + 1 }).map((_, i) => {
              const time = i * zoom;
              if (time > duration) return null;

              const showLabel = zoom <= 2 ? i % 5 === 0 : i % 2 === 0;

              return (
                <div key={i}>
                  {showLabel && (
                    <div
                      className="absolute text-xs font-mono text-muted-foreground font-medium"
                      style={{ left: `${(time / duration) * 100}%` }}
                    >
                      {time.toFixed(0)}s
                    </div>
                  )}
                  <div
                    className="absolute h-2 w-px bg-border"
                    style={{
                      left: `${(time / duration) * 100}%`,
                      top: '50%',
                      opacity: showLabel ? 1 : 0.3,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Timeline scrubber */}
          <div
            ref={timelineRef}
            className="absolute top-8 left-0 right-0 bottom-0 cursor-crosshair"
            onClick={handleTimelineClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => {
              setIsDragging(false);
              handleLayerMouseUp();
            }}
            onMouseMove={(e) => {
              handleTimelineDrag(e);
              handleLayerMouseMove(e);
            }}
            onMouseLeave={() => {
              setIsDragging(false);
              handleLayerMouseUp();
            }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-border/20"
                  style={{ left: `${(i / duration) * 100}%` }}
                />
              ))}
            </div>

            {/* Layer timing visualizations */}
            <div className="relative pt-2 pb-2 px-1">
              {layers.map((layer, index) => {
                const leftPercent = (layer.timing.start / duration) * 100;
                const widthPercent = ((layer.timing.end - layer.timing.start) / duration) * 100;
                const isBeingDragged = layerDragState?.layerId === layer.id;

                return (
                  <div
                    key={layer.id}
                    className={cn(
                      "absolute h-8 rounded-md border-2 transition-all duration-200 group",
                      !layer.locked && "cursor-move",
                      layer.locked && "cursor-not-allowed opacity-50",
                      "hover:shadow-lg hover:z-10",
                      !isBeingDragged && "hover:scale-[1.02]",
                      isBeingDragged && "shadow-xl z-20 scale-[1.05]",
                      layer.type === 'text' && "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30",
                      layer.type === 'image' && "bg-green-500/20 border-green-500/50 hover:bg-green-500/30",
                      layer.type === 'shape' && "bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30",
                      selectedLayerId === layer.id && "ring-2 ring-primary/50"
                    )}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: `${index * 40 + 8}px`,
                    }}
                    title={layer.locked ? `${layer.name} (Locked)` : `${layer.name}: ${layer.timing.start.toFixed(1)}s - ${layer.timing.end.toFixed(1)}s`}
                    onMouseDown={(e) => !layer.locked && handleLayerMouseDown(layer.id, 'move', e)}
                  >
                    <div className="h-full flex items-center px-2 pointer-events-none">
                      <div className="text-xs truncate font-medium text-foreground group-hover:font-semibold">
                        {layer.name}
                      </div>
                    </div>
                    {/* Resize handles */}
                    {!layer.locked && (
                      <>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 bg-primary/60 opacity-0 group-hover:opacity-100 cursor-ew-resize pointer-events-auto z-10"
                          onMouseDown={(e) => handleLayerMouseDown(layer.id, 'resize-start', e)}
                          title="Drag to adjust start time"
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 bg-primary/60 opacity-0 group-hover:opacity-100 cursor-ew-resize pointer-events-auto z-10"
                          onMouseDown={(e) => handleLayerMouseDown(layer.id, 'resize-end', e)}
                          title="Drag to adjust end time"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-lg"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -top-2 -left-[7px] w-4 h-4 bg-red-500 rounded-full shadow-lg border-2 border-background">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
              </div>
              <div className="absolute -top-1 left-1 bg-red-500/90 backdrop-blur text-white text-xs font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Tooltip */}
      {dragTooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragTooltip.x + 15,
            top: dragTooltip.y - 35,
          }}
        >
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg shadow-xl border-2 border-primary/50 backdrop-blur">
            <div className="text-sm font-mono font-bold">
              {formatTime(dragTooltip.time)}
            </div>
            {settings.snapToGrid && (
              <div className="text-[10px] opacity-70 text-center">
                Snap: {snapThreshold}s
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

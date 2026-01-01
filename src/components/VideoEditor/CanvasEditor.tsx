import { useEffect, useRef, useState } from 'react';
import { Canvas, IText, Shadow } from 'fabric';
import { useEditorStore } from '@/lib/videoEditor/editorStore';
import { isLayerVisibleAtTime, calculateCanvasSize } from '@/lib/videoEditor/utils';
import { TextLayer } from '@/lib/videoEditor/types';

interface CanvasEditorProps {
  videoUrl: string;
  onVideoLoaded: (video: HTMLVideoElement) => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
}

export function CanvasEditor({
  videoUrl,
  onVideoLoaded,
  isPlaying,
  onPlayingChange,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const { layers, currentTime, setCurrentTime, selectedLayerId, selectLayer, updateLayer, videoMetadata } = useEditorStore();

  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showRawVideo, setShowRawVideo] = useState(false);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });
  const isInteractingRef = useRef(false); // Track if user is dragging/editing
  const layerPositionsRef = useRef<Map<string, {x: number, y: number}>>(new Map()); // Track last synced positions

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    console.log('[CanvasEditor] Initializing Fabric.js canvas');

    const canvas = new Canvas(canvasRef.current, {
      // Don't set backgroundColor - it will cover the video!
      // backgroundColor: '#1e293b',
      preserveObjectStacking: true,
      selection: true,
      renderOnAddRemove: false, // Manual rendering for better control
      enableRetinaScaling: false, // Disable for better performance
      // CRITICAL: Ensure objects can be selected
      skipTargetFind: false,
      targetFindTolerance: 5, // Pixels of tolerance for selection
      perPixelTargetFind: true, // More accurate selection
      stopContextMenu: true,
    });

    fabricCanvasRef.current = canvas;
    setCanvasInitialized(true);

    console.log('[CanvasEditor] ✓ Fabric canvas initialized');

    // Handle object selection
    canvas.on('selection:created', (e) => {
      console.log('[CanvasEditor] Selection created:', e.selected);
      if (e.selected && e.selected[0]) {
        const obj = e.selected[0];
        selectLayer(obj.data?.layerId || null);
      }
    });

    // Debug: Log mouse events to verify canvas is receiving them
    canvas.on('mouse:down', (e) => {
      console.log('[CanvasEditor] Mouse down on canvas', e.target ? 'on object' : 'on background');
    });

    canvas.on('selection:updated', (e) => {
      if (e.selected && e.selected[0]) {
        const obj = e.selected[0];
        selectLayer(obj.data?.layerId || null);
      }
    });

    canvas.on('selection:cleared', () => {
      // Only clear selection when clicking on canvas background, not UI elements
      selectLayer(null);
    });

    // Track interaction state to prevent updates during drag/edit
    canvas.on('object:moving', (e) => {
      isInteractingRef.current = true;
      console.log('[CanvasEditor] Object moving - updates blocked');
    });

    canvas.on('object:scaling', (e) => {
      isInteractingRef.current = true;
      console.log('[CanvasEditor] Object scaling - updates blocked');
    });

    canvas.on('object:rotating', (e) => {
      isInteractingRef.current = true;
      console.log('[CanvasEditor] Object rotating - updates blocked');
    });

    canvas.on('text:editing:entered', () => {
      isInteractingRef.current = true;
      console.log('[CanvasEditor] Text editing - updates blocked');
    });

    canvas.on('text:editing:exited', () => {
      isInteractingRef.current = false;
      console.log('[CanvasEditor] Text editing done - updates enabled');
    });

    // Handle object modifications
    canvas.on('object:modified', (e) => {
      // Reset interaction flag when modification is complete
      isInteractingRef.current = false;

      if (e.target && e.target.data?.layerId) {
        const layerId = e.target.data.layerId;

        // Convert canvas display positions back to video space
        const video = videoRef.current;
        const videoWidth = video?.videoWidth || 1920;
        const videoHeight = video?.videoHeight || 1080;
        const canvasWidth = canvas.width || 1;
        const canvasHeight = canvas.height || 1;
        const scaleX = canvasWidth / videoWidth;
        const scaleY = canvasHeight / videoHeight;

        // Convert back to video space
        const videoX = (e.target.left || 0) / scaleX;
        const videoY = (e.target.top || 0) / scaleY;

        // Update tracked position BEFORE updating store to prevent re-sync
        layerPositionsRef.current.set(layerId, { x: videoX, y: videoY });

        updateLayer(layerId, {
          position: {
            x: videoX,
            y: videoY,
          },
          transform: {
            rotation: e.target.angle || 0,
            scaleX: e.target.scaleX || 1,
            scaleY: e.target.scaleY || 1,
          },
        });
      }
    });

    // Handle text changes when user edits directly on canvas
    canvas.on('text:changed', (e) => {
      if (e.target && e.target.data?.layerId) {
        const layerId = e.target.data.layerId;
        const text = (e.target as any).text;
        updateLayer(layerId, { content: text });
      }
    });

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Load video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      console.error('[CanvasEditor] No video element or URL');
      setVideoError('No video URL provided');
      return;
    }

    console.log('[CanvasEditor] Loading video:', videoUrl);
    setVideoReady(false);
    setVideoError(null);

    // Ensure video starts paused
    video.pause();
    video.src = videoUrl;
    video.load(); // Force load
    video.currentTime = 0;

    const handleLoadedMetadata = () => {
      console.log('[CanvasEditor] ✓ Video metadata loaded');
      onVideoLoaded(video);
    };

    const handleLoadedData = () => {
      console.log('[CanvasEditor] ✓ Video data loaded, ready to display');
      setVideoReady(true);
    };

    const handleCanPlay = () => {
      // Video is ready to play
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      console.log('[CanvasEditor] Video playing');
      onPlayingChange(true);
    };

    const handlePause = () => {
      console.log('[CanvasEditor] Video paused');
      onPlayingChange(false);
    };

    const handleEnded = () => {
      onPlayingChange(false);
      video.currentTime = 0;
    };

    const handleError = (e: Event) => {
      const errorMsg = `Video loading error: ${(e.target as HTMLVideoElement).error?.message || 'Unknown error'}`;
      console.error('[CanvasEditor]', errorMsg, e);
      setVideoError(errorMsg);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  // Resize canvas to fit container
  useEffect(() => {
    if (!fabricCanvasRef.current || !containerRef.current) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      const video = videoRef.current;
      const canvas = fabricCanvasRef.current;

      if (!container || !canvas) return;

      // Use video dimensions if available, otherwise use defaults
      const videoWidth = video?.videoWidth || 1920;
      const videoHeight = video?.videoHeight || 1080;

      const { width, height, scale } = calculateCanvasSize(
        videoWidth,
        videoHeight,
        container.clientWidth - 40,
        container.clientHeight - 40
      );

      // Set canvas to DISPLAY size (to fit UI properly like before)
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }

      // Store display size in state
      setCanvasDisplaySize({ width, height });

      // Set Fabric canvas dimensions to display size
      canvas.setDimensions({ width, height });
      canvas.setZoom(1);

      // Reset viewport transform - we'll scale positions directly instead
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0];

      canvas.renderAll();
    };

    // Initial resize with delay to ensure container is ready
    setTimeout(() => resizeCanvas(), 100);

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasInitialized, videoMetadata, videoReady]);

  // Setup video background rendering - hook into Fabric's render cycle
  useEffect(() => {
    if (!fabricCanvasRef.current || !videoRef.current || !canvasInitialized || !videoReady) {
      console.log('[CanvasEditor] Skipping render setup: not ready');
      return;
    }

    const canvas = fabricCanvasRef.current;
    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      console.log('[CanvasEditor] Video dimensions not ready');
      return;
    }

    console.log('[CanvasEditor] Setting up video background rendering');

    // This function draws video BEFORE Fabric renders its objects
    const drawVideoBackground = () => {
      try {
        // Get the lower canvas context (background layer)
        const ctx = canvas.getContext();
        if (!ctx) {
          console.error('[CanvasEditor] Failed to get canvas context');
          return;
        }

        const canvasWidth = canvas.width!;
        const canvasHeight = canvas.height!;

        // Calculate dimensions to fit video in canvas while maintaining aspect ratio
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (videoAspect > canvasAspect) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / videoAspect;
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * videoAspect;
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        }

        // Draw video frame to the background
        ctx.drawImage(
          video,
          0, 0, video.videoWidth, video.videoHeight, // source
          offsetX, offsetY, drawWidth, drawHeight // destination
        );
      } catch (err) {
        console.error('[CanvasEditor] Error drawing video:', err);
      }
    };

    // Hook into Fabric's render cycle - draw video BEFORE Fabric renders
    const handleBeforeRender = () => {
      drawVideoBackground();
    };

    canvas.on('before:render', handleBeforeRender);

    // Continuous render loop to trigger Fabric rendering
    const renderLoop = () => {
      canvas.requestRenderAll();
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    console.log('[CanvasEditor] ✓ Starting continuous render loop');
    renderLoop();

    return () => {
      canvas.off('before:render', handleBeforeRender);
      if (animationFrameRef.current) {
        console.log('[CanvasEditor] Stopping render loop');
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasInitialized, videoReady]);


  // Sync layers with canvas objects - Create/update/delete as needed
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasInitialized) return;

    const canvas = fabricCanvasRef.current;
    const video = videoRef.current;

    // Calculate scale factor from video space to canvas display space
    const videoWidth = video?.videoWidth || 1920;
    const videoHeight = video?.videoHeight || 1080;
    const canvasWidth = canvas.width || 1;
    const canvasHeight = canvas.height || 1;
    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;

    // Get existing canvas objects mapped by layer ID
    const existingObjects = new Map<string, any>();
    canvas.getObjects().forEach((obj) => {
      if (obj.data?.layerId) {
        existingObjects.set(obj.data.layerId, obj);
      }
    });

    // Track which layer IDs should exist
    const layerIdsToKeep = new Set<string>();

    // Process all layers
    layers.forEach((layer) => {
      if (layer.type !== 'text') return;

      const textLayer = layer as TextLayer;

      // Check if layer should be visible at current time
      const shouldBeVisible = isLayerVisibleAtTime(textLayer, currentTime) && textLayer.visible;

      layerIdsToKeep.add(textLayer.id);

      const existingObj = existingObjects.get(textLayer.id);

      // Scale positions from video space to display space
      const scaledLeft = textLayer.position.x * scaleX;
      const scaledTop = textLayer.position.y * scaleY;
      const scaledFontSize = textLayer.style.fontSize * scaleY;

      if (existingObj) {
        // Check if this is the currently selected/active object being interacted with
        const isActiveObject = canvas.getActiveObject() === existingObj;
        const isThisObjectBeingInteractedWith = isActiveObject && isInteractingRef.current;

        // Check if position actually changed in store (not from canvas drag)
        const lastPos = layerPositionsRef.current.get(textLayer.id);
        const positionChanged = !lastPos ||
          lastPos.x !== textLayer.position.x ||
          lastPos.y !== textLayer.position.y;

        // Only update position if:
        // 1. This specific object is NOT being dragged/edited
        // 2. Position actually changed in the store (from Properties panel or elsewhere)
        const shouldUpdatePosition = !isThisObjectBeingInteractedWith && positionChanged;

        // Skip ALL updates if this object is being dragged/edited
        if (isThisObjectBeingInteractedWith) {
          console.log(`[CanvasEditor] Skipping ALL updates for ${textLayer.id} - being interacted with`);
          return; // Don't update anything for this object
        }

        // Build update object with only changed properties
        const updates: any = {
          text: textLayer.content,
          fontFamily: textLayer.style.fontFamily,
          fontSize: scaledFontSize,
          fontWeight: textLayer.style.fontWeight.toString(),
          fill: textLayer.style.color,
          textAlign: textLayer.style.textAlign,
          opacity: textLayer.opacity,
          stroke: textLayer.style.stroke.width > 0 ? textLayer.style.stroke.color : undefined,
          strokeWidth: textLayer.style.stroke.width * scaleY,
          shadow: textLayer.style.shadow.blur > 0 ? new Shadow({
            color: textLayer.style.shadow.color,
            blur: textLayer.style.shadow.blur * scaleY,
            offsetX: textLayer.style.shadow.offsetX * scaleX,
            offsetY: textLayer.style.shadow.offsetY * scaleY,
          }) : undefined,
          backgroundColor: textLayer.style.backgroundColor,
          lineHeight: textLayer.style.lineHeight || 1.2,
          charSpacing: (textLayer.style.letterSpacing || 0) * 10 * scaleX,
          visible: shouldBeVisible,
          // CRITICAL: Always ensure interactivity is enabled
          editable: true,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false, // CRITICAL: Allow horizontal movement
          lockMovementY: false, // CRITICAL: Allow vertical movement
          lockRotation: false, // Allow rotation
          lockScalingX: false, // Allow horizontal scaling
          lockScalingY: false, // Allow vertical scaling
          // Canva-style selection appearance
          borderColor: 'rgb(139, 92, 246)',
          cornerColor: 'rgb(139, 92, 246)',
          cornerSize: 12,
          cornerStyle: 'circle',
          transparentCorners: false,
          borderDashArray: [0],
          borderScaleFactor: 2,
        };

        // Add position/transform only if should update
        if (shouldUpdatePosition) {
          updates.left = scaledLeft;
          updates.top = scaledTop;
          updates.angle = textLayer.transform.rotation;
          updates.scaleX = textLayer.transform.scaleX;
          updates.scaleY = textLayer.transform.scaleY;

          // Update tracked position
          layerPositionsRef.current.set(textLayer.id, {
            x: textLayer.position.x,
            y: textLayer.position.y
          });
        }

        existingObj.set(updates);

        // Verify properties after update
        if (!existingObj.selectable || !existingObj.evented || existingObj.lockMovementX || existingObj.lockMovementY) {
          console.error(`[CanvasEditor] Object has wrong properties!`, {
            layerId: textLayer.id,
            selectable: existingObj.selectable,
            evented: existingObj.evented,
            editable: existingObj.editable,
            lockMovementX: existingObj.lockMovementX,
            lockMovementY: existingObj.lockMovementY,
            hasControls: existingObj.hasControls,
          });
          // Force re-enable ALL interaction
          existingObj.selectable = true;
          existingObj.evented = true;
          existingObj.editable = true;
          existingObj.hasControls = true;
          existingObj.hasBorders = true;
          existingObj.lockMovementX = false;
          existingObj.lockMovementY = false;
          existingObj.lockRotation = false;
          existingObj.lockScalingX = false;
          existingObj.lockScalingY = false;
        }

        // Force text dimensions recalculation for lineHeight changes
        if (existingObj.initDimensions) {
          existingObj.initDimensions();
        }
        existingObj.setCoords();
      } else if (shouldBeVisible) {
        // Create new object only if it should be visible with scaled positions
        const text = new IText(textLayer.content, {
          left: scaledLeft,
          top: scaledTop,
          fontFamily: textLayer.style.fontFamily,
          fontSize: scaledFontSize,
          fontWeight: textLayer.style.fontWeight.toString(), // Convert to string for Fabric.js
          fill: textLayer.style.color,
          textAlign: textLayer.style.textAlign,
          angle: textLayer.transform.rotation,
          scaleX: textLayer.transform.scaleX,
          scaleY: textLayer.transform.scaleY,
          opacity: textLayer.opacity,
          stroke: textLayer.style.stroke.width > 0 ? textLayer.style.stroke.color : undefined,
          strokeWidth: textLayer.style.stroke.width * scaleY,
          shadow: textLayer.style.shadow.blur > 0 ? new Shadow({
            color: textLayer.style.shadow.color,
            blur: textLayer.style.shadow.blur * scaleY,
            offsetX: textLayer.style.shadow.offsetX * scaleX,
            offsetY: textLayer.style.shadow.offsetY * scaleY,
          }) : undefined,
          backgroundColor: textLayer.style.backgroundColor,
          lineHeight: textLayer.style.lineHeight || 1.2,
          charSpacing: (textLayer.style.letterSpacing || 0) * 10 * scaleX,
          // Enable Canva-style interaction
          editable: true,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false, // CRITICAL: Allow horizontal movement
          lockMovementY: false, // CRITICAL: Allow vertical movement
          lockRotation: false, // Allow rotation
          lockScalingX: false, // Allow horizontal scaling
          lockScalingY: false, // Allow vertical scaling
          // Canva-style selection appearance
          borderColor: 'rgb(139, 92, 246)', // Purple border like Canva
          cornerColor: 'rgb(139, 92, 246)', // Purple corner handles
          cornerSize: 12,
          cornerStyle: 'circle',
          transparentCorners: false,
          borderDashArray: [0], // Solid border
          borderScaleFactor: 2,
          visible: true,
        });

        text.data = { layerId: textLayer.id };
        canvas.add(text);

        // Track initial position
        layerPositionsRef.current.set(textLayer.id, {
          x: textLayer.position.x,
          y: textLayer.position.y
        });

        console.log(`[CanvasEditor] Created text object:`, {
          layerId: textLayer.id,
          content: textLayer.content,
          scaledPos: { left: scaledLeft, top: scaledTop },
          videoPos: { x: textLayer.position.x, y: textLayer.position.y },
          fontSize: scaledFontSize,
          selectable: text.selectable,
          evented: text.evented,
          editable: text.editable,
          lockMovementX: text.lockMovementX,
          lockMovementY: text.lockMovementY,
          visible: text.visible,
        });
      }

      // Handle selection (only when not playing)
      if (existingObj && selectedLayerId === textLayer.id && !isPlaying) {
        canvas.setActiveObject(existingObj);
      }
    });

    // Remove objects for layers that no longer exist
    existingObjects.forEach((obj, layerId) => {
      if (!layerIdsToKeep.has(layerId)) {
        canvas.remove(obj);
      }
    });

    // Update visibility for all objects based on current time
    canvas.getObjects().forEach((obj) => {
      if (obj.data?.layerId) {
        const layer = layers.find(l => l.id === obj.data.layerId) as TextLayer;
        if (layer) {
          const shouldBeVisible = isLayerVisibleAtTime(layer, currentTime) && layer.visible;
          obj.visible = shouldBeVisible;
        }
      }
    });

  }, [layers, currentTime, canvasInitialized, selectedLayerId]);

  // Configure canvas selection styling (Canva-style)
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Enable selection with Canva-style colors
    canvas.selection = true;

    // Canva-style selection colors (purple/blue)
    canvas.selectionColor = 'rgba(139, 92, 246, 0.1)'; // Light purple background
    canvas.selectionBorderColor = 'rgb(139, 92, 246)'; // Purple border
    canvas.selectionLineWidth = 2;

    canvas.renderAll();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-slate-900"
      style={{ pointerEvents: 'auto' }} // Ensure container doesn't block events
    >
      {/* Video element - hidden, used only for frame data */}
      <video
        ref={videoRef}
        className="max-w-full max-h-full"
        crossOrigin="anonymous"
        playsInline
        style={{
          display: showRawVideo || (videoReady && !canvasInitialized) ? 'block' : 'none',
          position: showRawVideo ? 'relative' : 'absolute',
          zIndex: showRawVideo ? 20 : 1,
          pointerEvents: 'none', // CRITICAL: Don't block canvas mouse events
        }}
        controls={false}
      />

      {/* Error display */}
      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm z-10">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-red-400 font-semibold mb-2">Video Loading Error</h3>
            <p className="text-red-300 text-sm">{videoError}</p>
            <p className="text-red-400 text-xs mt-2">Check console for details</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!videoReady && !videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-white text-sm">Loading video...</p>
        </div>
      )}

      {/* Fabric canvas - interactive text editing surface */}
      <canvas
        ref={canvasRef}
        className="shadow-2xl"
        style={{
          width: canvasDisplaySize.width > 0 ? `${canvasDisplaySize.width}px` : 'auto',
          height: canvasDisplaySize.height > 0 ? `${canvasDisplaySize.height}px` : 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          display: (canvasInitialized && videoReady && !showRawVideo) ? 'block' : 'none',
          position: 'relative',
          zIndex: 10,
          imageRendering: 'auto',
          backgroundColor: '#1e293b', // Slate background as fallback
          pointerEvents: 'auto', // CRITICAL: Enable mouse interactions
          cursor: 'default', // Show it's interactive
          touchAction: 'none', // Better touch support
        }}
      />

      {/* Debug info and controls */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-2 z-30">
        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded font-mono space-y-1">
          <div>
            {videoReady ? '✓ Video Ready' : '⏳ Loading...'}
            {' | '}
            {canvasInitialized ? '✓ Canvas Ready' : '⏳ Canvas...'}
          </div>
          <div>
            Canvas Display: {(canvasInitialized && videoReady && !showRawVideo) ? 'VISIBLE' : 'HIDDEN'}
          </div>
          {fabricCanvasRef.current && (
            <div>
              Canvas Resolution: {fabricCanvasRef.current.width}x{fabricCanvasRef.current.height}
            </div>
          )}
          {canvasRef.current && (
            <>
              <div>
                Canvas: {canvasRef.current.width}x{canvasRef.current.height}
              </div>
              <div>
                Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
              </div>
              <div>
                Scale: {videoRef.current?.videoWidth ? (canvasRef.current.width / videoRef.current.videoWidth).toFixed(3) : '0'}x
              </div>
              <div>
                Objects: {fabricCanvasRef.current?.getObjects().filter(o => o.data?.layerId).length || 0}
              </div>
              {fabricCanvasRef.current?.getObjects().filter(o => o.data?.layerId).length > 0 && (
                <>
                  <div className="text-yellow-400">
                    Selectable: {fabricCanvasRef.current.getObjects()[0]?.selectable ? 'YES' : 'NO'}
                    {' | '}
                    Evented: {fabricCanvasRef.current.getObjects()[0]?.evented ? 'YES' : 'NO'}
                  </div>
                  <div className="text-yellow-400">
                    Editable: {fabricCanvasRef.current.getObjects()[0]?.editable ? 'YES' : 'NO'}
                    {' | '}
                    Locked: {fabricCanvasRef.current.getObjects()[0]?.lockMovementX || fabricCanvasRef.current.getObjects()[0]?.lockMovementY ? 'YES' : 'NO'}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {videoReady && (
          <button
            onClick={() => setShowRawVideo(!showRawVideo)}
            className="bg-blue-500/80 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold"
          >
            {showRawVideo ? '🖼️ Show Canvas' : '📹 Show Raw Video'}
          </button>
        )}
      </div>
    </div>
  );
}

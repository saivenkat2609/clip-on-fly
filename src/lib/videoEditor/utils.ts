import { EditorState, TextLayer, EditorExport, ExportSettings } from './types';

export function generateLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createDefaultTextLayer(currentTime: number): TextLayer {
  return {
    id: generateLayerId(),
    type: 'text',
    name: 'Text Layer',
    visible: true,
    locked: false,
    timing: {
      start: currentTime,
      end: currentTime + 5, // 5 seconds duration by default
    },
    position: {
      x: 960, // Center of 1920px width (horizontal center)
      y: 900, // Bottom area - like subtitles (near bottom but not at edge)
    },
    transform: {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    opacity: 1,
    zIndex: 0,
    content: 'Double click to edit',
    style: {
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 600,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
      stroke: {
        color: '#000000',
        width: 2,
      },
      shadow: {
        color: 'rgba(0,0,0,0.5)',
        blur: 8,
        offsetX: 2,
        offsetY: 2,
      },
    },
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(':');
  if (parts.length !== 2) return 0;

  const mins = parseInt(parts[0], 10);
  const secParts = parts[1].split('.');
  const secs = parseInt(secParts[0], 10);
  const ms = secParts.length > 1 ? parseInt(secParts[1], 10) : 0;

  return mins * 60 + secs + ms / 100;
}

export function isLayerVisibleAtTime(layer: TextLayer, currentTime: number): boolean {
  return currentTime >= layer.timing.start && currentTime <= layer.timing.end;
}

export function exportToJSON(state: EditorState, exportSettings: ExportSettings): EditorExport {
  return {
    version: state.version,
    videoMetadata: state.videoMetadata,
    layers: state.layers,
    exportSettings,
  };
}

export function validateEditorState(state: any): state is EditorState {
  if (!state || typeof state !== 'object') return false;
  if (!state.version || !state.videoMetadata || !Array.isArray(state.layers)) return false;

  // Validate video metadata
  const metadata = state.videoMetadata;
  if (typeof metadata.duration !== 'number' || metadata.duration < 0) return false;
  if (!metadata.resolution || typeof metadata.resolution.width !== 'number' || typeof metadata.resolution.height !== 'number') return false;

  // Validate layers
  for (const layer of state.layers) {
    if (!layer.id || !layer.type || !layer.timing || !layer.position) return false;
    if (layer.timing.start < 0 || layer.timing.end <= layer.timing.start) return false;
  }

  return true;
}

export function calculateCanvasSize(
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number; scale: number } {
  const videoAspect = videoWidth / videoHeight;
  const containerAspect = containerWidth / containerHeight;

  let width, height, scale;

  if (videoAspect > containerAspect) {
    // Video is wider than container
    width = containerWidth;
    height = containerWidth / videoAspect;
    scale = containerWidth / videoWidth;
  } else {
    // Video is taller than container
    height = containerHeight;
    width = containerHeight * videoAspect;
    scale = containerHeight / videoHeight;
  }

  return { width, height, scale };
}

export function rgbaToHex(rgba: string): string {
  // Extract rgba values
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgba;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const KEYBOARD_SHORTCUTS = {
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Shift+Z',
  delete: 'Delete',
  duplicate: 'Ctrl+D',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
  playPause: 'Space',
  nudgeLeft: 'ArrowLeft',
  nudgeRight: 'ArrowRight',
  nudgeUp: 'ArrowUp',
  nudgeDown: 'ArrowDown',
  nudgeLarge: 'Shift+Arrow',
  group: 'Ctrl+G',
  deselect: 'Escape',
  save: 'Ctrl+S',
};

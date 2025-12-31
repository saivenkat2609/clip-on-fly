// Video Editor Type Definitions

export interface EditorLayer {
  id: string;
  type: 'text' | 'image' | 'shape';
  name: string;
  visible: boolean;
  locked: boolean;
  timing: {
    start: number; // seconds
    end: number; // seconds
  };
  position: {
    x: number;
    y: number;
  };
  transform: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  opacity: number;
  zIndex: number;
}

export interface TextLayer extends EditorLayer {
  type: 'text';
  content: string;
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing: number;
    stroke: {
      color: string;
      width: number;
    };
    shadow: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
    backgroundColor?: string;
    padding?: number;
  };
}

export interface ImageLayer extends EditorLayer {
  type: 'image';
  url: string;
  filters: {
    grayscale?: number;
    sepia?: number;
    blur?: number;
  };
  border?: {
    color: string;
    width: number;
  };
  borderRadius?: number;
}

export interface ShapeLayer extends EditorLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';
  fill: string;
  stroke: {
    color: string;
    width: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
}

export interface EditorState {
  version: string;
  videoMetadata: {
    duration: number;
    resolution: {
      width: number;
      height: number;
    };
    aspectRatio: string;
    fps?: number;
  };
  layers: (TextLayer | ImageLayer | ShapeLayer)[];
  currentTime: number;
  selectedLayerId: string | null;
  history: {
    past: EditorState[];
    future: EditorState[];
  };
  settings: {
    snapToGrid: boolean;
    showGrid: boolean;
    gridSize: number;
  };
}

export interface ExportSettings {
  resolution: 'original' | '1080p' | '720p' | '4k';
  aspectRatio: 'original' | '16:9' | '9:16' | '1:1' | '4:5';
  quality: 'low' | 'medium' | 'high' | 'custom';
  bitrate?: number;
  framerate?: number;
  codec?: 'h264' | 'h265';
}

export interface EditorExport {
  version: string;
  videoMetadata: EditorState['videoMetadata'];
  layers: EditorState['layers'];
  exportSettings: ExportSettings;
}

export interface CustomPreset {
  id: string;
  name: string;
  style: TextLayer['style'];
  createdAt: Date;
}

export const AVAILABLE_FONTS = [
  'Inter',
  'Roboto',
  'Montserrat',
  'Poppins',
  'Bebas Neue',
  'Oswald',
  'Raleway',
  'Lato',
  'Open Sans',
  'Playfair Display',
] as const;

export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900] as const;

export const TEXT_PRESETS = {
  boldImpact: {
    name: 'Bold Impact',
    style: {
      fontFamily: 'Bebas Neue',
      fontSize: 72,
      fontWeight: 700,
      color: '#FFFFFF',
      lineHeight: 1.2,
      letterSpacing: 2,
      stroke: { color: '#000000', width: 4 },
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 2, offsetY: 2 },
    },
  },
  minimalClean: {
    name: 'Minimal Clean',
    style: {
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 500,
      color: '#FFFFFF',
      lineHeight: 1.4,
      letterSpacing: 0,
      stroke: { color: '#000000', width: 0 },
      shadow: { color: 'rgba(0,0,0,0.3)', blur: 5, offsetX: 1, offsetY: 1 },
    },
  },
  viralTikTok: {
    name: 'Viral TikTok',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 64,
      fontWeight: 800,
      color: '#FFFF00',
      lineHeight: 1.1,
      letterSpacing: 1,
      stroke: { color: '#000000', width: 6 },
      shadow: { color: 'rgba(0,0,0,0.8)', blur: 8, offsetX: 3, offsetY: 3 },
    },
  },
  professional: {
    name: 'Professional',
    style: {
      fontFamily: 'Roboto',
      fontSize: 40,
      fontWeight: 500,
      color: '#FFFFFF',
      lineHeight: 1.5,
      letterSpacing: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 20,
      stroke: { color: '#000000', width: 0 },
      shadow: { color: 'rgba(0,0,0,0)', blur: 0, offsetX: 0, offsetY: 0 },
    },
  },
  neonGlow: {
    name: 'Neon Glow',
    style: {
      fontFamily: 'Oswald',
      fontSize: 56,
      fontWeight: 700,
      color: '#00FFFF',
      lineHeight: 1.3,
      letterSpacing: 4,
      stroke: { color: '#00FFFF', width: 2 },
      shadow: { color: '#00FFFF', blur: 20, offsetX: 0, offsetY: 0 },
    },
  },
  cinematic: {
    name: 'Cinematic',
    style: {
      fontFamily: 'Playfair Display',
      fontSize: 52,
      fontWeight: 700,
      color: '#FFFFFF',
      lineHeight: 1.4,
      letterSpacing: 3,
      stroke: { color: '#000000', width: 0 },
      shadow: { color: 'rgba(0,0,0,0.6)', blur: 15, offsetX: 4, offsetY: 4 },
    },
  },
  gaming: {
    name: 'Gaming',
    style: {
      fontFamily: 'Bebas Neue',
      fontSize: 68,
      fontWeight: 800,
      color: '#FF3333',
      lineHeight: 1.2,
      letterSpacing: 3,
      stroke: { color: '#FFFFFF', width: 5 },
      shadow: { color: 'rgba(255,51,51,0.8)', blur: 15, offsetX: 0, offsetY: 0 },
    },
  },
  elegant: {
    name: 'Elegant',
    style: {
      fontFamily: 'Lato',
      fontSize: 44,
      fontWeight: 400,
      color: '#F5F5F5',
      lineHeight: 1.6,
      letterSpacing: 8,
      stroke: { color: '#000000', width: 0 },
      shadow: { color: 'rgba(0,0,0,0.4)', blur: 8, offsetX: 2, offsetY: 2 },
    },
  },
  youtubeTitle: {
    name: 'YouTube Title',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 58,
      fontWeight: 800,
      color: '#FFFFFF',
      lineHeight: 1.3,
      letterSpacing: 1,
      backgroundColor: 'rgba(255,0,0,0.9)',
      padding: 24,
      stroke: { color: '#000000', width: 0 },
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 3, offsetY: 3 },
    },
  },
  subtitle: {
    name: 'Subtitle',
    style: {
      fontFamily: 'Open Sans',
      fontSize: 36,
      fontWeight: 600,
      color: '#FFFFFF',
      lineHeight: 1.5,
      letterSpacing: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      padding: 12,
      stroke: { color: '#000000', width: 0 },
      shadow: { color: 'rgba(0,0,0,0)', blur: 0, offsetX: 0, offsetY: 0 },
    },
  },
  retro: {
    name: 'Retro',
    style: {
      fontFamily: 'Bebas Neue',
      fontSize: 60,
      fontWeight: 700,
      color: '#FF00FF',
      lineHeight: 1.2,
      letterSpacing: 5,
      stroke: { color: '#00FFFF', width: 3 },
      shadow: { color: '#FF00FF', blur: 12, offsetX: 4, offsetY: 4 },
    },
  },
  modernMinimal: {
    name: 'Modern Minimal',
    style: {
      fontFamily: 'Raleway',
      fontSize: 46,
      fontWeight: 300,
      color: '#FFFFFF',
      lineHeight: 1.5,
      letterSpacing: 6,
      stroke: { color: '#000000', width: 0 },
      shadow: { color: 'rgba(0,0,0,0.2)', blur: 4, offsetX: 1, offsetY: 1 },
    },
  },
} as const;

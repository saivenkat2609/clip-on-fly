import { create } from 'zustand';
import { EditorState, TextLayer, ImageLayer, ShapeLayer, CustomPreset } from './types';

interface EditorStore extends EditorState {
  // Custom Presets
  customPresets: CustomPreset[];

  // Multi-select
  selectedLayerIds: string[];

  // Clipboard
  clipboard: (TextLayer | ImageLayer | ShapeLayer) | null;

  // Actions
  addLayer: (layer: TextLayer | ImageLayer | ShapeLayer) => void;
  updateLayer: (layerId: string, updates: Partial<TextLayer | ImageLayer | ShapeLayer>) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  reorderLayer: (layerId: string, newIndex: number) => void;
  bringToFront: (layerId: string) => void;
  bringForward: (layerId: string) => void;
  sendBackward: (layerId: string) => void;
  sendToBack: (layerId: string) => void;
  selectLayer: (layerId: string | null) => void;
  toggleLayerSelection: (layerId: string) => void;
  selectMultipleLayers: (layerIds: string[]) => void;
  clearSelection: () => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setCurrentTime: (time: number) => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  resetEditor: () => void;
  loadEditorState: (state: Partial<EditorState>) => void;
  exportState: () => EditorState;
  exportForBackend: () => any;
  validateExportState: () => { valid: boolean; errors: string[] };

  // Clipboard Actions
  copyLayer: (layerId: string) => void;
  pasteLayer: () => void;

  // Group Actions
  groupSelectedLayers: () => void;
  ungroupLayers: (groupId: string) => void;
  getLayerGroup: (layerId: string) => string | null;

  // Custom Preset Actions
  loadCustomPresets: () => void;
  saveCustomPreset: (name: string, style: TextLayer['style']) => void;
  deleteCustomPreset: (id: string) => void;

  // Timeline Actions
  splitLayerAtTime: (layerId: string, splitTime: number) => void;
  rippleDeleteLayer: (layerId: string) => void;
}

const initialState: EditorState = {
  version: '1.0',
  videoMetadata: {
    duration: 0,
    resolution: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
  },
  layers: [],
  currentTime: 0,
  selectedLayerId: null,
  history: {
    past: [],
    future: [],
  },
  settings: {
    snapToGrid: false,
    showGrid: false,
    gridSize: 20,
  },
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,
  customPresets: [],
  selectedLayerIds: [],
  clipboard: null,
  layerGroups: {} as Record<string, string[]>, // groupId -> layerIds[]

  addLayer: (layer) => {
    const state = get();
    set({
      layers: [...state.layers, layer],
      selectedLayerId: layer.id,
    });
    get().saveHistory();
  },

  updateLayer: (layerId, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    }));
    get().saveHistory();
  },

  deleteLayer: (layerId) => {
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== layerId),
      selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
    }));
    get().saveHistory();
  },

  duplicateLayer: (layerId) => {
    const state = get();
    const layerToDuplicate = state.layers.find((l) => l.id === layerId);
    if (!layerToDuplicate) return;

    const duplicatedLayer = {
      ...layerToDuplicate,
      id: `${layerToDuplicate.id}-copy-${Date.now()}`,
      name: `${layerToDuplicate.name} (Copy)`,
      position: {
        x: layerToDuplicate.position.x + 20,
        y: layerToDuplicate.position.y + 20,
      },
    };

    set({
      layers: [...state.layers, duplicatedLayer],
      selectedLayerId: duplicatedLayer.id,
    });
    get().saveHistory();
  },

  reorderLayer: (layerId, newIndex) => {
    const state = get();
    const currentIndex = state.layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1) return;

    const newLayers = [...state.layers];
    const [removed] = newLayers.splice(currentIndex, 1);
    newLayers.splice(newIndex, 0, removed);

    set({ layers: newLayers });
    get().saveHistory();
  },

  bringToFront: (layerId) => {
    const state = get();
    const currentIndex = state.layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1 || currentIndex === state.layers.length - 1) return;

    get().reorderLayer(layerId, state.layers.length - 1);
  },

  bringForward: (layerId) => {
    const state = get();
    const currentIndex = state.layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1 || currentIndex === state.layers.length - 1) return;

    get().reorderLayer(layerId, currentIndex + 1);
  },

  sendBackward: (layerId) => {
    const state = get();
    const currentIndex = state.layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1 || currentIndex === 0) return;

    get().reorderLayer(layerId, currentIndex - 1);
  },

  sendToBack: (layerId) => {
    const state = get();
    const currentIndex = state.layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1 || currentIndex === 0) return;

    get().reorderLayer(layerId, 0);
  },

  selectLayer: (layerId) => {
    set({ selectedLayerId: layerId, selectedLayerIds: layerId ? [layerId] : [] });
  },

  toggleLayerSelection: (layerId) => {
    const state = get();
    const isSelected = state.selectedLayerIds.includes(layerId);

    if (isSelected) {
      const newSelection = state.selectedLayerIds.filter(id => id !== layerId);
      set({
        selectedLayerIds: newSelection,
        selectedLayerId: newSelection.length > 0 ? newSelection[0] : null,
      });
    } else {
      const newSelection = [...state.selectedLayerIds, layerId];
      set({
        selectedLayerIds: newSelection,
        selectedLayerId: layerId,
      });
    }
  },

  selectMultipleLayers: (layerIds) => {
    set({
      selectedLayerIds: layerIds,
      selectedLayerId: layerIds.length > 0 ? layerIds[0] : null,
    });
  },

  clearSelection: () => {
    set({ selectedLayerId: null, selectedLayerIds: [] });
  },

  toggleLayerVisibility: (layerId) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
    }));
  },

  toggleLayerLock: (layerId) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      ),
    }));
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  saveHistory: () => {
    const state = get();
    const currentState: EditorState = {
      version: state.version,
      videoMetadata: state.videoMetadata,
      layers: state.layers,
      currentTime: state.currentTime,
      selectedLayerId: state.selectedLayerId,
      history: state.history,
      settings: state.settings,
    };

    set({
      history: {
        past: [...state.history.past.slice(-49), currentState], // Keep last 50 states
        future: [],
      },
    });
  },

  undo: () => {
    const state = get();
    if (state.history.past.length === 0) return;

    const previous = state.history.past[state.history.past.length - 1];
    const newPast = state.history.past.slice(0, -1);

    set({
      ...previous,
      history: {
        past: newPast,
        future: [state as EditorState, ...state.history.future],
      },
    });
  },

  redo: () => {
    const state = get();
    if (state.history.future.length === 0) return;

    const next = state.history.future[0];
    const newFuture = state.history.future.slice(1);

    set({
      ...next,
      history: {
        past: [...state.history.past, state as EditorState],
        future: newFuture,
      },
    });
  },

  resetEditor: () => {
    set(initialState);
  },

  loadEditorState: (state) => {
    set((current) => ({
      ...current,
      ...state,
    }));
  },

  exportState: () => {
    const state = get();
    return {
      version: state.version,
      videoMetadata: state.videoMetadata,
      layers: state.layers,
      currentTime: state.currentTime,
      selectedLayerId: state.selectedLayerId,
      history: state.history,
      settings: state.settings,
    };
  },

  exportForBackend: () => {
    const state = get();

    // Export only layers with valid timing and visible state
    const exportableLayers = state.layers.filter(layer => layer.visible);

    return {
      version: state.version,
      videoMetadata: {
        duration: state.videoMetadata.duration,
        resolution: state.videoMetadata.resolution,
        aspectRatio: state.videoMetadata.aspectRatio,
      },
      layers: exportableLayers.map(layer => ({
        id: layer.id,
        type: layer.type,
        name: layer.name,
        content: layer.type === 'text' ? (layer as TextLayer).content : undefined,
        timing: {
          start: layer.timing.start,
          end: layer.timing.end,
        },
        position: {
          x: layer.position.x,
          y: layer.position.y,
        },
        transform: {
          rotation: layer.transform.rotation,
          scaleX: layer.transform.scaleX,
          scaleY: layer.transform.scaleY,
        },
        style: layer.type === 'text' ? {
          fontSize: (layer as TextLayer).style.fontSize,
          fontFamily: (layer as TextLayer).style.fontFamily,
          fontWeight: (layer as TextLayer).style.fontWeight,
          color: (layer as TextLayer).style.color,
          textAlign: (layer as TextLayer).style.textAlign,
          stroke: (layer as TextLayer).style.stroke,
          strokeWidth: (layer as TextLayer).style.strokeWidth,
          shadow: (layer as TextLayer).style.shadow,
          backgroundColor: (layer as TextLayer).style.backgroundColor,
          opacity: (layer as TextLayer).style.opacity,
        } : undefined,
      })),
      exportedAt: new Date().toISOString(),
    };
  },

  validateExportState: () => {
    const state = get();
    const errors: string[] = [];

    // Check if video metadata is valid
    if (!state.videoMetadata.duration || state.videoMetadata.duration <= 0) {
      errors.push('Invalid video duration');
    }

    // Check if there are visible layers
    const visibleLayers = state.layers.filter(l => l.visible);
    if (visibleLayers.length === 0) {
      errors.push('No visible layers to export');
    }

    // Validate each layer
    visibleLayers.forEach((layer, index) => {
      if (layer.timing.start < 0 || layer.timing.end > state.videoMetadata.duration) {
        errors.push(`Layer "${layer.name}" timing is outside video duration`);
      }
      if (layer.timing.start >= layer.timing.end) {
        errors.push(`Layer "${layer.name}" has invalid timing (start >= end)`);
      }
      if (layer.type === 'text' && !(layer as TextLayer).content) {
        errors.push(`Text layer "${layer.name}" has no content`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // Custom Preset Actions
  loadCustomPresets: () => {
    try {
      const stored = localStorage.getItem('video-editor-custom-presets');
      if (stored) {
        const presets = JSON.parse(stored) as CustomPreset[];
        // Convert string dates back to Date objects
        const parsedPresets = presets.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }));
        set({ customPresets: parsedPresets });
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  },

  saveCustomPreset: (name, style) => {
    const state = get();
    const newPreset: CustomPreset = {
      id: `preset-${Date.now()}`,
      name,
      style,
      createdAt: new Date(),
    };

    const updatedPresets = [...state.customPresets, newPreset];
    set({ customPresets: updatedPresets });

    try {
      localStorage.setItem('video-editor-custom-presets', JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to save custom preset:', error);
    }
  },

  deleteCustomPreset: (id) => {
    const state = get();
    const updatedPresets = state.customPresets.filter(p => p.id !== id);
    set({ customPresets: updatedPresets });

    try {
      localStorage.setItem('video-editor-custom-presets', JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to delete custom preset:', error);
    }
  },

  // Clipboard Actions
  copyLayer: (layerId) => {
    const state = get();
    const layerToCopy = state.layers.find(l => l.id === layerId);
    if (!layerToCopy) return;

    // Deep clone the layer
    set({ clipboard: JSON.parse(JSON.stringify(layerToCopy)) });
  },

  pasteLayer: () => {
    const state = get();
    if (!state.clipboard) return;

    // Create a new layer from clipboard with new ID and offset position
    const pastedLayer = {
      ...state.clipboard,
      id: `${state.clipboard.id}-paste-${Date.now()}`,
      name: `${state.clipboard.name} (Pasted)`,
      position: {
        x: state.clipboard.position.x + 20,
        y: state.clipboard.position.y + 20,
      },
    };

    set({
      layers: [...state.layers, pastedLayer],
      selectedLayerId: pastedLayer.id,
    });
    get().saveHistory();
  },

  // Group Actions
  groupSelectedLayers: () => {
    const state = get();
    if (state.selectedLayerIds.length < 2) return;

    const groupId = `group-${Date.now()}`;
    const layerGroups = { ...(state as any).layerGroups };
    layerGroups[groupId] = [...state.selectedLayerIds];

    // Update layer names to show they're grouped
    const updatedLayers = state.layers.map(layer => {
      if (state.selectedLayerIds.includes(layer.id)) {
        return {
          ...layer,
          name: layer.name.includes('(Grouped)') ? layer.name : `${layer.name} (Grouped)`,
        };
      }
      return layer;
    });

    set({
      layers: updatedLayers,
      layerGroups
    } as any);
    get().saveHistory();
  },

  ungroupLayers: (groupId) => {
    const state = get();
    const layerGroups = { ...(state as any).layerGroups };
    const groupLayerIds = layerGroups[groupId] || [];

    // Remove "(Grouped)" from layer names
    const updatedLayers = state.layers.map(layer => {
      if (groupLayerIds.includes(layer.id)) {
        return {
          ...layer,
          name: layer.name.replace(' (Grouped)', ''),
        };
      }
      return layer;
    });

    delete layerGroups[groupId];

    set({
      layers: updatedLayers,
      layerGroups
    } as any);
    get().saveHistory();
  },

  getLayerGroup: (layerId) => {
    const state = get();
    const layerGroups = (state as any).layerGroups || {};

    for (const [groupId, layerIds] of Object.entries(layerGroups)) {
      if ((layerIds as string[]).includes(layerId)) {
        return groupId;
      }
    }
    return null;
  },

  // Timeline Actions
  splitLayerAtTime: (layerId, splitTime) => {
    const state = get();
    const layerToSplit = state.layers.find(l => l.id === layerId);
    if (!layerToSplit) return;

    // Check if split time is within layer's timing
    if (splitTime <= layerToSplit.timing.start || splitTime >= layerToSplit.timing.end) {
      return;
    }

    // Create first part (original layer with updated end time)
    const firstPart = {
      ...layerToSplit,
      timing: {
        start: layerToSplit.timing.start,
        end: splitTime,
      },
    };

    // Create second part (new layer)
    const secondPart = {
      ...layerToSplit,
      id: `${layerToSplit.id}-split-${Date.now()}`,
      name: `${layerToSplit.name} (Part 2)`,
      timing: {
        start: splitTime,
        end: layerToSplit.timing.end,
      },
    };

    // Update layers: replace original with first part and add second part
    const updatedLayers = state.layers.map(l =>
      l.id === layerId ? firstPart : l
    );

    // Insert second part right after the first
    const index = updatedLayers.findIndex(l => l.id === layerId);
    updatedLayers.splice(index + 1, 0, secondPart);

    set({ layers: updatedLayers });
    get().saveHistory();
  },

  rippleDeleteLayer: (layerId) => {
    const state = get();
    const layerToDelete = state.layers.find(l => l.id === layerId);
    if (!layerToDelete) return;

    const deletedDuration = layerToDelete.timing.end - layerToDelete.timing.start;
    const deletedEnd = layerToDelete.timing.end;

    // Filter out the deleted layer and shift subsequent layers
    const updatedLayers = state.layers
      .filter(l => l.id !== layerId)
      .map(layer => {
        // If layer starts after the deleted layer ends, shift it left
        if (layer.timing.start >= deletedEnd) {
          return {
            ...layer,
            timing: {
              start: layer.timing.start - deletedDuration,
              end: layer.timing.end - deletedDuration,
            },
          };
        }
        return layer;
      });

    set({
      layers: updatedLayers,
      selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
    });
    get().saveHistory();
  },
}));

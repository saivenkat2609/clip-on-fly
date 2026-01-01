import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock, Unlock, Type, Image as ImageIcon, Square, Copy, Trash2, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Layers, GripVertical, Check } from 'lucide-react';
import { useEditorStore } from '@/lib/videoEditor/editorStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function LayersPanel() {
  const {
    layers,
    selectedLayerId,
    selectedLayerIds,
    selectLayer,
    toggleLayerSelection,
    toggleLayerVisibility,
    toggleLayerLock,
    duplicateLayer,
    deleteLayer,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    reorderLayer,
  } = useEditorStore();

  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'shape':
        return <Square className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  const handleDelete = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLayer(layerId);
    toast.success('Layer deleted');
  };

  const handleDuplicate = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateLayer(layerId);
    toast.success('Layer duplicated');
  };

  const handleBringToFront = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    bringToFront(layerId);
    toast.success('Moved to front');
  };

  const handleBringForward = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    bringForward(layerId);
  };

  const handleSendBackward = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sendBackward(layerId);
  };

  const handleSendToBack = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sendToBack(layerId);
    toast.success('Moved to back');
  };

  const getLayerIndex = (layerId: string) => {
    return layers.findIndex((l) => l.id === layerId);
  };

  const isFirstLayer = (layerId: string) => getLayerIndex(layerId) === 0;
  const isLastLayer = (layerId: string) => getLayerIndex(layerId) === layers.length - 1;

  // Drag and Drop Handlers
  const handleDragStart = (layerId: string, e: React.DragEvent) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerId);
  };

  const handleDragOver = (layerId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedLayerId && draggedLayerId !== layerId) {
      setDragOverLayerId(layerId);
    }
  };

  const handleDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleDrop = (targetLayerId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetLayerId) return;

    const draggedIndex = getLayerIndex(draggedLayerId);
    const targetIndex = getLayerIndex(targetLayerId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      reorderLayer(draggedLayerId, targetIndex);
      toast.success('Layer reordered');
    }

    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  // Handle layer selection with multi-select support
  const handleLayerClick = (layerId: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+Click for multi-select
      toggleLayerSelection(layerId);
    } else {
      // Regular click
      selectLayer(layerId);
    }
  };

  // Bulk delete selected layers
  const handleBulkDelete = () => {
    selectedLayerIds.forEach(id => deleteLayer(id));
    toast.success(`Deleted ${selectedLayerIds.length} layers`);
  };

  // Bulk visibility toggle
  const handleBulkToggleVisibility = () => {
    selectedLayerIds.forEach(id => toggleLayerVisibility(id));
    toast.success(`Toggled visibility for ${selectedLayerIds.length} layers`);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
      <div className="px-4 py-3 border-b bg-background/95 backdrop-blur">
        {selectedLayerIds.length > 1 ? (
          // Bulk operations mode
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                <Check className="h-4 w-4" />
                {selectedLayerIds.length} Selected
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => useEditorStore.getState().clearSelection()}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkToggleVisibility}
                className="flex-1 h-7 text-xs hover:bg-primary/10"
              >
                <Eye className="h-3 w-3 mr-1" />
                Toggle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="flex-1 h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          // Normal mode
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Layers
            </h3>
            <span className="text-xs text-muted-foreground">
              {layers.length} {layers.length === 1 ? 'layer' : 'layers'}
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[200px]">
              <Type className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No layers yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click the Text button to add a layer
              </p>
            </div>
          ) : (
            layers.map((layer) => (
              <div
                key={layer.id}
                draggable
                onDragStart={(e) => handleDragStart(layer.id, e)}
                onDragOver={(e) => handleDragOver(layer.id, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(layer.id, e)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group relative rounded-lg cursor-pointer transition-all duration-200',
                  'hover:bg-muted/50 hover:shadow-sm',
                  selectedLayerId === layer.id && 'bg-primary/10 ring-2 ring-primary/30 shadow-md',
                  selectedLayerIds.includes(layer.id) && selectedLayerId !== layer.id && 'bg-primary/5 ring-1 ring-primary/20',
                  draggedLayerId === layer.id && 'opacity-50 cursor-grabbing',
                  dragOverLayerId === layer.id && 'border-2 border-primary border-dashed'
                )}
                onClick={(e) => handleLayerClick(layer.id, e)}
              >
                {/* Main Layer Content */}
                <div className="flex items-center gap-2 p-2">
                  {/* Drag Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity"
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Layer Icon with multi-select indicator */}
                  <div className="relative">
                    <div className={cn(
                      "p-1.5 rounded bg-background border transition-colors",
                      selectedLayerId === layer.id ? "text-primary border-primary/50" : "text-muted-foreground border-border"
                    )}>
                      {getLayerIcon(layer.type)}
                    </div>
                    {selectedLayerIds.includes(layer.id) && selectedLayerIds.length > 1 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Layer Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{layer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {layer.timing.start.toFixed(1)}s - {layer.timing.end.toFixed(1)}s
                    </p>
                  </div>

                  {/* Quick Actions (always visible on selected, hover on others) */}
                  <div className={cn(
                    "flex items-center gap-0.5 transition-opacity",
                    selectedLayerId === layer.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:scale-110 transition-transform duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:scale-110 transition-transform duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerLock(layer.id);
                      }}
                      title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {layer.locked ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Z-Index Controls (only visible when selected) */}
                {selectedLayerId === layer.id && (
                  <>
                    <Separator className="my-1" />
                    <div className="px-2 pb-2 space-y-1">
                      <div className="flex items-center gap-1">
                        {/* Arrange buttons */}
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-primary/10"
                            onClick={(e) => handleBringToFront(layer.id, e)}
                            disabled={isLastLayer(layer.id)}
                            title="Bring to front"
                          >
                            <ChevronsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-primary/10"
                            onClick={(e) => handleBringForward(layer.id, e)}
                            disabled={isLastLayer(layer.id)}
                            title="Bring forward"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-primary/10"
                            onClick={(e) => handleSendBackward(layer.id, e)}
                            disabled={isFirstLayer(layer.id)}
                            title="Send backward"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-primary/10"
                            onClick={(e) => handleSendToBack(layer.id, e)}
                            disabled={isFirstLayer(layer.id)}
                            title="Send to back"
                          >
                            <ChevronsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Duplicate & Delete */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs hover:bg-primary/10 hover:scale-105 transition-all"
                          onClick={(e) => handleDuplicate(layer.id, e)}
                          title="Duplicate layer"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all"
                          onClick={(e) => handleDelete(layer.id, e)}
                          title="Delete layer"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Layer Count Footer */}
      {layers.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 backdrop-blur">
          <p className="text-xs text-muted-foreground text-center">
            {selectedLayerIds.length > 1 ? (
              <span className="font-medium text-primary">
                {selectedLayerIds.length} layers selected
              </span>
            ) : selectedLayerId ? (
              <span>
                Selected: {layers.find(l => l.id === selectedLayerId)?.name}
              </span>
            ) : (
              'None'
            )}
          </p>
          {selectedLayerIds.length > 1 && (
            <p className="text-[10px] text-muted-foreground/70 text-center mt-0.5">
              Hold Shift to multi-select
            </p>
          )}
        </div>
      )}
    </div>
  );
}

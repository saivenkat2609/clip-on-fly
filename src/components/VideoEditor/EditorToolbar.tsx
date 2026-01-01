import { Button } from '@/components/ui/button';
import { Type, Image, Square, Sparkles, FileVideo } from 'lucide-react';
import { useEditorStore } from '@/lib/videoEditor/editorStore';
import { createDefaultTextLayer } from '@/lib/videoEditor/utils';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  onShowShortcuts?: () => void;
}

export function EditorToolbar({ onShowShortcuts }: EditorToolbarProps) {
  const { addLayer, currentTime } = useEditorStore();

  const handleAddText = () => {
    const newTextLayer = createDefaultTextLayer(currentTime);
    addLayer(newTextLayer);
    toast.success('Text layer added', {
      description: 'Double-click to edit text',
      duration: 2000,
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Title */}
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
        Tools
      </div>

      <Separator className="w-8" />

      {/* Add Text Button - Active */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-12 h-12 p-0 flex flex-col items-center justify-center gap-1",
          "hover:bg-primary/10 hover:scale-110 hover:shadow-lg",
          "transition-all duration-200 rounded-lg",
          "border-2 border-transparent hover:border-primary/30"
        )}
        onClick={handleAddText}
        title="Add Text Layer (T)"
      >
        <div className="relative">
          <Type className="h-5 w-5" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
        <span className="text-[10px] font-medium">Text</span>
      </Button>

      <Separator className="w-8" />

      {/* Coming Soon Section */}
      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wide px-1">
        Soon
      </div>

      {/* Future tools - Image */}
      <div className="relative group">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-12 h-12 p-0 flex flex-col items-center justify-center gap-1",
            "rounded-lg opacity-40 cursor-not-allowed",
            "group-hover:opacity-60 transition-opacity duration-200"
          )}
          disabled
          title="Image Layer - Coming Soon"
        >
          <Image className="h-5 w-5" />
          <span className="text-[10px]">Image</span>
        </Button>
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-popover border rounded px-2 py-1 text-[10px] text-muted-foreground whitespace-nowrap shadow-lg">
            Coming Soon
          </div>
        </div>
      </div>

      {/* Future tools - Shape */}
      <div className="relative group">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-12 h-12 p-0 flex flex-col items-center justify-center gap-1",
            "rounded-lg opacity-40 cursor-not-allowed",
            "group-hover:opacity-60 transition-opacity duration-200"
          )}
          disabled
          title="Shape Layer - Coming Soon"
        >
          <Square className="h-5 w-5" />
          <span className="text-[10px]">Shape</span>
        </Button>
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-popover border rounded px-2 py-1 text-[10px] text-muted-foreground whitespace-nowrap shadow-lg">
            Coming Soon
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      <Separator className="w-8" />

      {/* Help/Info Section */}
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-10 w-10 rounded-lg bg-muted/30 hover:bg-primary/10 hover:scale-110 transition-all duration-200"
        onClick={onShowShortcuts}
        title="Keyboard Shortcuts (?)"
      >
        <Sparkles className="h-4 w-4 text-primary" />
      </Button>
    </div>
  );
}

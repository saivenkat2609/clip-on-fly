import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Command, Keyboard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: ['Esc'], description: 'Deselect layer / Close editor' },
        { keys: ['Ctrl', 'Z'], description: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
        { keys: ['Ctrl', 'Y'], description: 'Redo (alternative)' },
      ],
    },
    {
      category: 'Layers',
      items: [
        { keys: ['T'], description: 'Add text layer' },
        { keys: ['Ctrl', 'D'], description: 'Duplicate selected layer' },
        { keys: ['Delete'], description: 'Delete selected layer' },
        { keys: ['Backspace'], description: 'Delete selected layer (alt)' },
      ],
    },
    {
      category: 'Positioning',
      items: [
        { keys: ['←'], description: 'Move layer left (1px)' },
        { keys: ['→'], description: 'Move layer right (1px)' },
        { keys: ['↑'], description: 'Move layer up (1px)' },
        { keys: ['↓'], description: 'Move layer down (1px)' },
        { keys: ['Shift', '←→↑↓'], description: 'Move layer (10px)' },
      ],
    },
    {
      category: 'Playback',
      items: [
        { keys: ['Space'], description: 'Play / Pause video' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Speed up your workflow with these keyboard shortcuts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {shortcuts.map((section, index) => (
              <div key={section.category}>
                {index > 0 && <Separator className="my-4" />}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <div key={keyIdx} className="flex items-center gap-1">
                              <kbd className="px-2.5 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm min-w-[2rem] text-center">
                                {key}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span className="text-xs text-muted-foreground font-medium">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tips */}
          <Separator className="my-6" />
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Command className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-2">Pro Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Hold <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Shift</kbd> while using arrow keys to move layers 10x faster</li>
                  <li>• Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">T</kbd> to quickly add a text layer at the current time</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> twice - first to deselect, second to close</li>
                  <li>• Arrow keys only work when a layer is selected and unlocked</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

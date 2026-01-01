import { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/videoEditor/editorStore';
import { TextLayer } from '@/lib/videoEditor/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AVAILABLE_FONTS, FONT_WEIGHTS, TEXT_PRESETS } from '@/lib/videoEditor/types';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlignLeft, AlignCenter, AlignRight, Palette, Sparkles, X, Save, Trash2, Star, Clock, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export function PropertiesPanel() {
  const {
    layers,
    selectedLayerId,
    updateLayer,
    customPresets,
    loadCustomPresets,
    saveCustomPreset,
    deleteCustomPreset,
  } = useEditorStore();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [strokeColorPickerOpen, setStrokeColorPickerOpen] = useState(false);
  const [shadowColorPickerOpen, setShadowColorPickerOpen] = useState(false);
  const [bgColorPickerOpen, setBgColorPickerOpen] = useState(false);
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load custom presets on mount
  useEffect(() => {
    loadCustomPresets();
  }, [loadCustomPresets]);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  if (!selectedLayer) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
        <div className="px-4 py-3 border-b bg-background/95 backdrop-blur">
          <h3 className="font-semibold text-sm">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-3">
            <Palette className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Select a layer to edit properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedLayer.type !== 'text') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
        <div className="px-4 py-3 border-b bg-background/95 backdrop-blur">
          <h3 className="font-semibold text-sm">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-3">
            <Sparkles className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Properties for this layer type coming soon
            </p>
          </div>
        </div>
      </div>
    );
  }

  const textLayer = selectedLayer as TextLayer;

  const handleStyleUpdate = (updates: Partial<TextLayer['style']>) => {
    updateLayer(selectedLayer.id, {
      style: {
        ...textLayer.style,
        ...updates,
      },
    });
  };

  const applyPreset = (presetKey: keyof typeof TEXT_PRESETS) => {
    const preset = TEXT_PRESETS[presetKey];
    updateLayer(selectedLayer.id, {
      style: {
        ...textLayer.style,
        ...preset.style,
      },
    });
  };

  const removeBgColor = () => {
    const { backgroundColor, ...restStyle } = textLayer.style;
    updateLayer(selectedLayer.id, { style: restStyle });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    saveCustomPreset(presetName.trim(), textLayer.style);
    toast.success(`Preset "${presetName.trim()}" saved!`);
    setPresetName('');
    setSavePresetDialogOpen(false);
  };

  const applyCustomPreset = (presetId: string) => {
    const preset = customPresets.find(p => p.id === presetId);
    if (!preset) return;

    updateLayer(selectedLayer.id, {
      style: {
        ...textLayer.style,
        ...preset.style,
      },
    });
    toast.success(`Applied preset "${preset.name}"`);
  };

  const handleDeletePreset = (presetId: string, presetName: string) => {
    deleteCustomPreset(presetId);
    toast.success(`Deleted preset "${presetName}"`);
  };

  // Timing presets
  const applyTimingPreset = (preset: 'first5' | 'last5' | 'full') => {
    const duration = useEditorStore.getState().videoMetadata.duration;
    let start = 0;
    let end = duration;

    switch (preset) {
      case 'first5':
        start = 0;
        end = Math.min(5, duration);
        break;
      case 'last5':
        start = Math.max(0, duration - 5);
        end = duration;
        break;
      case 'full':
        start = 0;
        end = duration;
        break;
    }

    updateLayer(selectedLayer.id, {
      timing: { start, end },
    });
    toast.success(`Applied "${preset === 'first5' ? 'First 5s' : preset === 'last5' ? 'Last 5s' : 'Full Duration'}" preset`);
  };

  const toggleShowThroughout = (checked: boolean) => {
    const duration = useEditorStore.getState().videoMetadata.duration;
    if (checked) {
      updateLayer(selectedLayer.id, {
        timing: { start: 0, end: duration },
      });
      toast.success('Text will show throughout video');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
      <div className="px-4 py-3 border-b bg-background/95 backdrop-blur">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Text Properties
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Text Content */}
          <div className="space-y-2">
            <Label htmlFor="text-content" className="text-xs font-medium">Text Content</Label>
            <Input
              id="text-content"
              value={textLayer.content}
              onChange={(e) =>
                updateLayer(selectedLayer.id, { content: e.target.value })
              }
              placeholder="Enter text..."
              className="font-medium"
            />
          </div>

          {/* Presets - Scrollable Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Quick Presets
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
              {Object.entries(TEXT_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(key as keyof typeof TEXT_PRESETS)}
                  className="text-xs hover:scale-105 transition-transform duration-200 hover:bg-primary/10 hover:border-primary/50"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                My Presets
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSavePresetDialogOpen(true)}
                className="h-7 text-xs hover:bg-primary/10 hover:border-primary/50"
              >
                <Save className="h-3 w-3 mr-1" />
                Save Current
              </Button>
            </div>
            {customPresets.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyCustomPreset(preset.id)}
                      className="flex-1 justify-start text-xs h-auto py-2 hover:bg-transparent"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(preset.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePreset(preset.id, preset.name)}
                      className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4 border rounded-lg bg-muted/20">
                No custom presets yet
              </div>
            )}
          </div>

          {/* Accordion for Organized Sections */}
          <Accordion type="multiple" defaultValue={["typography", "colors", "timing"]} className="space-y-2">
            {/* Typography Section */}
            <AccordionItem value="typography" className="border rounded-lg px-3 bg-background/50">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline py-2">
                Typography
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-3">
                {/* Font Family */}
                <div className="space-y-1.5">
                  <Label htmlFor="font-family" className="text-xs">Font</Label>
                  <Select
                    value={textLayer.style.fontFamily}
                    onValueChange={(value) =>
                      handleStyleUpdate({ fontFamily: value })
                    }
                  >
                    <SelectTrigger id="font-family" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FONTS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="font-size" className="text-xs">Font Size</Label>
                    <span className="text-xs font-mono text-muted-foreground">{textLayer.style.fontSize}px</span>
                  </div>
                  <Slider
                    id="font-size"
                    min={12}
                    max={200}
                    step={1}
                    value={[textLayer.style.fontSize]}
                    onValueChange={([value]) =>
                      handleStyleUpdate({ fontSize: value })
                    }
                    className="py-1"
                  />
                </div>

                {/* Font Weight */}
                <div className="space-y-1.5">
                  <Label htmlFor="font-weight" className="text-xs">Weight</Label>
                  <Select
                    value={textLayer.style.fontWeight.toString()}
                    onValueChange={(value) =>
                      handleStyleUpdate({ fontWeight: parseInt(value, 10) })
                    }
                  >
                    <SelectTrigger id="font-weight" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_WEIGHTS.map((weight) => (
                        <SelectItem key={weight} value={weight.toString()}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Line Height */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="line-height" className="text-xs">Line Height</Label>
                    <span className="text-xs font-mono text-muted-foreground">{textLayer.style.lineHeight.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="line-height"
                    min={0.8}
                    max={2.5}
                    step={0.1}
                    value={[textLayer.style.lineHeight || 1.2]}
                    onValueChange={([value]) =>
                      handleStyleUpdate({ lineHeight: value })
                    }
                    className="py-1"
                  />
                </div>

                {/* Letter Spacing */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="letter-spacing" className="text-xs">Letter Spacing</Label>
                    <span className="text-xs font-mono text-muted-foreground">{textLayer.style.letterSpacing || 0}px</span>
                  </div>
                  <Slider
                    id="letter-spacing"
                    min={-5}
                    max={50}
                    step={0.5}
                    value={[textLayer.style.letterSpacing || 0]}
                    onValueChange={([value]) =>
                      handleStyleUpdate({ letterSpacing: value })
                    }
                    className="py-1"
                  />
                </div>

                {/* Text Alignment */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Alignment</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={textLayer.style.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => handleStyleUpdate({ textAlign: 'left' })}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={textLayer.style.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => handleStyleUpdate({ textAlign: 'center' })}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={textLayer.style.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => handleStyleUpdate({ textAlign: 'right' })}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Colors Section */}
            <AccordionItem value="colors" className="border rounded-lg px-3 bg-background/50">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline py-2">
                Colors & Effects
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-3">
                {/* Text Color */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Text Color</Label>
                  <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-9 hover:bg-accent"
                      >
                        <div
                          className="w-6 h-6 rounded border-2 border-background shadow-sm"
                          style={{ backgroundColor: textLayer.style.color }}
                        />
                        <span className="text-xs font-mono">{textLayer.style.color}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <HexColorPicker
                        color={textLayer.style.color}
                        onChange={(color) => handleStyleUpdate({ color })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Background Color */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Background Color</Label>
                    {textLayer.style.backgroundColor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={removeBgColor}
                        title="Remove background"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Popover open={bgColorPickerOpen} onOpenChange={setBgColorPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-9 hover:bg-accent"
                      >
                        <div
                          className="w-6 h-6 rounded border-2 border-background shadow-sm"
                          style={{ backgroundColor: textLayer.style.backgroundColor || 'transparent' }}
                        />
                        <span className="text-xs font-mono">
                          {textLayer.style.backgroundColor || 'None'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <HexColorPicker
                        color={textLayer.style.backgroundColor || '#000000'}
                        onChange={(color) => handleStyleUpdate({ backgroundColor: color })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="opacity" className="text-xs">Opacity</Label>
                    <span className="text-xs font-mono text-muted-foreground">{Math.round(textLayer.opacity * 100)}%</span>
                  </div>
                  <Slider
                    id="opacity"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[textLayer.opacity]}
                    onValueChange={([value]) =>
                      updateLayer(selectedLayer.id, { opacity: value })
                    }
                    className="py-1"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Stroke & Shadow Section */}
            <AccordionItem value="effects" className="border rounded-lg px-3 bg-background/50">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline py-2">
                Stroke & Shadow
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-3">
                {/* Stroke Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="stroke-width" className="text-xs">Stroke Width</Label>
                    <span className="text-xs font-mono text-muted-foreground">{textLayer.style.stroke.width}px</span>
                  </div>
                  <Slider
                    id="stroke-width"
                    min={0}
                    max={10}
                    step={0.5}
                    value={[textLayer.style.stroke.width]}
                    onValueChange={([value]) =>
                      handleStyleUpdate({
                        stroke: { ...textLayer.style.stroke, width: value },
                      })
                    }
                    className="py-1"
                  />
                </div>

                {/* Stroke Color */}
                {textLayer.style.stroke.width > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stroke Color</Label>
                    <Popover
                      open={strokeColorPickerOpen}
                      onOpenChange={setStrokeColorPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 h-9 hover:bg-accent"
                        >
                          <div
                            className="w-6 h-6 rounded border-2 border-background shadow-sm"
                            style={{ backgroundColor: textLayer.style.stroke.color }}
                          />
                          <span className="text-xs font-mono">{textLayer.style.stroke.color}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <HexColorPicker
                          color={textLayer.style.stroke.color}
                          onChange={(color) =>
                            handleStyleUpdate({
                              stroke: { ...textLayer.style.stroke, color },
                            })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Shadow Blur */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="shadow-blur" className="text-xs">Shadow Blur</Label>
                    <span className="text-xs font-mono text-muted-foreground">{textLayer.style.shadow.blur}px</span>
                  </div>
                  <Slider
                    id="shadow-blur"
                    min={0}
                    max={30}
                    step={1}
                    value={[textLayer.style.shadow.blur]}
                    onValueChange={([value]) =>
                      handleStyleUpdate({
                        shadow: { ...textLayer.style.shadow, blur: value },
                      })
                    }
                    className="py-1"
                  />
                </div>

                {/* Shadow Offset X */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="shadow-x" className="text-xs">Shadow Offset X</Label>
                    <span className="text-xs font-mono text-muted-foreground">{textLayer.style.shadow.offsetX}px</span>
                  </div>
                  <Slider
                    id="shadow-x"
                    min={-20}
                    max={20}
                    step={1}
                    value={[textLayer.style.shadow.offsetX]}
                    onValueChange={([value]) =>
                      handleStyleUpdate({
                        shadow: { ...textLayer.style.shadow, offsetX: value },
                      })
                    }
                    className="py-1"
                  />
                </div>

                {/* Shadow Offset Y */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="shadow-y" className="text-xs">Shadow Offset Y</Label>
                    <span className="text-xs font-mono text-muted-foreground">{textLayer.style.shadow.offsetY}px</span>
                  </div>
                  <Slider
                    id="shadow-y"
                    min={-20}
                    max={20}
                    step={1}
                    value={[textLayer.style.shadow.offsetY]}
                    onValueChange={([value]) =>
                      handleStyleUpdate({
                        shadow: { ...textLayer.style.shadow, offsetY: value },
                      })
                    }
                    className="py-1"
                  />
                </div>

                {/* Shadow Color */}
                {textLayer.style.shadow.blur > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Shadow Color</Label>
                    <Popover
                      open={shadowColorPickerOpen}
                      onOpenChange={setShadowColorPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 h-9 hover:bg-accent"
                        >
                          <div
                            className="w-6 h-6 rounded border-2 border-background shadow-sm"
                            style={{ backgroundColor: textLayer.style.shadow.color }}
                          />
                          <span className="text-xs font-mono">{textLayer.style.shadow.color}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <HexColorPicker
                          color={textLayer.style.shadow.color}
                          onChange={(color) =>
                            handleStyleUpdate({
                              shadow: { ...textLayer.style.shadow, color },
                            })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Timing Section */}
            <AccordionItem value="timing" className="border rounded-lg px-3 bg-background/50">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline py-2">
                Timing
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-3">
                {/* Show Throughout Video Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Infinity className="h-4 w-4 text-primary" />
                    <div>
                      <Label htmlFor="show-throughout" className="text-xs font-medium cursor-pointer">
                        Show Throughout Video
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Display from start to end
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-throughout"
                    checked={textLayer.timing.start === 0 && textLayer.timing.end === useEditorStore.getState().videoMetadata.duration}
                    onCheckedChange={toggleShowThroughout}
                  />
                </div>

                {/* Timing Presets */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Quick Timing
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTimingPreset('first5')}
                      className="text-xs hover:scale-105 transition-transform duration-200 hover:bg-primary/10 hover:border-primary/50"
                    >
                      First 5s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTimingPreset('last5')}
                      className="text-xs hover:scale-105 transition-transform duration-200 hover:bg-primary/10 hover:border-primary/50"
                    >
                      Last 5s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTimingPreset('full')}
                      className="text-xs hover:scale-105 transition-transform duration-200 hover:bg-primary/10 hover:border-primary/50"
                    >
                      Full
                    </Button>
                  </div>
                </div>

                {/* Manual Timing Controls */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Manual Timing</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="start-time" className="text-xs">
                        Start (s)
                      </Label>
                      <Input
                        id="start-time"
                        type="number"
                        min={0}
                        step={0.1}
                        value={textLayer.timing.start}
                        onChange={(e) =>
                          updateLayer(selectedLayer.id, {
                            timing: {
                              ...textLayer.timing,
                              start: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="h-9 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-xs">
                        End (s)
                      </Label>
                      <Input
                        id="end-time"
                        type="number"
                        min={0}
                        step={0.1}
                        value={textLayer.timing.end}
                        onChange={(e) =>
                          updateLayer(selectedLayer.id, {
                            timing: {
                              ...textLayer.timing,
                              end: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="h-9 mt-1"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    Duration: {(textLayer.timing.end - textLayer.timing.start).toFixed(1)}s
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Save Preset Dialog */}
      <Dialog open={savePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Custom Preset</DialogTitle>
            <DialogDescription>
              Save your current text style as a reusable preset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., My Cool Style"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSavePreset();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSavePresetDialogOpen(false);
                setPresetName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

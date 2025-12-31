import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Type,
  Layers,
  Clock,
  Palette,
  Keyboard,
  Download,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    icon: Type,
    title: 'Adding Text Layers',
    description: 'Click the Text button in the left toolbar to add text overlays to your video. Each text layer can be positioned, styled, and timed independently.',
    tips: [
      'Press T key to quickly add a text layer',
      'Double-click text on canvas to edit',
      'Use Text Content field in Properties panel to edit'
    ]
  },
  {
    icon: Palette,
    title: 'Styling Text',
    description: 'Customize your text with fonts, colors, sizes, strokes, shadows, and backgrounds. Choose from 12 professional presets or create your own custom styles.',
    tips: [
      '12+ text style presets available',
      'Save your own custom presets',
      'Adjust opacity, stroke, and shadow effects'
    ]
  },
  {
    icon: Clock,
    title: 'Timing Controls',
    description: 'Control when your text appears and disappears. Use timing presets for quick setup or manually adjust start and end times.',
    tips: [
      'Use "Show Throughout Video" toggle',
      'Quick presets: First 5s, Last 5s, Full',
      'Manually set exact timing in seconds'
    ]
  },
  {
    icon: Layers,
    title: 'Layer Management',
    description: 'Organize your text layers with the Layers Panel. Drag to reorder, toggle visibility, lock layers, and use z-index controls to arrange overlays.',
    tips: [
      'Drag layers to reorder them',
      'Use eye icon to show/hide layers',
      'Lock icon prevents accidental edits'
    ]
  },
  {
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with keyboard shortcuts. Press ? to see all available shortcuts at any time.',
    tips: [
      'Ctrl+Z/Y for Undo/Redo',
      'Ctrl+D to duplicate layer',
      'Arrow keys to nudge position',
      'T to add text layer',
      'Space to play/pause'
    ]
  },
  {
    icon: Download,
    title: 'Export Your Video',
    description: 'When you\'re done editing, click Export Video to render your final video with all text overlays applied. Choose resolution, aspect ratio, and quality settings.',
    tips: [
      'File size estimation provided',
      'Multiple quality presets',
      'Processing takes 30-90 seconds',
      'Confetti animation on success! 🎉'
    ]
  }
];

export function TutorialModal({ open, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      localStorage.setItem('video-editor-tutorial-completed', 'true');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    localStorage.setItem('video-editor-tutorial-completed', 'true');
  };

  const IconComponent = step.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">Video Editor Tutorial</DialogTitle>
              <DialogDescription>
                Learn how to create amazing videos with text overlays
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Indicators */}
        <div className="flex items-center gap-2 justify-center py-2">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="py-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <IconComponent className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Pro Tips:
            </h4>
            <ul className="space-y-2">
              {step.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tutorial
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button onClick={handleNext} className="gradient-primary">
              {isLastStep ? (
                <>
                  Get Started
                  <Check className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

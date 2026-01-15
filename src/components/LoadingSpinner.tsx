/**
 * Loading spinner for lazy-loaded route components
 * Shown during code splitting while route chunks are being loaded
 * Matches the login page loader design with Sparkles icon
 */

import { Sparkles } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Sparkles icon in pulsing box */}
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary animate-pulse">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>

        {/* Animated spinner */}
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}

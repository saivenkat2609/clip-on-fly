/**
 * Standardized Color Palette for ReframeAI
 *
 * This file defines consistent color classes used throughout the application.
 * All colors use CSS variables that adapt to the selected theme.
 *
 * IMPORTANT: Use these CSS variable-based classes instead of hardcoded colors
 * to ensure consistency across all themes.
 */

export const colors = {
  // Primary Brand Color - Uses theme's primary color (adapts to selected theme)
  primary: {
    bg: 'bg-primary',
    bgLight: 'bg-primary/10',
    bgMedium: 'bg-primary/20',
    text: 'text-primary',
    border: 'border-primary/20',
    borderHover: 'hover:border-primary/40',
    gradient: 'gradient-primary',
  },

  // Success (Green) - Completed, successful states
  success: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    borderSolid: 'border-emerald-400/50',
  },

  // Warning (Amber) - Warnings, needs attention
  warning: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    borderSolid: 'border-amber-400/50',
  },

  // Error (Red) - Errors, failed states
  error: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
    borderSolid: 'border-red-400/50',
  },

  // Neutral (Slate) - Secondary elements, disabled states
  neutral: {
    bg: 'bg-slate-500',
    bgLight: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    borderSolid: 'border-slate-400/50',
  },
} as const;

/**
 * Status Badge Color Classes
 * Consistent across all pages (Dashboard, AllProjects, ProjectDetails)
 */
export const statusColors = {
  completed: 'bg-emerald-500/90 border-emerald-400/50 text-white',
  processing: 'bg-blue-500/90 border-blue-400/50 text-white',
  failed: 'bg-red-500/90 border-red-400/50 text-white',
  pending: 'bg-slate-500/90 border-slate-400/50 text-white',
} as const;

/**
 * Feature Card Colors
 * Consistent styling for feature highlights
 */
export const featureCardColors = {
  background: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
  border: 'border-blue-500/20 hover:border-blue-500/40',
  icon: 'bg-blue-500/10 group-hover:bg-blue-500/20',
  iconText: 'text-blue-600 dark:text-blue-500',
} as const;

/**
 * Virality Score Badge Colors
 */
export const viralityColors = {
  high: 'bg-emerald-500',    // >= 80
  medium: 'bg-blue-500',      // >= 60
  low: 'bg-slate-500',        // < 60
} as const;

/**
 * Processing Stage Colors
 */
export const processingStageColors = {
  completed: 'bg-emerald-500',
  active: 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/30',
  pending: 'bg-slate-300 dark:bg-slate-700',
} as const;

/**
 * Action Button Colors (Like/Dislike/Edit)
 */
export const actionColors = {
  like: {
    bg: 'bg-emerald-500 hover:bg-emerald-600',
    text: 'text-white',
  },
  dislike: {
    bg: 'bg-red-500 hover:bg-red-600',
    text: 'text-white',
  },
  edit: {
    bg: 'bg-blue-500 hover:bg-blue-600',
    text: 'text-white',
  },
} as const;

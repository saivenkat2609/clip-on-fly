/**
 * Reusable animation variants for Framer Motion
 *
 * Usage:
 * import { pageVariants, containerVariants, itemVariants } from '@/lib/animations';
 */

// Page transition animations
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// Stagger container for lists and grids
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Stagger items (children of containerVariants)
export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Card hover effect
export const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

// Counter animation for stats
export const counterVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

// Fade in animation
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Slide up animation
export const slideUpVariants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// Scale animation for modals
export const scaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
};

// Shake animation for errors
export const shakeVariants = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

// Bounce animation for success
export const bounceVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.5,
      duration: 0.6
    }
  }
};

// Progress bar animation
export const progressVariants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  })
};

// Skeleton loading animation
export const skeletonVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Notification slide in from right
export const notificationVariants = {
  initial: { opacity: 0, x: 100 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// Drag and drop zone animation
export const dragDropVariants = {
  idle: {
    scale: 1,
    borderColor: "rgb(226 232 240)" // slate-200
  },
  dragging: {
    scale: 1.05,
    borderColor: "rgb(59 130 246)", // blue-500
    transition: {
      type: "spring",
      stiffness: 300
    }
  }
};

/**
 * Get motion configuration based on user preferences
 * Respects prefers-reduced-motion and adjusts for mobile devices
 */
export const getMotionConfig = () => {
  if (typeof window === 'undefined') {
    return { duration: 0.3, type: 'tween' as const };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  return {
    duration: prefersReducedMotion ? 0 : isMobile ? 0.2 : 0.3,
    type: (prefersReducedMotion ? 'tween' : 'spring') as const
  };
};

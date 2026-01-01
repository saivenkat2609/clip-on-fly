# UI Enhancement Implementation Guide

## 🎯 Overview
Step-by-step guide for implementing UI enhancements across the ReframeAI application.

---

## 📦 Prerequisites
- ✅ Framer Motion installed: `npm install framer-motion`

---

## 🎨 Global Enhancements

### 1. Add Global Animation Variants
**File**: `src/lib/animations.ts` (NEW FILE)

Create reusable animation variants:
```typescript
// Page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Stagger container
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Stagger items
export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Card hover
export const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -5,
    transition: { type: "spring", stiffness: 300 }
  }
};

// Counter animation
export const counterVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" }
  }
};
```

---

## 🏠 Dashboard Enhancements

### File: `src/pages/Dashboard.tsx`

#### Changes to Apply:

1. **Add Imports**
```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/animations';
```

2. **Wrap Main Content**
```tsx
<motion.div
  initial="hidden"
  animate="show"
  variants={containerVariants}
>
  {/* Existing content */}
</motion.div>
```

3. **Animate Project Cards**
```tsx
{videos.map((video, index) => (
  <motion.div
    key={video.session_id}
    variants={itemVariants}
    whileHover={{ scale: 1.02, y: -5 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    {/* Existing card content */}
  </motion.div>
))}
```

4. **Add Animated Counter for Credits**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ type: "spring" }}
>
  <AnimatedCounter value={remainingMinutes} />
</motion.div>
```

5. **Skeleton Loading State**
```tsx
{isLoading && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
  >
    {[...Array(8)].map((_, i) => (
      <Skeleton key={i} className="h-64 rounded-lg" />
    ))}
  </motion.div>
)}
```

---

## 📹 Project Details Enhancements

### File: `src/pages/ProjectDetails.tsx`

#### Already Enhanced ✅
- Vertical stepper with animated progress line
- Step transitions

#### Additional Enhancements:

1. **Add Page Transition**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* Page content */}
</motion.div>
```

2. **Animate Clip Cards**
```tsx
{clips.map((clip, index) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.05, y: -10 }}
  >
    {/* Clip card content */}
  </motion.div>
))}
```

3. **Add Confetti on Completion**
```tsx
import confetti from 'canvas-confetti';

useEffect(() => {
  if (video?.status === 'completed' && clips.length > 0) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}, [video?.status]);
```

---

## ⬆️ Upload Hero Enhancements

### File: `src/components/UploadHero.tsx`

#### Changes:

1. **Animated Drag Drop Zone**
```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  animate={isDragging ? { scale: 1.05, borderColor: '#3b82f6' } : {}}
  className={cn(
    "relative flex flex-col items-center justify-center",
    "border-2 border-dashed rounded-xl p-8 transition-colors",
    isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
  )}
>
  {/* Upload content */}
</motion.div>
```

2. **Progress Bar Animation**
```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${uploadProgress}%` }}
  transition={{ duration: 0.3 }}
  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
/>
```

3. **Success Animation**
```tsx
{uploadComplete && (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", bounce: 0.5 }}
    className="absolute inset-0 flex items-center justify-center bg-green-500/10"
  >
    <CheckCircle2 className="w-16 h-16 text-green-500" />
  </motion.div>
)}
```

4. **Error Shake Animation**
```tsx
{error && (
  <motion.div
    initial={{ x: 0 }}
    animate={{ x: [-10, 10, -10, 10, 0] }}
    transition={{ duration: 0.4 }}
  >
    <Alert variant="destructive">
      {error}
    </Alert>
  </motion.div>
)}
```

---

## 🎴 Template Selection Modal

### File: `src/components/TemplateSelectionModal.tsx`

#### Changes:

1. **Modal Animation**
```tsx
<DialogContent>
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
  >
    {/* Modal content */}
  </motion.div>
</DialogContent>
```

2. **Template Grid Animation**
```tsx
<motion.div
  className="grid gap-4"
  variants={containerVariants}
  initial="hidden"
  animate="show"
>
  {templates.map((template) => (
    <motion.div
      key={template.id}
      variants={itemVariants}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Template card */}
    </motion.div>
  ))}
</motion.div>
```

---

## 🎬 Video Thumbnail Component

### File: `src/components/VideoThumbnail.tsx`

#### Changes:

1. **Enhanced Hover Effect**
```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  transition={{ type: "spring", stiffness: 300 }}
  className="relative group overflow-hidden rounded-lg"
>
  <img src={thumbnail} alt={title} />

  <motion.div
    initial={{ opacity: 0 }}
    whileHover={{ opacity: 1 }}
    className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
  >
    <motion.div
      initial={{ scale: 0 }}
      whileHover={{ scale: 1 }}
      transition={{ type: "spring" }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <Play className="w-12 h-12 text-white" />
    </motion.div>
  </motion.div>
</motion.div>
```

---

## 🎯 App Sidebar Enhancements

### File: `src/components/layout/AppSidebar.tsx`

#### Changes:

1. **Menu Item Hover**
```tsx
<motion.div
  whileHover={{ x: 5 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  <SidebarMenuButton>
    {/* Menu content */}
  </SidebarMenuButton>
</motion.div>
```

2. **Collapse Animation** (Already handled by Radix/Shadcn)
- Current implementation is good

---

## 🔔 Notification System

### File: Create `src/components/AnimatedToast.tsx` (NEW)

```tsx
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';

export function AnimatedToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'bg-background border',
      }}
      // Custom toast component with animation
      components={{
        success: ({ message }) => (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border-green-500"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>{message}</span>
          </motion.div>
        ),
        error: ({ message }) => (
          <motion.div
            initial={{ opacity: 0, x: 100, rotate: -2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 border-red-500"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span>{message}</span>
          </motion.div>
        )
      }}
    />
  );
}
```

---

## 🎨 Animated Counter Component

### File: Create `src/components/AnimatedCounter.tsx` (NEW)

```tsx
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 1 }: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}
```

---

## 🎊 Confetti Component

### Install: `npm install canvas-confetti`

### File: Create `src/lib/confetti.ts` (NEW)

```typescript
import confetti from 'canvas-confetti';

export const celebrateSuccess = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};
```

---

## 📱 Responsive Animations

### Mobile Considerations:
- Reduce animation duration by 30% on mobile
- Disable complex animations on low-end devices
- Use `prefers-reduced-motion` media query

```typescript
// src/lib/motion-config.ts
export const getMotionConfig = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  return {
    duration: prefersReducedMotion ? 0 : isMobile ? 0.2 : 0.3,
    type: prefersReducedMotion ? 'tween' : 'spring'
  };
};
```

---

## 🎯 Performance Optimization

### Best Practices:
1. **Use `layout` prop sparingly** - Can cause reflows
2. **Animate transforms/opacity** - GPU accelerated
3. **Use `will-change` CSS** - Optimize layer promotion
4. **Lazy load animations** - Don't animate off-screen elements
5. **Use `AnimatePresence`** - For exit animations

```tsx
// Example: Efficient list animation
<AnimatePresence mode="popLayout">
  {items.map((item) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{ willChange: 'transform, opacity' }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## ✅ Implementation Checklist

### High Priority
- [ ] Create animation library file (`animations.ts`)
- [ ] Add AnimatedCounter component
- [ ] Enhance Dashboard with stagger animations
- [ ] Add loading skeletons
- [ ] Improve upload experience
- [ ] Add success/error animations

### Medium Priority
- [ ] Enhance ProjectDetails clip cards
- [ ] Add template preview animations
- [ ] Improve modal animations
- [ ] Add notification animations
- [ ] Enhance sidebar interactions

### Low Priority
- [ ] Add confetti celebrations
- [ ] Implement parallax effects
- [ ] Add Easter eggs
- [ ] Create loading screen
- [ ] Add particle effects

---

## 🧪 Testing Checklist

- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Test with slow network
- [ ] Test with reduced motion preference
- [ ] Test animation performance (60fps)
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

---

## 📚 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Principles](https://www.framer.com/motion/animation/)
- [Gesture Animations](https://www.framer.com/motion/gestures/)
- [Layout Animations](https://www.framer.com/motion/layout-animations/)

---

**Last Updated**: December 2025
**Status**: Ready for Implementation

# Frontend Integration Guide

## Overview

Your frontend already has good caching (`useVideos` with sessionStorage). We'll ADD WebSocket support for better real-time updates without breaking existing functionality.

---

## Step 1: Update Environment Variables

**Add to `.env.local`:**

```env
# WebSocket for real-time updates (from CloudFormation outputs)
VITE_WEBSOCKET_URL=wss://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod

# Feature flags
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_CACHE=true

# Backend API endpoint (if not already set)
VITE_API_URL=https://your-api-gateway-url.com/prod
```

---

## Step 2: Optional - Add WebSocket to Dashboard

### **Option A: Keep Current Setup (Recommended for Now)**

Your current Dashboard already has:
- ✅ Caching via sessionStorage
- ✅ Real-time updates via Firestore onSnapshot
- ✅ Good performance

**No changes needed!** The Firestore real-time listener already provides updates.

### **Option B: Add WebSocket for Backend Updates (Advanced)**

If you want to add WebSocket for updates from Lambda functions:

**Add to Dashboard.tsx** (after line 141 where `useVideos` is called):

```typescript
import { useWebSocket } from "@/hooks/useWebSocket";

// Inside Dashboard component, after useVideos hook:
const { data: videos = [], isLoading: loading } = useVideos({ realTime: true });

// ADD: WebSocket for Lambda progress updates
const processingVideos = videos.filter(v => v.status === 'processing' || v.status === 'pending');

const { isConnected, lastMessage } = useWebSocket({
  url: import.meta.env.VITE_WEBSOCKET_URL,
  enabled: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true' && processingVideos.length > 0,
  sessionId: processingVideos[0]?.sessionId, // Subscribe to first processing video
  onMessage: (message: any) => {
    console.log('📡 Progress update:', message);

    // Update video in state based on progress
    if (message.event === 'processing_progress') {
      // Firestore will pick up the Lambda's DynamoDB update automatically
      // No manual state update needed!
    }
  }
});

// ADD: Connection indicator (optional UI)
{import.meta.env.VITE_ENABLE_WEBSOCKET === 'true' && (
  <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
    {isConnected ? "🟢 Live" : "🔴 Offline"}
  </Badge>
)}
```

**That's it!** The WebSocket provides real-time Lambda updates, and Firestore handles the rest.

---

## Step 3: Optional - Add Pagination for Large Video Lists

If you have users with 100+ videos, add pagination:

**Update Dashboard.tsx** to use `useVideosPaginated`:

```typescript
import { useVideosPaginated } from "@/hooks/useVideosPaginated";

// REPLACE useVideos with:
const {
  data: videosPages,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage
} = useVideosPaginated({
  limit: 20,
  enabled: !!currentUser
});

// Flatten pages
const videos = useMemo(() => {
  if (!videosPages?.pages) return [];
  return videosPages.pages.flatMap(page => page.videos);
}, [videosPages]);

// Add infinite scroll handler to grid:
<div
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  onScroll={(e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
>
  {videos.map(video => <VideoCard key={video.id} video={video} />)}

  {isFetchingNextPage && (
    <div className="col-span-full text-center py-4">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )}
</div>
```

---

## Step 4: Optional - Add Error Handling with Retry

**Wrap API calls with error handler:**

```typescript
import { useErrorHandler, withRetry } from "@/lib/errorHandler";

// In component:
const { error, handleError, clearError } = useErrorHandler();

// Wrap risky API calls:
const processVideo = async (videoUrl: string) => {
  try {
    await withRetry(
      () => fetch('/api/process', {
        method: 'POST',
        body: JSON.stringify({ url: videoUrl })
      }),
      {
        maxRetries: 3,
        initialDelay: 1000
      }
    );
  } catch (err) {
    handleError(err);
  }
};

// Show error in UI:
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
    <Button onClick={clearError}>Dismiss</Button>
  </Alert>
)}
```

---

## Step 5: Build and Deploy

```bash
cd reframe-ai
npm run build
npm run preview  # Test production build
```

Deploy to your hosting (Vercel/Netlify/etc.).

---

## Integration Priority

### ✅ Must Do Now:
1. Add environment variables (Step 1)
2. Build and test

### ⏸️ Optional (Do Later):
- WebSocket integration (Step 2) - Only if you want progress bars from Lambda
- Pagination (Step 3) - Only if users have 100+ videos
- Error handler (Step 4) - Nice to have

**Your current setup already works well!** The new features are additive.

---

## Testing

### Test WebSocket (if added):

1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Upload a video
4. You should see:
   - WebSocket connection established ✅
   - Real-time progress messages ✅
   - No polling requests ✅

### Test Performance:

1. Check Network tab - should see very few requests
2. Navigate between pages - instant (cache working)
3. Check sessionStorage in Application tab - videos cached ✅

---

## Summary

**Current State:** ✅ Already well-optimized with caching and Firestore real-time updates

**Recommended Next Steps:**
1. Add environment variables
2. Test current setup
3. Add WebSocket only if you need Lambda progress updates
4. Add pagination only if needed for large lists

**No urgent changes required** - your frontend is already scalable!

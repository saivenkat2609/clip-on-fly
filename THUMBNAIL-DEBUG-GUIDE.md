# Video Thumbnail Debugging Guide

## Current Issue

The VideoThumbnail component is showing fallback gradient backgrounds with play icons instead of extracting and displaying the actual first frame from video clips.

## What I Added

Enhanced logging throughout the VideoThumbnail component to track:
- Video loading lifecycle (loadstart → loadeddata → canplay → seeked)
- Video dimensions and duration
- Canvas operations
- Error details with specific codes and messages

## How to Debug

1. **Start the dev server** (already running)
2. **Open the Dashboard** in your browser
3. **Open Browser DevTools Console** (F12 or Right-click → Inspect)
4. **Look for VideoThumbnail logs**:
   - `[VideoThumbnail] Starting frame extraction for: <URL>`
   - `[VideoThumbnail] Video load started`
   - `[VideoThumbnail] Video metadata loaded...`
   - `[VideoThumbnail] Seeked to: 0.5`
   - `[VideoThumbnail] Data URL generated...`

## Most Likely Issues

### 1. CORS (Cross-Origin Resource Sharing) Error ⚠️ MOST LIKELY

**Symptom:** Console shows error like:
```
Access to video at 'https://...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Cause:** R2 bucket doesn't have proper CORS headers configured

**Fix:** Add CORS policy to your R2 bucket:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range", "Content-Type"],
    "ExposeHeaders": ["Content-Length", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
```

**How to apply:**
1. Go to Cloudflare R2 Dashboard
2. Select your bucket
3. Go to Settings → CORS
4. Add the policy above
5. Save and test again

### 2. Expired Pre-signed URLs

**Symptom:** Video error code 403 or error message about expired URLs

**Cause:** Videos processed more than 7 days ago have expired pre-signed URLs

**Fix:**
- Set `R2_PUBLIC_DOMAIN` environment variable in Lambda to use public URLs (recommended)
- Or re-process videos to generate fresh URLs

### 3. Invalid Video URLs

**Symptom:** Video error code 404 or "Not Found"

**Cause:** S3 keys don't exist or were deleted

**Fix:** Check that video files actually exist in R2 bucket

### 4. Browser Security Restrictions

**Symptom:** Canvas extraction fails with "tainted canvas" error

**Cause:** Even with CORS, some browsers are strict about canvas manipulation

**Fix:** Ensure `crossOrigin="anonymous"` is set (already done)

## Expected Console Output (Success)

```
[VideoThumbnail] Starting frame extraction for: https://pub-xyz.r2.dev/clips/session-123/clip-0.mp4
[VideoThumbnail] Video load started
[VideoThumbnail] Video metadata loaded. Duration: 30.5 Dimensions: 1920 x 1080
[VideoThumbnail] Seeking to 0.5s
[VideoThumbnail] Video can play
[VideoThumbnail] Seeked to: 0.5
[VideoThumbnail] Canvas size set to: 1920 x 1080
[VideoThumbnail] Frame drawn to canvas
[VideoThumbnail] Data URL generated, length: 245678
```

## Expected Console Output (CORS Error)

```
[VideoThumbnail] Starting frame extraction for: https://pub-xyz.r2.dev/clips/session-123/clip-0.mp4
[VideoThumbnail] Video load started
Access to video at 'https://pub-xyz.r2.dev/clips/session-123/clip-0.mp4' from origin 'http://localhost:5173' has been blocked by CORS policy
[VideoThumbnail] Error loading video: Event { ... }
[VideoThumbnail] Video error code: 2
[VideoThumbnail] Video error message: MEDIA_ERR_NETWORK
```

## Quick Test

To verify if CORS is the issue, try opening one of the video URLs directly in a new browser tab:
1. Open DevTools Console on Dashboard
2. Find a video card
3. Right-click → Inspect Element
4. Find the `<video>` element with `src` attribute
5. Copy the URL
6. Open it in a new tab
7. If the video plays in the new tab but not in the component, it's likely a CORS issue

## R2 Public URL Configuration (Recommended)

If not already done, configure R2 public URLs:

1. **In Cloudflare R2:**
   - Enable public access on your bucket
   - Note the public domain (e.g., `pub-xyz123.r2.dev`)

2. **In Lambda Environment Variables:**
   ```
   R2_PUBLIC_DOMAIN=pub-xyz123.r2.dev
   ```

3. **Benefits:**
   - No URL expiration
   - Better CORS support
   - Simpler URLs
   - No signature overhead

## Next Steps

1. ✅ Enhanced logging is now active
2. 🔍 Check browser console for errors
3. 🔧 Fix CORS configuration in R2 (most likely fix needed)
4. 🧪 Test with a fresh video upload
5. 📊 Verify thumbnails appear on Dashboard

## Summary

The VideoThumbnail component is correctly implemented. The issue is almost certainly **CORS configuration** on the R2 bucket preventing the browser from loading video metadata for canvas extraction.

**Action Required:** Configure CORS on your R2 bucket to allow cross-origin video access.

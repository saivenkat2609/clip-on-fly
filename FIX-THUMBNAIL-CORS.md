# Fix Video Thumbnail CORS Issue

## The Problem

Your video thumbnails are showing fallback gradients instead of actual video frames because the browser cannot load video metadata from R2 due to missing CORS (Cross-Origin Resource Sharing) headers.

## The Solution

Configure CORS on your Cloudflare R2 bucket to allow cross-origin video access.

---

## Step-by-Step Fix

### Option 1: Using Cloudflare Dashboard (Recommended) ✅

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to R2 section

2. **Select Your Bucket**
   - Find the bucket where your video clips are stored
   - Click on the bucket name

3. **Configure CORS**
   - Go to **Settings** tab
   - Find **CORS Policy** section
   - Click **Add CORS Policy** or **Edit**

4. **Add This CORS Configuration**
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["Content-Length", "Content-Range"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

5. **Save and Test**
   - Click **Save** or **Apply**
   - Refresh your Dashboard at http://localhost:8081
   - Check browser console (F12) for `[VideoThumbnail]` logs
   - Thumbnails should now show actual video frames! 🎉

### Option 2: Using Wrangler CLI (Alternative)

If you prefer using the command line:

```bash
# Install wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create CORS configuration file
cat > cors.json << 'EOF'
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Apply CORS to your bucket (replace YOUR-BUCKET-NAME)
wrangler r2 bucket cors put YOUR-BUCKET-NAME --file cors.json
```

---

## Verify the Fix

After applying CORS configuration:

1. **Open Dashboard**: http://localhost:8081
2. **Open Browser DevTools**: Press F12
3. **Go to Console Tab**
4. **Look for these logs**:
   ```
   [VideoThumbnail] Starting frame extraction for: https://...
   [VideoThumbnail] Video metadata loaded. Duration: XX Dimensions: 1920 x 1080
   [VideoThumbnail] Data URL generated, length: XXXXX
   ```

5. **Check Dashboard Cards**: Should now show actual video frames instead of gradient backgrounds

---

## Understanding CORS

**What is CORS?**
Cross-Origin Resource Sharing (CORS) is a security mechanism that controls which websites can access your resources.

**Why is it needed?**
- Your frontend runs on `localhost:8081` (or your domain)
- Your videos are hosted on R2 (different origin)
- Browser blocks cross-origin canvas operations for security
- CORS headers tell the browser "it's okay to allow this"

**Is it safe?**
Yes! Allowing `GET` and `HEAD` methods with `AllowedOrigins: ["*"]` is safe for public content like videos. It only allows reading, not writing or deleting.

---

## Production Considerations

### For Production Deployment:

Instead of `"AllowedOrigins": ["*"]`, use your actual domain:

```json
{
  "AllowedOrigins": ["https://yourdomain.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["Content-Length", "Content-Range"],
  "MaxAgeSeconds": 3600
}
```

This is more secure and prevents other websites from embedding your videos.

---

## Alternative: Enable R2 Public Access (Recommended)

If you want simpler URLs and better performance:

1. **Enable Public Access on R2 Bucket**
   - In Cloudflare Dashboard → R2 → Your Bucket
   - Go to Settings
   - Enable **Public Access**
   - Note the public domain (e.g., `pub-abc123xyz.r2.dev`)

2. **Update Lambda Environment Variable**
   - Go to AWS Lambda Console
   - Find your `5-lambda-finalize` function
   - Add environment variable:
     ```
     R2_PUBLIC_DOMAIN=pub-abc123xyz.r2.dev
     ```

3. **Benefits:**
   - ✅ No URL expiration (no 7-day limit)
   - ✅ Better CORS support (R2 public buckets have CORS enabled by default)
   - ✅ Simpler URLs
   - ✅ Better caching
   - ✅ Lower latency

---

## Troubleshooting

### Still seeing gradient backgrounds?

1. **Hard refresh the page**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**: DevTools → Application → Clear storage
3. **Check console for errors**: Look for red error messages
4. **Verify CORS was applied**:
   ```bash
   curl -I -X OPTIONS \
     -H "Origin: http://localhost:8081" \
     -H "Access-Control-Request-Method: GET" \
     YOUR_VIDEO_URL
   ```
   Should return: `access-control-allow-origin: *`

### Video error code meanings:

- **Error code 2 (MEDIA_ERR_NETWORK)**: CORS issue or network error
- **Error code 3 (MEDIA_ERR_DECODE)**: Video format issue
- **Error code 4 (MEDIA_ERR_SRC_NOT_SUPPORTED)**: Invalid URL or format

---

## Summary

**Quick Fix**: Add CORS policy to R2 bucket allowing GET requests from any origin.

**Better Fix**: Enable R2 public access and set R2_PUBLIC_DOMAIN in Lambda for permanent URLs.

**Result**: Dashboard thumbnails will show actual video frames instead of generic gradients! 🎬✨

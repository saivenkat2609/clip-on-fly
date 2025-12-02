# Fix R2 CORS Properly - Step by Step

## The Problem

Your videos are blocked by CORS because the R2 bucket doesn't have the CORS policy configured.

Error in console:
```
Access to video at 'https://f1ff3bcad7fd44abcea85af75a286b01.r2.cloudflarestorage.com/...'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

---

## Solution: Add CORS to R2 Bucket

### Method 1: Using Cloudflare Dashboard (Recommended) ✅

1. **Go to Cloudflare R2 Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Click **R2** in the left sidebar
   - Click on your bucket: **opus-clip-videos**

2. **Go to Settings Tab**
   - Click the **Settings** tab at the top
   - Scroll down to find **CORS Policy** section

3. **Add CORS Policy**
   - If you see existing CORS rules, click **Edit**
   - If no CORS rules exist, click **Add CORS policy**

4. **Enter This CORS Configuration**

   **Copy and paste this EXACTLY:**
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["Content-Length", "Content-Range", "ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

5. **Save the Configuration**
   - Click **Save** or **Apply**
   - You should see a success message

---

### Method 2: Using Wrangler CLI (If Dashboard Doesn't Work)

```bash
# 1. Install wrangler (if not installed)
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Create CORS config file
cat > r2-cors.json << 'EOF'
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# 4. Apply CORS to your bucket
wrangler r2 bucket cors put opus-clip-videos --file r2-cors.json

# 5. Verify CORS was applied
wrangler r2 bucket cors get opus-clip-videos
```

---

## Verify CORS is Working

### Test 1: Check CORS Headers with curl

```bash
# Replace with one of your actual video URLs
curl -I -X OPTIONS \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: GET" \
  "https://f1ff3bcad7fd44abcea85af75a286b01.r2.cloudflarestorage.com/opus-clip-videos/test.mp4"
```

**Expected output should include:**
```
access-control-allow-origin: *
access-control-allow-methods: GET, HEAD
access-control-allow-headers: *
```

### Test 2: Check in Browser

1. Refresh your dashboard: http://localhost:8080
2. Open DevTools Console (F12)
3. Look for the logs - should now see:
   ```
   [VideoThumbnail] Video metadata loaded. Duration: XX Dimensions: 1920 x 1080
   ```
4. No more CORS errors!

---

## Important Notes

### About Your Current URLs

Looking at your error, I see you have **two different types** of pre-signed URLs:

**URL 1 (NEW - SigV4):**
```
?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...
```
✅ This is correct format (SigV4)

**URL 2 (OLD - SigV2):**
```
?AWSAccessKeyId=...&Signature=...&Expires=...
```
❌ This returns 401 Unauthorized (old format)

The old SigV2 URL is why you're seeing `401 Unauthorized` errors. This video was processed before you fixed the SigV4 issue.

### What This Means

- **New videos** (processed after SigV4 fix): Will work once CORS is fixed ✅
- **Old videos** (processed before): May have 401 errors due to SigV2 ❌

**Solution:** Just upload new videos - they'll use the correct format.

---

## After Fixing CORS: Enable Public URLs (Option 2)

Once CORS is working with pre-signed URLs, let's move to public URLs for the long term:

### Step 1: Enable R2 Public Access

1. In your R2 bucket settings: **opus-clip-videos**
2. Look for **"R2.dev subdomain"** or **"Public Access"** section
3. Click **"Allow Access"** or **"Connect Domain"**
4. Cloudflare generates a free domain like: `pub-abc123.r2.dev`
5. **Copy this domain URL** ✅

### Step 2: Add to Lambda

1. Go to AWS Lambda Console
2. Find **5-lambda-finalize** function
3. Configuration → Environment variables → Edit
4. Add new variable:
   - Key: `R2_PUBLIC_DOMAIN`
   - Value: `pub-abc123.r2.dev` (your actual domain from above)
5. Save

### Step 3: Test with New Video

1. Upload a new video
2. It will use public URLs: `https://pub-abc123.r2.dev/opus-clip-videos/...`
3. No expiration, better performance, CORS works by default!

---

## Troubleshooting

### "I don't see CORS Policy section in Settings"

Try these locations:
- Settings → CORS Policy
- Settings → CORS Configuration
- Settings → Bucket Configuration → CORS

If you still can't find it, use the Wrangler CLI method above.

### "CORS still not working after adding policy"

1. **Clear browser cache:** Ctrl+Shift+R
2. **Check you saved the CORS config**
3. **Verify with curl command** (see Test 1 above)
4. **Try in incognito/private window**
5. **Wait 1-2 minutes** for changes to propagate

### "401 Unauthorized errors"

This is for old videos using SigV2. Solutions:
1. Just upload new videos (recommended)
2. Or enable public URLs (Option 2) for permanent solution

---

## Summary

**Right Now - Fix CORS:**
1. ✅ Go to Cloudflare → R2 → opus-clip-videos → Settings
2. ✅ Add CORS policy (copy from above)
3. ✅ Save and verify with curl or browser refresh

**Long Term - Enable Public URLs:**
1. ✅ Enable R2.dev public domain (free from Cloudflare)
2. ✅ Add R2_PUBLIC_DOMAIN to Lambda environment variables
3. ✅ Upload new videos - they'll use permanent public URLs

**Result:**
- 🎯 Thumbnails will show actual video frames
- 🎯 No more CORS errors
- 🎯 No URL expiration (with public URLs)
- 🎯 Better performance!

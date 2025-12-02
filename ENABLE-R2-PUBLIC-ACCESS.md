# Enable R2 Public Access (Long-term Solution)

## You Don't Need Your Own Domain! 🎉

Cloudflare R2 automatically provides a **free public domain** when you enable public access. It looks like:
```
pub-abc123xyz.r2.dev
```

This is a permanent, free domain provided by Cloudflare specifically for your R2 bucket.

---

## Step 1: Enable Public Access on R2 Bucket

### Using Cloudflare Dashboard:

1. **Go to Cloudflare Dashboard**
   - Navigate to https://dash.cloudflare.com/
   - Click on **R2** in the left sidebar

2. **Select Your Bucket**
   - Find the bucket where your video clips are stored
   - Click on the bucket name

3. **Enable Public Access**
   - Go to the **Settings** tab
   - Look for **Public Access** or **R2.dev subdomain** section
   - Click **Connect Domain** or **Enable Public Access**
   - Cloudflare will automatically generate a subdomain like:
     ```
     pub-abc123xyz.r2.dev
     ```

4. **Copy the Public Domain**
   - Copy the full domain (e.g., `pub-abc123xyz.r2.dev`)
   - You'll need this for Step 2

**Important Notes:**
- ✅ This domain is **FREE** - no cost
- ✅ This domain is **PERMANENT** - doesn't expire
- ✅ CORS is **automatically enabled** on public R2 domains
- ✅ No SSL certificate needed - HTTPS works automatically
- ✅ CDN caching included for better performance

---

## Step 2: Update Lambda Environment Variable

### Using AWS Lambda Console:

1. **Go to AWS Lambda Console**
   - Navigate to https://console.aws.amazon.com/lambda/
   - Find your **5-lambda-finalize** function
   - Click on the function name

2. **Add Environment Variable**
   - Go to **Configuration** tab
   - Click **Environment variables** in the left menu
   - Click **Edit**
   - Click **Add environment variable**

3. **Add R2_PUBLIC_DOMAIN**
   - **Key:** `R2_PUBLIC_DOMAIN`
   - **Value:** `pub-abc123xyz.r2.dev` (use your actual domain from Step 1)
   - Click **Save**

4. **Verify Other Environment Variables**
   Make sure these are still present:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_WEB_API_KEY`
   - `R2_ENDPOINT_URL` (if using R2)
   - `R2_ACCESS_KEY_ID` (if using R2)
   - `R2_SECRET_ACCESS_KEY` (if using R2)
   - `R2_BUCKET_NAME` (if using R2)

---

## Step 3: Test with a New Video

1. **Upload a Test Video**
   - Go to http://localhost:8081/upload
   - Upload a YouTube URL
   - Wait for processing to complete

2. **Check the Dashboard**
   - Go to http://localhost:8081
   - The new video should show with:
     - ✅ Actual video frame thumbnail (not gradient)
     - ✅ Public URL format: `https://pub-abc123xyz.r2.dev/clips/...`
     - ✅ No expiration date on the URL

3. **Verify in Browser Console**
   - Open DevTools (F12)
   - Check Console for `[VideoThumbnail]` logs
   - Should see successful frame extraction

---

## How It Works

### Before (Pre-signed URLs):
```
❌ URL expires after 7 days
❌ Long, complex URL with signature
❌ Requires CORS configuration
❌ Slower (signature verification)

Example:
https://r2.cloudflare.com/bucket/clip.mp4?X-Amz-Algorithm=...&X-Amz-Expires=604800&X-Amz-Signature=abc123...
```

### After (Public URLs):
```
✅ URL never expires
✅ Short, clean URL
✅ CORS enabled by default
✅ Faster (CDN caching)

Example:
https://pub-abc123xyz.r2.dev/clips/session-xyz/clip-0.mp4
```

---

## Code Changes (Already Done!)

The Lambda code already supports this - just needs the environment variable:

```python
# In 5-lambda-finalize.py (lines ~85-100)

r2_public_domain = os.environ.get('R2_PUBLIC_DOMAIN', '')

if r2_public_domain:
    # Use public URL (permanent, no expiration)
    url = f"https://{r2_public_domain}/{s3_key}"
else:
    # Use pre-signed URL (expires in 7 days)
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
        ExpiresIn=604800  # 7 days
    )
```

---

## Benefits of Public URLs

| Feature | Pre-signed URLs | Public URLs |
|---------|----------------|-------------|
| **Expiration** | 7 days | Never |
| **URL Length** | Very long (~500 chars) | Short (~80 chars) |
| **CORS** | Requires configuration | Enabled by default |
| **Caching** | Limited | Full CDN caching |
| **Speed** | Slower (signature check) | Faster (cached) |
| **Sharing** | Breaks after 7 days | Always works |
| **Thumbnails** | May fail with CORS | Always works |
| **Cost** | Same | Same (free egress) |

---

## Security Considerations

**Is it safe to make videos public?**

✅ **Yes, if your videos are meant to be shared:**
- Users can download clips from the UI anyway
- Public URLs only allow reading, not writing or deleting
- Your R2 bucket still requires authentication for upload/delete
- Common pattern for video hosting platforms

❌ **No, if your videos are private/confidential:**
- Keep using pre-signed URLs with expiration
- Or implement authentication layer in your app
- Or use Cloudflare Access for additional security

**For most use cases (video clip sharing app), public URLs are the right choice.**

---

## Troubleshooting

### Can't find "Enable Public Access" option?

Try:
1. Look for **"R2.dev subdomain"** section in Settings
2. Or **"Custom Domains"** → **"Connect R2.dev subdomain"**
3. Or **"Public Access"** toggle

### Public domain not working?

1. Verify the domain is correct (copy-paste from R2 settings)
2. Test directly in browser: `https://pub-abc123xyz.r2.dev/clips/...`
3. Make sure you saved the Lambda environment variable
4. Try uploading a new video (old videos still use pre-signed URLs)

### Old videos still have pre-signed URLs?

That's expected! Only **new videos processed after adding R2_PUBLIC_DOMAIN** will use public URLs.

To update old videos:
1. They'll continue working with pre-signed URLs (if not expired)
2. Or you can manually trigger a re-process (if implemented)
3. Or just let them expire and users can re-upload

---

## Summary

**What You Need:**
1. ✅ Enable public access on R2 bucket (Cloudflare generates free domain)
2. ✅ Copy the auto-generated domain (e.g., `pub-abc123xyz.r2.dev`)
3. ✅ Add `R2_PUBLIC_DOMAIN` environment variable to Lambda
4. ✅ Test with new video upload

**What You DON'T Need:**
- ❌ Your own custom domain
- ❌ DNS configuration
- ❌ SSL certificate
- ❌ Any additional cost
- ❌ Code changes (already implemented)

**Result:**
- ✅ Permanent URLs that never expire
- ✅ Better performance with CDN caching
- ✅ Thumbnails always work (CORS enabled by default)
- ✅ Cleaner, shorter URLs
- ✅ Long-term solution! 🎉

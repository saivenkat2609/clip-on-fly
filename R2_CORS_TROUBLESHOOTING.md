# R2 CORS Troubleshooting Guide

## Current Status
✅ API Gateway working (200 response)
✅ Lambda function fixed (no content-length in signature)
✅ Pre-signed URL generated successfully
❌ R2 bucket not returning CORS headers (403 Forbidden)

## The Issue
R2 is returning 403 and not including `Access-Control-Allow-Origin` header, which means:
1. CORS policy may not be applied correctly
2. Bucket permissions might be blocking requests
3. CORS policy might need time to propagate
4. R2 bucket might need public access configured

---

## Solution 1: Verify and Fix R2 CORS Configuration

### Step 1: Double-Check CORS Policy in Cloudflare

1. Go to **Cloudflare Dashboard** → **R2**
2. Click on bucket: **`opus-clip-videos`**
3. Click **Settings** tab
4. Scroll to **CORS Policy** section
5. **Verify** the policy looks EXACTLY like this:

```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Important**: Use `"*"` for AllowedOrigins temporarily to test. We'll restrict it later.

6. Click **Save**
7. **Wait 2-3 minutes** for changes to propagate

### Step 2: Check Bucket Permissions

R2 buckets might need to allow public access for CORS to work with pre-signed URLs:

1. In the **`opus-clip-videos`** bucket settings
2. Look for **Public Access** or **Bucket Visibility** section
3. You might need to enable **"Allow public access"** or configure custom domain

**Note**: Even with pre-signed URLs, some R2 configurations require the bucket to allow public access for CORS headers to be returned.

---

## Solution 2: Test CORS Directly

Let's verify if R2 is responding to CORS requests:

### Test 1: CORS Preflight (OPTIONS)
Open a **new terminal** and run:

```bash
curl -X OPTIONS \
  "https://f1ff3bcad7fd44abcea85af75a286b01.r2.cloudflarestorage.com/opus-clip-videos/test.txt" \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

**Look for these headers in the response**:
- `Access-Control-Allow-Origin: *` or `Access-Control-Allow-Origin: http://localhost:8080`
- `Access-Control-Allow-Methods: PUT, GET, ...`

**If you DON'T see these headers**: CORS is not configured correctly.

### Test 2: Simple GET Request
```bash
curl -X GET \
  "https://f1ff3bcad7fd44abcea85af75a286b01.r2.cloudflarestorage.com/opus-clip-videos/" \
  -H "Origin: http://localhost:8080" \
  -v
```

Should return CORS headers if configured correctly.

---

## Solution 3: Alternative - Use R2 Custom Domain

If CORS continues to fail, you can use a Cloudflare R2 custom domain which has better CORS support:

### Set Up Custom Domain for R2

1. **In Cloudflare R2**:
   - Select your bucket `opus-clip-videos`
   - Go to **Settings** → **Custom Domains**
   - Click **Connect Domain**
   - Choose a subdomain (e.g., `r2.yourdomain.com`)

2. **Configure CORS on Custom Domain**:
   - Custom domains handle CORS better than direct R2 URLs
   - Apply the same CORS policy

3. **Update Lambda to Use Custom Domain**:
   - In your Lambda environment variables
   - Set `R2_ENDPOINT` to your custom domain URL
   - Redeploy Lambda function

---

## Solution 4: Use S3 Instead of R2 (Temporary Test)

To verify if this is an R2-specific issue, you can temporarily test with AWS S3:

1. Create an S3 bucket
2. Configure CORS on S3 (more mature CORS support)
3. Update Lambda environment variables to use S3
4. Test upload

If it works with S3, we know it's an R2 CORS issue.

---

## Solution 5: Check R2 Region Configuration

Cloudflare R2 might have region-specific CORS settings:

1. Verify your Lambda is generating pre-signed URLs with the correct region
2. Check Lambda environment variable: `AWS_REGION` should be `auto` or match R2 region
3. R2 is region-agnostic but some configurations might affect CORS

---

## Solution 6: Wait and Clear Cache

Sometimes CORS changes take time:

1. **Wait 5 minutes** after saving CORS policy
2. **Clear browser cache completely**:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Or use **Incognito/Private window**
3. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Try uploading again

---

## Debugging Steps

### Enable More Detailed Logging

Let's add a test to see what R2 is actually returning:

1. Open browser DevTools → **Network** tab
2. Try uploading a file
3. Find the PUT request to `r2.cloudflarestorage.com`
4. Click on it
5. Check **Headers** section:
   - Look at **Request Headers** - should have `Origin: http://localhost:8080`
   - Look at **Response Headers** - should have `Access-Control-Allow-Origin`

**If Response Headers are missing CORS headers**: R2 CORS not configured correctly.

### Check Pre-Signed URL Signature

Copy the full pre-signed URL from console logs and test it with curl:

```bash
# Copy the URL from browser console logs
curl -X PUT "PASTE_FULL_PRESIGNED_URL_HERE" \
  -H "Content-Type: video/mp4" \
  -H "Origin: http://localhost:8080" \
  --data-binary "@test-file.txt" \
  -v
```

**Expected**: 200 OK with CORS headers
**If 403**: Pre-signed URL or R2 configuration issue

---

## Common R2 CORS Issues

### Issue 1: CORS Not Saved Correctly
**Symptom**: No CORS headers in response
**Fix**: Delete existing CORS policy, save, then add new policy

### Issue 2: Bucket Not Publicly Accessible
**Symptom**: 403 Forbidden even with correct CORS
**Fix**: Enable public access or use custom domain

### Issue 3: AllowedHeaders Mismatch
**Symptom**: CORS preflight fails
**Fix**: Use `"*"` for AllowedHeaders to allow all

### Issue 4: R2 CORS Propagation Delay
**Symptom**: Works after 10-15 minutes
**Fix**: Wait, clear cache, try again

---

## Recommended Next Steps

1. **Verify CORS policy** in R2 dashboard (use `"*"` for AllowedOrigins)
2. **Wait 2-3 minutes** after saving
3. **Clear browser cache** or use incognito
4. **Test with curl** (OPTIONS and PUT requests)
5. **Check Network tab** in DevTools for response headers
6. If still failing, consider **R2 Custom Domain** setup

---

## Contact Cloudflare Support

If nothing works, there might be an R2-specific limitation:

1. Check [Cloudflare R2 CORS Documentation](https://developers.cloudflare.com/r2/buckets/cors/)
2. Contact Cloudflare Support about CORS with pre-signed URLs
3. Ask specifically about CORS support for browser uploads

---

## Quick Test Script

Save this as `test-r2-cors.sh`:

```bash
#!/bin/bash

R2_URL="https://f1ff3bcad7fd44abcea85af75a286b01.r2.cloudflarestorage.com/opus-clip-videos/test.txt"
ORIGIN="http://localhost:8080"

echo "Testing R2 CORS Configuration"
echo "=============================="
echo ""

echo "Test 1: OPTIONS Preflight"
echo "-------------------------"
curl -X OPTIONS "$R2_URL" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" \
  -I

echo ""
echo ""
echo "Test 2: GET Request with Origin"
echo "--------------------------------"
curl -X GET "$R2_URL" \
  -H "Origin: $ORIGIN" \
  -I

echo ""
echo "=============================="
echo ""
echo "Look for these headers:"
echo "  - Access-Control-Allow-Origin"
echo "  - Access-Control-Allow-Methods"
echo "  - Access-Control-Allow-Headers"
echo ""
```

Run: `bash test-r2-cors.sh`

---

## If All Else Fails: Proxy Through Lambda

As a workaround, you can upload through Lambda instead of directly to R2:

1. Frontend sends file to API Gateway
2. Lambda receives file
3. Lambda uploads to R2 (no CORS needed for server-to-server)
4. Return success to frontend

This avoids CORS entirely but has size limitations (10MB for sync Lambda, 6MB for API Gateway payload).

---

## Summary

🔍 **Problem**: R2 not returning CORS headers
🎯 **Solution**: Verify CORS config, wait for propagation, test with curl
⏱️ **Timeline**: Should work within 5 minutes of correct CORS config
🆘 **Backup**: Use R2 custom domain or proxy through Lambda

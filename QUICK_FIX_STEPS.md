# Quick Fix Steps - Upload Feature Not Working

## Current Status
- ✅ Frontend code is ready
- ✅ Lambda function is deployed and working
- ✅ API endpoint configured in .env: `https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod`
- ❌ **API Gateway routes not configured** ← THIS IS THE ISSUE
- ❌ R2 CORS needs configuration (we'll fix this after API Gateway)

## Fix This Right Now (5-10 minutes)

### 1. Configure API Gateway

Go to **AWS Console** and follow these exact steps:

#### A. Open Your API
1. AWS Console → **API Gateway**
2. Click on API ID: **g78mc4ok92**

#### B. Create Upload Resource
1. Select root `/`
2. **Actions** → **Create Resource**
3. Settings:
   - Resource Name: `upload`
   - ✅ **Enable API Gateway CORS** ← CHECK THIS BOX
4. **Create Resource**

#### C. Create Generate-URL Endpoint
1. Select `/upload`
2. **Actions** → **Create Resource**
3. Resource Name: `generate-url`
4. **Create Resource**
5. Select `/upload/generate-url`
6. **Actions** → **Create Method** → **POST** → ✓
7. Configure:
   - Integration type: **Lambda Function**
   - ✅ **Use Lambda Proxy integration** ← CHECK THIS BOX
   - Lambda Function: `opus-api-gateway-upload`
8. **Save** → **OK**

#### D. Create Start Endpoint
1. Select `/upload`
2. **Actions** → **Create Resource**
3. Resource Name: `start`
4. **Create Resource**
5. Select `/upload/start`
6. **Actions** → **Create Method** → **POST** → ✓
7. Configure same as above (Lambda proxy + opus-api-gateway-upload)
8. **Save** → **OK**

#### E. Enable CORS (IMPORTANT!)
For each endpoint (`/upload`, `/upload/generate-url`, `/upload/start`):
1. Select the resource
2. **Actions** → **Enable CORS**
3. Keep defaults → **Enable CORS and replace existing CORS headers**
4. **Yes, replace existing values**

#### F. DEPLOY API (CRITICAL!)
1. **Actions** → **Deploy API**
2. Stage: **prod**
3. **Deploy**

### 2. Configure R2 CORS

After API Gateway is set up, configure Cloudflare R2:

1. **Cloudflare Dashboard** → **R2**
2. Select bucket: `opus-clip-videos`
3. **Settings** → **CORS Policy** → **Edit**
4. Paste this JSON:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:8080",
      "http://localhost:5173",
      "https://reframe-ai.netlify.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Save**

### 3. Test the Fix

#### Option A: Test in Browser
1. Open your app: http://localhost:8080
2. Open DevTools (F12) → Console tab
3. Try uploading a video
4. You should see:
   ```
   [Upload] Starting upload...
   [Upload] Response status: 200
   [Upload] Got pre-signed URL
   [Upload] Session ID: <uuid>
   [Upload] Starting PUT request to storage...
   [Upload] Storage response status: 200
   [Upload] File uploaded to storage successfully
   ```

#### Option B: Test with curl
```bash
# Test 1: Check if route exists
curl -X POST https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod/upload/generate-url \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","fileName":"test.mp4","fileSize":10000000}'

# Should return: 200 OK with session_id and uploadUrl
```

---

## What Each Fix Does

### API Gateway Fix
- **Problem**: Routes `/upload/generate-url` and `/upload/start` don't exist
- **Symptom**: 404 Not Found + CORS error
- **Solution**: Create routes in API Gateway and deploy
- **Time**: 5-10 minutes

### R2 CORS Fix
- **Problem**: R2 bucket blocks cross-origin uploads
- **Symptom**: "Access to fetch... blocked by CORS policy" when uploading to R2
- **Solution**: Add CORS policy to R2 bucket
- **Time**: 2 minutes

---

## If You Get Stuck

### API Gateway - Can't find the Lambda function?
- Make sure Lambda function `opus-api-gateway-upload` is deployed in **us-east-1**
- Check Lambda console to verify it exists

### API Gateway - Still getting 404 after setup?
- Did you **deploy** the API? (Step F)
- Wait 30 seconds for deployment to propagate
- Clear browser cache

### R2 - Can't find CORS settings?
- Cloudflare Dashboard → R2 → Select bucket
- Click **Settings** tab
- Scroll down to **CORS Policy**

---

## Verify Success

After both fixes, you should see this flow work:

1. **Upload starts** → Console logs show "[Upload] Starting upload..."
2. **API Gateway responds** → Console shows "[Upload] Response status: 200"
3. **Pre-signed URL received** → Console shows session ID
4. **Upload to R2** → Console shows "Starting PUT request to storage..."
5. **R2 accepts upload** → Console shows "[Upload] Storage response status: 200"
6. **Processing starts** → Console shows "Processing started"
7. **Success toast** → "Upload Successful! Your video is being processed."

---

## Need More Help?

📚 **Detailed guides**:
- Full API Gateway setup: `API_GATEWAY_SETUP_CHECKLIST.md`
- CORS configuration: `CORS_FIX.md`

🧪 **Test script**:
- Run: `bash test-upload-api.sh`

📝 **Architecture docs**:
- `C:\Projects\opus-clip-cloud\lambda-functions\STEP-4-API-GATEWAY-SETUP.md`
- `C:\Projects\opus-clip-cloud\lambda-functions\UPLOAD-FLOW-DEPLOYMENT-GUIDE.md`

---

## Summary

**Do this now:**
1. ⚡ Configure API Gateway (5 min) → `API_GATEWAY_SETUP_CHECKLIST.md`
2. ⚡ Deploy API (1 click)
3. ⚡ Configure R2 CORS (2 min)
4. ✅ Test upload

**Total time:** ~10 minutes

After this, your upload feature will work end-to-end! 🚀

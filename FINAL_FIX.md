# FINAL FIX - Upload CORS Issue

## Root Cause Identified ✅

The CORS error is caused by the Lambda function including `ContentLength` in the pre-signed URL signature. This causes AWS to add `content-length` to the signed headers, which creates a signature mismatch during CORS preflight requests.

**The fix**: Remove `ContentLength` from the pre-signed URL generation.

## What I've Fixed

### 1. Backend (Lambda Function) ✅
- **File**: `C:\Projects\opus-clip-cloud\lambda-functions\6-lambda-api-gateway-upload.py`
- **Change**: Removed `ContentLength` from `s3.generate_presigned_url()` parameters
- **Line**: 143-158

### 2. Frontend (React Component) ✅
- **File**: `C:\Projects\reframe-ai\src\components\UploadHero.tsx`
- **Change**: Added comment explaining why Content-Length is not set manually
- **Line**: 228-229

## What You Need to Do (2 minutes)

### Step 1: Redeploy the Lambda Function

**Option A: Using the deployment script (recommended)**

Open PowerShell/Terminal and run:

```bash
cd C:\Projects\opus-clip-cloud\lambda-functions
.\deploy-upload-lambda.bat
```

**Option B: AWS Console (manual)**

1. Go to **AWS Console** → **Lambda**
2. Open function: **opus-api-gateway-upload**
3. Click **Code** tab
4. Find line 143-154 (the `s3.generate_presigned_url` call)
5. Remove this line: `'ContentLength': file_size`
6. Click **Deploy** button (top right)

**Option C: AWS CLI (quick)**

```bash
cd C:\Projects\opus-clip-cloud\lambda-functions
powershell Compress-Archive -Path 6-lambda-api-gateway-upload.py -DestinationPath upload-lambda.zip -Force
aws lambda update-function-code --function-name opus-api-gateway-upload --zip-file fileb://upload-lambda.zip
```

### Step 2: Test the Upload

1. **Wait 20 seconds** for Lambda to update
2. Open your app: **http://localhost:8080**
3. Open **DevTools** (F12) → **Console** tab
4. **Try uploading a video**

### Expected Result ✅

You should now see:

```
[Upload] Starting upload...
[Upload] API Endpoint: https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod
[Upload] Response status: 200
[Upload] Got pre-signed URL
[Upload] Session ID: <uuid>
[Upload] Upload URL domain: f1ff3bcad7fd44abcea85af75a286b01.r2.cloudflarestorage.com
[Upload] Current origin: http://localhost:8080
[Upload] Starting PUT request to storage...
[Upload] Storage response status: 200  ← THIS SHOULD WORK NOW!
[Upload] File uploaded to storage successfully
[Upload] Processing started
```

**Toast message**: "Upload Successful! Your video is being processed."

## Verification

### Check the Pre-Signed URL

In the browser console, look at the pre-signed URL that's logged. The `X-Amz-SignedHeaders` parameter should **NOT** include `content-length`:

**Before fix** ❌:
```
X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost
```

**After fix** ✅:
```
X-Amz-SignedHeaders=content-type%3Bhost
```

## Why This Works

### The Problem
1. Lambda includes `ContentLength` in pre-signed URL parameters
2. AWS adds `content-length` to the signed headers
3. Browser makes CORS preflight OPTIONS request
4. Browser then makes PUT request with different Content-Length
5. Signature mismatch → 403 Forbidden

### The Solution
1. Lambda doesn't include `ContentLength` in pre-signed URL
2. AWS doesn't add `content-length` to signed headers
3. Browser makes CORS preflight OPTIONS request ✅
4. Browser makes PUT request with Content-Length ✅
5. Signature matches → 200 OK ✅

## Troubleshooting

### Still Getting 403 After Redeployment?

**1. Check if Lambda updated**:
```bash
aws lambda get-function --function-name opus-api-gateway-upload --query 'Configuration.LastModified'
```
Should show recent timestamp.

**2. Check the pre-signed URL**:
- Look in browser console logs
- Find the `uploadUrl` value
- Check `X-Amz-SignedHeaders` parameter
- Should NOT include `content-length`

**3. Clear browser cache**:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or use incognito/private window

**4. Verify R2 CORS** (should already be configured):
```json
{
  "AllowedOrigins": ["http://localhost:8080"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"]
}
```

### Lambda Deployment Failed?

**Check AWS CLI is configured**:
```bash
aws sts get-caller-identity
```
Should show your AWS account details.

**Check function name**:
```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `upload`)].FunctionName'
```
Should show your upload Lambda function name.

## Summary

✅ **Fixed**: Lambda function (removed ContentLength)
✅ **Fixed**: Frontend code (added comments)
✅ **Created**: Deployment scripts
⚡ **Action required**: Redeploy Lambda function
🧪 **Action required**: Test upload

## Files Changed

1. `C:\Projects\opus-clip-cloud\lambda-functions\6-lambda-api-gateway-upload.py` (line 143-158)
2. `C:\Projects\reframe-ai\src\components\UploadHero.tsx` (line 228-229)

## Deployment Scripts Created

1. `C:\Projects\opus-clip-cloud\lambda-functions\deploy-upload-lambda.bat` (Windows)
2. `C:\Projects\opus-clip-cloud\lambda-functions\deploy-upload-lambda.sh` (Linux/Mac)
3. `C:\Projects\opus-clip-cloud\lambda-functions\REDEPLOY_UPLOAD_LAMBDA.md` (Documentation)

---

## Quick Command Reference

**Deploy Lambda**:
```bash
cd C:\Projects\opus-clip-cloud\lambda-functions
.\deploy-upload-lambda.bat
```

**Test API**:
```bash
curl -X POST https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod/upload/generate-url \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","fileName":"test.mp4","fileSize":10000000,"contentType":"video/mp4"}'
```

**Check Lambda status**:
```bash
aws lambda get-function --function-name opus-api-gateway-upload
```

---

After redeploying, your upload feature should work perfectly! 🎉

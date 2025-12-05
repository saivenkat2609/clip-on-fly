# API Gateway Setup Checklist

## Current Issue
Your API Gateway endpoint is returning **404 Not Found** and **CORS errors** because the upload routes haven't been configured yet.

## Error Details
- **Endpoint**: `https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod/upload/generate-url`
- **Error 1**: 404 Not Found (route doesn't exist)
- **Error 2**: CORS blocked (because 404 prevents CORS headers from being returned)
- **Lambda Function**: Ready and working ✅
- **Problem**: API Gateway routes not configured ❌

---

## Setup Steps (AWS Console)

### Step 1: Open API Gateway
1. Go to **AWS Console** → **API Gateway**
2. Find and select API ID: `g78mc4ok92`
3. You should see your existing routes (like `/process` if you have them)

### Step 2: Create `/upload` Resource
1. Select the **root resource** `/`
2. Click **Actions** → **Create Resource**
3. Enter:
   - Resource Name: `upload`
   - Resource Path: `upload` (should auto-fill)
   - ✅ **Enable API Gateway CORS** (IMPORTANT!)
4. Click **Create Resource**

### Step 3: Create `/upload/generate-url` Endpoint
1. Select the **`/upload`** resource you just created
2. Click **Actions** → **Create Resource**
3. Enter:
   - Resource Name: `generate-url`
   - Resource Path: `generate-url`
4. Click **Create Resource**
5. With **`/upload/generate-url`** selected:
   - Click **Actions** → **Create Method**
   - Select **POST** from dropdown
   - Click the checkmark ✓
6. Configure the method:
   - Integration type: **Lambda Function**
   - ✅ **Use Lambda Proxy integration** (CRITICAL!)
   - Lambda Region: `us-east-1` (or your region)
   - Lambda Function: Type and select `opus-api-gateway-upload`
7. Click **Save**
8. Click **OK** when prompted about Lambda permissions

### Step 4: Create `/upload/start` Endpoint
1. Select the **`/upload`** resource
2. Click **Actions** → **Create Resource**
3. Enter:
   - Resource Name: `start`
   - Resource Path: `start`
4. Click **Create Resource**
5. With **`/upload/start`** selected:
   - Click **Actions** → **Create Method**
   - Select **POST** → Click ✓
6. Configure:
   - Integration type: **Lambda Function**
   - ✅ **Use Lambda Proxy integration**
   - Lambda Function: `opus-api-gateway-upload`
7. Click **Save** → **OK**

### Step 5: Enable CORS on All Upload Endpoints
For **EACH** endpoint you created:
- `/upload`
- `/upload/generate-url`
- `/upload/start`

Do this:
1. **Select the resource**
2. Click **Actions** → **Enable CORS**
3. Configure:
   - Access-Control-Allow-Methods: Check **POST, OPTIONS** (and GET if needed)
   - Access-Control-Allow-Headers: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
   - Access-Control-Allow-Origin: `*` (or `http://localhost:8080,https://reframe-ai.netlify.app`)
4. Click **Enable CORS and replace existing CORS headers**
5. Click **Yes, replace existing values**

### Step 6: Deploy API (CRITICAL!)
**You MUST deploy for changes to take effect!**

1. Click **Actions** → **Deploy API**
2. Deployment stage: **prod**
3. Deployment description (optional): "Added upload endpoints"
4. Click **Deploy**

### Step 7: Verify Deployment
After deploying, you should see:
- Stage: **prod**
- Invoke URL: `https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod`

---

## Testing

### Option 1: Use the Test Script
Run this in your terminal (requires `curl` and `jq`):

```bash
bash C:\Projects\reframe-ai\test-upload-api.sh
```

### Option 2: Test Manually with curl

**Test CORS Preflight:**
```bash
curl -X OPTIONS https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod/upload/generate-url \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -v
```
Should return **200 OK** with `Access-Control-Allow-Origin` header.

**Test Generate URL:**
```bash
curl -X POST https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod/upload/generate-url \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "fileName": "test.mp4",
    "fileSize": 10000000,
    "contentType": "video/mp4"
  }'
```
Should return **200 OK** with JSON containing `session_id` and `uploadUrl`.

### Option 3: Test in Browser Console
After deploying, try uploading in your app and check the console logs. You should now see:
```
[Upload] Response status: 200
[Upload] Got pre-signed URL
[Upload] Session ID: <uuid>
```

---

## Troubleshooting

### Still Getting 404?
- ✅ Check you deployed the API (Step 6)
- ✅ Verify the stage is `prod` (not `dev` or `test`)
- ✅ Check the resource path is exactly `/upload/generate-url`
- ✅ Wait 10-30 seconds after deploying for changes to propagate

### Still Getting CORS Error?
- ✅ Verify "Enable CORS" was checked when creating `/upload` resource
- ✅ Run "Enable CORS" on each individual endpoint
- ✅ Make sure you **deployed** after enabling CORS
- ✅ Check Lambda function returns CORS headers (it does, we verified this)

### Getting 403 Forbidden?
- ✅ Make sure "Use Lambda Proxy integration" is enabled
- ✅ Check Lambda permissions allow API Gateway to invoke it:
  - Go to Lambda → Configuration → Permissions → Resource-based policy
  - Should see policy allowing `apigateway.amazonaws.com`

### Getting 500 Internal Server Error?
- ✅ Check CloudWatch logs for `opus-api-gateway-upload` Lambda function
- ✅ Verify Lambda has required environment variables:
  - `BUCKET_NAME`
  - `R2_ENDPOINT` (for Cloudflare R2)
  - `R2_ACCESS_KEY`
  - `R2_SECRET_KEY`

### Getting Different Error?
Check the enhanced console logs in your browser:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try uploading
4. Look for `[Upload]` logs with detailed error info

---

## Expected Final Structure

After setup, your API Gateway should look like this:

```
g78mc4ok92 API Gateway
├── / (root)
│   ├── /process (existing - YouTube flow)
│   │   └── POST → opus-api-gateway (existing Lambda)
│   ├── /status (existing)
│   │   └── /{session_id}
│   │       └── GET → opus-api-gateway
│   └── /upload (NEW!)
│       ├── /generate-url (NEW!)
│       │   └── POST → opus-api-gateway-upload
│       └── /start (NEW!)
│           └── POST → opus-api-gateway-upload
│
└── Deployment: prod
    └── Invoke URL: https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod
```

---

## After Successful Setup

Once API Gateway is configured:
1. ✅ R2 CORS is already configured (you did this earlier)
2. ✅ Lambda function is ready and working
3. ✅ API Gateway routes are configured (you just did this)
4. ✅ Frontend code has enhanced debugging

Try uploading a video again - it should work!

---

## Quick Reference

**API Endpoint**: `https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod`

**Upload Flow**:
1. POST `/upload/generate-url` → Get pre-signed URL
2. PUT to pre-signed URL → Upload file to R2
3. POST `/upload/start` → Start processing
4. Frontend monitors Firestore for status updates

**Lambda Function**: `opus-api-gateway-upload` (C:\Projects\opus-clip-cloud\lambda-functions\6-lambda-api-gateway-upload.py)

**Documentation**:
- Full setup guide: `C:\Projects\opus-clip-cloud\lambda-functions\STEP-4-API-GATEWAY-SETUP.md`
- Upload flow: `C:\Projects\opus-clip-cloud\lambda-functions\UPLOAD-FLOW-DEPLOYMENT-GUIDE.md`

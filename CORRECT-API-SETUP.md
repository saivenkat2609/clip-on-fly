# Correct API Setup for Video Upload

## 🎯 Problem Identified

You were calling the **wrong endpoints**:
- ❌ Wrong: `/upload` and `/process`
- ✅ Correct: `/upload/generate-url` and `/upload/start`

The state machine wasn't triggering because the `/process` endpoint is for YouTube URL flow, not file upload flow!

---

## 📋 Required API Gateway Endpoints

According to your deployment guides, you need **4 main endpoints**:

### 1. Generate Upload URL
```
POST /upload/generate-url
```
**Integration**: Lambda function `opus-api-gateway-upload`

**Request Body**:
```json
{
  "user_id": "firebase_user_id",
  "user_email": "user@example.com",
  "fileName": "my-video.mp4",
  "fileSize": 50000000,
  "contentType": "video/mp4",
  "videoTitle": "My Video",
  "videoDescription": "Optional description"
}
```

**Response**:
```json
{
  "session_id": "uuid-generated-by-backend",
  "uploadUrl": "https://presigned-s3-url...",
  "s3_key": "session-id/uploaded_video.mp4",
  "expiresIn": 3600
}
```

### 2. Start Processing
```
POST /upload/start
```
**Integration**: Lambda function `opus-api-gateway-upload`

**Request Body**:
```json
{
  "session_id": "uuid-from-step-1",
  "user_id": "firebase_user_id",
  "user_email": "user@example.com",
  "videoTitle": "My Video",
  "videoDescription": "Optional description"
}
```

**Response**:
```json
{
  "session_id": "uuid-from-step-1",
  "status": "processing",
  "execution_arn": "arn:aws:states:..."
}
```

### 3. Check Status (Optional - for polling)
```
GET /upload/status/{session_id}
```
**Integration**: Lambda function `opus-api-gateway-upload`

**Response**:
```json
{
  "session_id": "uuid",
  "status": "processing" | "completed" | "failed",
  "start_time": "2025-12-02T10:30:00Z"
}
```

### 4. Get Results (Optional)
```
GET /upload/result/{session_id}
```
**Integration**: Lambda function `opus-api-gateway-upload`

**Response**:
```json
{
  "session_id": "uuid",
  "status": "completed",
  "clips": [...],
  "total_clips": 3
}
```

---

## 🚀 Frontend Upload Flow (Updated)

Your `UploadHero.tsx` now follows this correct flow:

```typescript
// Step 1: Get pre-signed URL
POST /upload/generate-url
→ Returns: session_id, uploadUrl, s3_key

// Step 2: Upload directly to S3
PUT {uploadUrl}
→ Upload file using pre-signed URL

// Step 3: Start state machine processing
POST /upload/start
→ Triggers state machine with session_id

// Step 4: Create Firestore document
→ Track status in real-time

// Step 5: Wait for completion
→ Dashboard listens to Firestore updates
```

---

## ⚙️ AWS Setup Required

### Step 1: Deploy Lambda Functions

You need **2 Lambda functions**:

#### A. Upload Handler (Node.js)
```bash
cd C:\Projects\opus-clip-cloud\lambda-functions\opus-node-upload
npm install
# Zip and deploy to AWS as 'opus-upload-handler'
```

#### B. API Gateway Handler (Python)
```bash
cd C:\Projects\opus-clip-cloud\lambda-functions
# Deploy 6-lambda-api-gateway-upload.py as 'opus-api-gateway-upload'
```

### Step 2: Create State Machine

```bash
# Use state-machine-upload-reuse.json
# Name: OpusClipCloudUploadFlow
```

This state machine:
- ✅ Reuses your existing Lambda functions
- ✅ Starts with "VerifyUpload" step
- ✅ Runs: Transcribe → Detect → Process → Finalize

### Step 3: Configure API Gateway

In AWS Console → API Gateway → Your API:

1. **Create Resource**: `/upload`
2. **Create Child Resources**:
   - `/upload/generate-url` (POST)
   - `/upload/start` (POST)
   - `/upload/status/{session_id}` (GET)
   - `/upload/result/{session_id}` (GET)

3. **Configure Each Endpoint**:
   - Integration type: Lambda Function
   - Lambda: `opus-api-gateway-upload`
   - Enable CORS
   - Deploy to `prod` stage

---

## 🔧 Environment Variables

### Lambda: opus-api-gateway-upload
```bash
STATE_MACHINE_ARN_UPLOAD=arn:aws:states:REGION:ACCOUNT:stateMachine:OpusClipCloudUploadFlow
BUCKET_NAME=opus-clip-videos
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_key
R2_SECRET_KEY=your_secret
MAX_FILE_SIZE=524288000
UPLOAD_EXPIRY=3600
```

### Lambda: opus-upload-handler
```bash
BUCKET_NAME=opus-clip-videos
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_key
R2_SECRET_KEY=your_secret
MAX_FILE_SIZE=524288000
UPLOAD_EXPIRY=3600
```

---

## 🧪 Testing

### Test 1: Check if endpoint exists
```bash
curl -X POST funtionURL/prod/upload/generate-url \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "user_email": "test@test.com",
    "fileName": "test.mp4",
    "fileSize": 1000000,
    "contentType": "video/mp4",
    "videoTitle": "Test"
  }'
```

**Expected**: JSON response with `session_id`, `uploadUrl`, `s3_key`

**If you get 404**: The endpoint doesn't exist - you need to create it in API Gateway

**If you get CORS error**: Enable CORS on the endpoint

### Test 2: Upload a file
```bash
# Use uploadUrl from Test 1
curl -X PUT "{uploadUrl}" \
  -H "Content-Type: video/mp4" \
  --data-binary @test-video.mp4
```

### Test 3: Start processing
```bash
curl -X POST functionURL/prod/upload/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID_FROM_TEST_1",
    "user_id": "test",
    "user_email": "test@test.com",
    "videoTitle": "Test"
  }'
```

**Expected**: JSON with `status: "processing"` and `execution_arn`

**If this fails**: Check STATE_MACHINE_ARN_UPLOAD is set correctly

---

## 🎯 What Was Wrong Before

### Before (Incorrect)
```typescript
// ❌ Wrong endpoints
POST /upload → Tried to call Lambda directly (doesn't exist)
POST /process → YouTube URL flow (different state machine)
```

### Now (Correct)
```typescript
// ✅ Correct endpoints
POST /upload/generate-url → Get pre-signed URL
POST /upload/start → Start upload flow state machine
```

---

## 📊 Checklist

Before testing in your app:

- [ ] Lambda `opus-upload-handler` deployed
- [ ] Lambda `opus-api-gateway-upload` deployed
- [ ] State machine `OpusClipCloudUploadFlow` created
- [ ] API Gateway has `/upload/generate-url` endpoint
- [ ] API Gateway has `/upload/start` endpoint
- [ ] Both endpoints integrated with `opus-api-gateway-upload`
- [ ] CORS enabled on both endpoints
- [ ] API deployed to `prod` stage
- [ ] Environment variables set on both Lambdas
- [ ] `.env` has correct API endpoint URL

---

## 🔍 Debugging

### If upload fails:
1. Check browser console for exact error
2. Verify API endpoint URL includes `/prod` stage
3. Test endpoint with curl first
4. Check Lambda CloudWatch logs

### If state machine doesn't start:
1. Verify `STATE_MACHINE_ARN_UPLOAD` is correct
2. Check IAM permissions for Lambda to start state machine
3. Review `opus-api-gateway-upload` CloudWatch logs
4. Check state machine execution history in AWS Console

### If processing never completes:
1. Check state machine execution in AWS Console
2. Review CloudWatch logs for each Lambda step
3. Verify existing functions work (they should - they're reused from YouTube flow)

---

## 📝 Summary

Your frontend is now calling the **correct endpoints**:
- ✅ `/upload/generate-url` - to get pre-signed URL
- ✅ `/upload/start` - to trigger state machine

The state machine will now properly trigger because you're calling the upload-specific endpoint that starts the `OpusClipCloudUploadFlow` state machine, not the YouTube download flow!

**Next step**: Ensure these endpoints exist in your API Gateway and are properly configured.

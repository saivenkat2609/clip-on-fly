# Video Upload Integration Guide

## Overview
This document explains how the file upload feature integrates with your AWS Step Functions state machine for video processing.

## Architecture

### Components
1. **Frontend (React)**: UploadHero component handles file selection and upload
2. **API Gateway**: Provides endpoints for upload URL generation and processing
3. **Lambda Function**: `opus-node-upload` (opus-upload-handler)
4. **S3/R2 Storage**: Stores uploaded video files
5. **Step Functions**: State machine orchestrates video processing pipeline
6. **Firestore**: Tracks video processing status in real-time

## Upload Workflow

### Step 1: User Selects File
```typescript
// File validation (already implemented)
- Maximum size: 5GB
- Allowed types: MP4, MOV, AVI, WebM, MKV
```

### Step 2: Generate Pre-signed Upload URL
```http
POST ${API_ENDPOINT}/upload
Content-Type: application/json

{
  "action": "generate",
  "session_id": "upload_1234567890_abc123",
  "fileName": "my-video.mp4",
  "fileSize": 52428800,
  "contentType": "video/mp4",
  "user_id": "firebase_user_id",
  "user_email": "user@example.com"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "session_id": "upload_1234567890_abc123",
  "uploadUrl": "https://s3.amazonaws.com/...",
  "s3Key": "upload_1234567890_abc123/uploaded_video.mp4",
  "expiresIn": 3600
}
```

### Step 3: Upload File to S3
```http
PUT {uploadUrl}
Content-Type: video/mp4
Content-Length: 52428800

[Binary file data]
```

### Step 4: Start State Machine Processing
```http
POST ${API_ENDPOINT}/process
Content-Type: application/json

{
  "session_id": "upload_1234567890_abc123",
  "s3_video_key": "upload_1234567890_abc123/uploaded_video.mp4",
  "user_id": "firebase_user_id",
  "user_email": "user@example.com",
  "video_title": "my-video",
  "video_description": "Uploaded from dashboard",
  "startFrom": "verify"
}
```

### Step 5: Create Firestore Document
```typescript
// Document path: users/{userId}/videos/{sessionId}
{
  sessionId: "upload_1234567890_abc123",
  youtubeUrl: "",
  projectName: "my-video",
  status: "processing",
  createdAt: serverTimestamp(),
  videoInfo: {
    title: "my-video",
    duration: 0,
    description: "Uploaded from dashboard",
    thumbnail: ""
  },
  s3VideoKey: "upload_1234567890_abc123/uploaded_video.mp4",
  uploadedFile: true,
  clips: [],
  error: null
}
```

## State Machine Processing Pipeline

Your state machine (`state-machine-upload-reuse.json`) executes these steps:

### 1. VerifyUpload
- **Function**: `opus-upload-handler`
- **Action**: Verify file exists in S3
- **Output**: File metadata, size, video info

### 2. Transcribe
- **Function**: `opus-transcribe`
- **Action**: Generate transcript with word-level timestamps
- **Output**: Transcript key, preview text

### 3. DetectClips
- **Function**: `opus-detect-clips`
- **Action**: AI analyzes transcript for viral moments
- **Output**: Array of clip segments with timestamps and scores

### 4. ProcessClipsInParallel
- **Function**: `opus-process-clip` (runs in parallel, max 3 concurrent)
- **Action**: Process each clip with aspect ratio conversion and karaoke subtitles
- **Output**: Processed clip S3 keys, download URLs

### 5. Finalize
- **Function**: `opus-finalize`
- **Action**: Aggregate results, generate download URLs
- **Output**: Complete list of clips with metadata

## Required API Gateway Endpoints

You need to configure these endpoints in your AWS API Gateway:

### 1. Upload Endpoint
```
POST /upload
```
**Integration**: Lambda function `opus-node-upload`
**Purpose**: Generate pre-signed S3 upload URL

### 2. Process Endpoint
```
POST /process
```
**Integration**: Start Step Functions execution
**Purpose**: Trigger state machine with uploaded video

**Example Lambda integration for /process:**
```javascript
const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions();

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN,
    input: JSON.stringify({
      session_id: body.session_id,
      s3_video_key: body.s3_video_key,
      user_id: body.user_id,
      user_email: body.user_email,
      video_title: body.video_title,
      video_description: body.video_description
    })
  };

  const result = await stepfunctions.startExecution(params).promise();

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      executionArn: result.executionArn,
      session_id: body.session_id
    })
  };
};
```

## Firestore Updates

Your state machine Lambda functions should update Firestore as processing progresses:

### Update Status
```javascript
// In each Lambda function
const admin = require('firebase-admin');
const db = admin.firestore();

// Update status
await db.collection('users').doc(userId)
  .collection('videos').doc(sessionId)
  .update({
    status: 'processing', // or 'completed', 'failed'
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
```

### Update Clips (in Finalize step)
```javascript
await db.collection('users').doc(userId)
  .collection('videos').doc(sessionId)
  .update({
    status: 'completed',
    clips: processedClips.map(clip => ({
      clipIndex: clip.clip_index,
      downloadUrl: clip.download_url,
      s3Key: clip.s3_clip_key,
      title: clip.title,
      virality_score: clip.virality_score,
      score_breakdown: clip.score_breakdown,
      duration: clip.duration,
      startTime: clip.start,
      endTime: clip.end
    })),
    completedAt: admin.firestore.FieldValue.serverTimestamp()
  });
```

## Environment Variables

### Frontend (.env)
```bash
VITE_API_ENDPOINT=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod
```

### Lambda Functions
```bash
# Storage configuration
BUCKET_NAME=opus-clip-videos
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com (optional)
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key

# File upload limits
MAX_FILE_SIZE=524288000  # 500MB in bytes
UPLOAD_EXPIRY=3600       # 1 hour

# State machine
STATE_MACHINE_ARN=arn:aws:states:us-east-1:account:stateMachine:opus-clip-upload-flow

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your-private-key
```

## Testing the Integration

### 1. Test Upload URL Generation
```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/prod/upload \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "session_id": "test_123",
    "fileName": "test.mp4",
    "fileSize": 1000000,
    "contentType": "video/mp4",
    "user_id": "test_user",
    "user_email": "test@example.com"
  }'
```

### 2. Test State Machine Trigger
```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/prod/process \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_123",
    "s3_video_key": "test_123/uploaded_video.mp4",
    "user_id": "test_user",
    "user_email": "test@example.com",
    "video_title": "Test Video",
    "video_description": "Test upload"
  }'
```

## Monitoring

### CloudWatch Logs
- Watch Lambda function logs for each step
- Monitor Step Functions execution history
- Track S3 upload success/failures

### Firestore Real-time Updates
The Dashboard automatically listens to Firestore changes:
```typescript
// Already implemented in Dashboard.tsx
const videosRef = collection(db, `users/${currentUser.uid}/videos`);
const q = query(videosRef, orderBy('createdAt', 'desc'));
onSnapshot(q, (snapshot) => {
  // UI updates automatically when status changes
});
```

## Error Handling

Each Lambda function should update Firestore on errors:
```javascript
try {
  // Processing logic
} catch (error) {
  await db.collection('users').doc(userId)
    .collection('videos').doc(sessionId)
    .update({
      status: 'failed',
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  throw error;
}
```

## Next Steps

1. **Deploy Lambda Functions**: Ensure all functions are deployed to AWS
2. **Configure API Gateway**: Set up /upload and /process endpoints
3. **Deploy State Machine**: Create the Step Functions state machine
4. **Set Environment Variables**: Configure all required env vars
5. **Test End-to-End**: Upload a test video and verify the complete pipeline
6. **Monitor**: Watch CloudWatch and Firestore for real-time updates

## Support

If you encounter issues:
1. Check CloudWatch logs for each Lambda function
2. Verify API Gateway endpoints are correctly configured
3. Ensure IAM roles have proper permissions
4. Check Firestore security rules allow writes from service account
5. Verify S3/R2 bucket permissions and CORS configuration

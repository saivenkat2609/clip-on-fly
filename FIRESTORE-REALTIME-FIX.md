# Firestore Real-Time Updates Fix

## Problem Identified

Your Lambda function **has** the Firestore integration code, but it's **skipping the updates** because the required environment variables are not set in AWS Lambda.

When the finalize Lambda runs, it checks for `FIREBASE_WEB_API_KEY` (line 22-24 in `5-lambda-finalize.py`):

```python
if not user_id or not FIREBASE_WEB_API_KEY:
    print("[Firestore] Skipping update - missing user_id or API key")
    return  # Silently skips Firestore update
```

## Solution: Set Lambda Environment Variables

### Step 1: Get Your Firebase Web API Key

You already have it in your frontend `.env` file:

```
VITE_FIREBASE_API_KEY=AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU
```

This is your Firebase Web API Key.

### Step 2: Configure Lambda Environment Variables

Go to AWS Lambda Console and update **ALL** these Lambda functions:

#### Functions to Update:
1. **opus-finalize** (or similar name for 5-lambda-finalize.py)
2. **opus-download** (should pass user_id through)
3. **opus-transcribe** (should pass user_id through)
4. **opus-detect** (should pass user_id through)
5. **opus-process-clip** (should pass user_id through)

For **EACH** function:

1. Go to **AWS Lambda Console** → Select the function
2. Click **Configuration** tab → **Environment variables**
3. Click **Edit**
4. Add these two variables:

```bash
FIREBASE_PROJECT_ID=reframeai-87b24
FIREBASE_WEB_API_KEY=AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU
```

5. Click **Save**

### Step 3: Verify in CloudWatch Logs

After setting the environment variables, process a test video and check CloudWatch Logs for the finalize Lambda:

**Before Fix (Current):**
```
[Firestore] Skipping update - missing user_id or API key
```

**After Fix (Expected):**
```
[Firestore] Successfully updated video abc-123-def
[Firestore] Updated user stats: totalClips = 5
```

## Quick AWS Lambda Environment Setup Script

If you have AWS CLI configured, you can use this script to update all Lambda functions at once:

```bash
# Set these functions' environment variables
aws lambda update-function-configuration \
  --function-name opus-finalize \
  --environment "Variables={FIREBASE_PROJECT_ID=reframeai-87b24,FIREBASE_WEB_API_KEY=AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU,BUCKET_NAME=opus-clip-videos}"

# Repeat for other functions that need to pass user_id
aws lambda update-function-configuration \
  --function-name opus-download \
  --environment "Variables={BUCKET_NAME=opus-clip-videos}"

# Add similar commands for other Lambda functions
```

## Testing the Fix

1. **Upload a video** from your UI (C:\Projects\reframe-ai)
2. **Watch the Dashboard** - it should show "processing" immediately
3. **Wait for completion** - Dashboard should auto-update to "completed" with download links
4. **No manual refresh needed** - Real-time updates via Firestore

### Expected Flow:

```
User uploads video (Upload.tsx)
  ↓
Frontend creates Firestore doc: status="processing" ✅
  ↓
Dashboard shows "processing" in real-time ✅
  ↓
Lambda processes video ✅
  ↓
Lambda uploads clips to S3 ✅
  ↓
Lambda updates Firestore: status="completed", clips=[...] ✅ (CURRENTLY SKIPPED)
  ↓
Dashboard automatically updates via onSnapshot listener ✅
```

## Current Architecture

### Frontend (React) ✅ WORKING
- **Upload.tsx:86-103** - Creates Firestore video document on upload
- **Dashboard.tsx:103-134** - Real-time listener with `onSnapshot`

### Backend (Lambda) ⚠️ NEEDS FIX
- **6-lambda-api-gateway.py:100-106** - Passes user_id to Step Functions ✅
- **5-lambda-finalize.py:18-146** - Firestore integration code ✅
- **5-lambda-finalize.py:240-243** - Calls Firestore update functions ✅
- **Environment Variables** - NOT SET ❌ (THIS IS THE ISSUE)

## Why Videos Upload to S3 But UI Doesn't Update

1. Lambda successfully processes video ✅
2. Lambda uploads clips to S3 ✅
3. Lambda saves result.json to S3 ✅
4. Lambda tries to update Firestore ❌
   - Checks for FIREBASE_WEB_API_KEY
   - Key is missing
   - Silently skips update
   - Logs: "[Firestore] Skipping update - missing user_id or API key"
5. Dashboard never receives update ❌
   - onSnapshot listener is waiting for Firestore changes
   - No changes happen, so UI never updates

## How to Check Current Lambda Configuration

AWS Console → Lambda → Select function → Configuration tab → Environment variables

**Current (Likely):**
```
BUCKET_NAME=opus-clip-videos
STATE_MACHINE_ARN=arn:aws:states:...
```

**Needed:**
```
BUCKET_NAME=opus-clip-videos
STATE_MACHINE_ARN=arn:aws:states:...
FIREBASE_PROJECT_ID=reframeai-87b24          ← ADD THIS
FIREBASE_WEB_API_KEY=AIzaSyDT1Q_...          ← ADD THIS
```

## Troubleshooting

### If still not working after adding environment variables:

1. **Check CloudWatch Logs:**
   - Go to AWS CloudWatch → Log groups
   - Find `/aws/lambda/opus-finalize` (or similar)
   - Look for recent log streams
   - Search for "[Firestore]" messages

2. **Expected success logs:**
   ```
   [Finalize] User ID: abc-123
   [Firestore] Successfully updated video session-id
   [Firestore] Updated user stats: totalClips = 5
   ```

3. **If you see HTTP errors:**
   ```
   [Firestore] Update failed: 403 - Permission denied
   ```
   - Check Firebase security rules
   - Verify API key is correct

4. **If you see network errors:**
   ```
   [Firestore] Error updating document: timeout
   ```
   - Check Lambda VPC settings (should NOT be in VPC)
   - Verify Lambda has internet access

## Deployment Checklist

- [ ] Set FIREBASE_PROJECT_ID in opus-finalize Lambda
- [ ] Set FIREBASE_WEB_API_KEY in opus-finalize Lambda
- [ ] Test video upload
- [ ] Check CloudWatch logs for "[Firestore] Successfully updated"
- [ ] Verify Dashboard auto-updates without refresh
- [ ] Check Firestore console - video document should have clips array

## Files Reference

### Frontend (Your Current Repo)
- `src/pages/Upload.tsx:86-103` - Creates video doc in Firestore
- `src/pages/Dashboard.tsx:103-134` - Real-time listener
- `src/lib/firebase.ts:1-23` - Firebase config

### Backend (Lambda Repo)
- `C:\Projects\opus-clip-cloud\lambda-functions\5-lambda-finalize.py:18-146` - Firestore integration
- `C:\Projects\opus-clip-cloud\lambda-functions\6-lambda-api-gateway.py:100-106` - Passes user_id

## Cost Impact

Adding environment variables has **zero cost impact**. Firestore updates add ~100-200ms to Lambda execution time, which is negligible.

## Next Steps After Fix

Once working, you should see:
1. Real-time statistics on Dashboard
2. Video status updates without refresh
3. Instant clip download links when ready
4. Processing → Completed transition automatically

If you need help accessing AWS Lambda Console or checking CloudWatch logs, let me know!

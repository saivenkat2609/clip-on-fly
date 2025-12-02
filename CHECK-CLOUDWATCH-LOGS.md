# How to Check CloudWatch Logs

## Your Current Status

✅ **GOOD NEWS:** user_id is now reaching finalize Lambda!
```json
{
  "user_id": "RvhJhMsmeMMhbTlzt5XzjzAeve92",
  "user_email": "saivenkat2609@gmail.com",
  "clips": [1 clip generated],
  "status": "completed"
}
```

❌ **PROBLEM:** UI still shows "processing" → Firestore not being updated

## Why This Happens

The finalize Lambda checks for `FIREBASE_WEB_API_KEY` environment variable:

```python
if not user_id or not FIREBASE_WEB_API_KEY:
    print("[Firestore] Skipping update - missing user_id or API key")
    return  # Silently skips Firestore update
```

Since user_id is present now, the issue is **FIREBASE_WEB_API_KEY is not set**.

## Step 1: Check CloudWatch Logs

### Option A: AWS Console

1. Go to **AWS CloudWatch Console**
2. In left sidebar, click **"Logs" → "Log groups"**
3. Find and click: `/aws/lambda/opus-finalize`
4. Click on the **most recent log stream** (top of list)
5. Search for `[Firestore]` in the logs

### What You'll See:

**If env vars NOT set (current state):**
```
[Finalize] Session: 27cc46bc-3e8c-470c-9cfe-ba5df2e18099
[Finalize] User ID: RvhJhMsmeMMhbTlzt5XzjzAeve92
[Finalize] Processing 1 clips
[Firestore] Skipping update - missing user_id or API key  ← THIS!
[Finalize] Complete! Generated 1 download URLs
```

**If env vars ARE set (what we need):**
```
[Finalize] Session: 27cc46bc-3e8c-470c-9cfe-ba5df2e18099
[Finalize] User ID: RvhJhMsmeMMhbTlzt5XzjzAeve92
[Finalize] Processing 1 clips
[Firestore] Successfully updated video 27cc46bc-3e8c-470c-9cfe-ba5df2e18099  ← THIS!
[Firestore] Updated user stats: totalClips = X  ← THIS!
[Finalize] Complete! Generated 1 download URLs
```

### Option B: AWS CLI

```bash
# Get latest log stream
aws logs describe-log-streams \
  --log-group-name /aws/lambda/opus-finalize \
  --order-by LastEventTime \
  --descending \
  --max-items 1

# Get log events (replace LOG_STREAM_NAME with output from above)
aws logs get-log-events \
  --log-group-name /aws/lambda/opus-finalize \
  --log-stream-name "LOG_STREAM_NAME"
```

## Step 2: Set Lambda Environment Variables

Since you now have user_id working, we just need to set the Firebase credentials.

### Quick Steps:

1. Go to **AWS Lambda Console**
2. Find and click: **opus-finalize**
3. Click **"Configuration"** tab
4. Click **"Environment variables"** in left sidebar
5. Click **"Edit"** button
6. Click **"Add environment variable"** (twice)

Add these:

**Variable 1:**
```
Key:   FIREBASE_PROJECT_ID
Value: reframeai-87b24
```

**Variable 2:**
```
Key:   FIREBASE_WEB_API_KEY
Value: AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU
```

7. Click **"Save"**

### Important Note:

You might already have these variables:
- `BUCKET_NAME`
- `STATE_MACHINE_ARN`

**Keep those!** Just add the two Firebase variables alongside them.

## Step 3: Test Again

1. **Upload a new video** (or wait for current one to finish if still processing)
2. **Check CloudWatch logs** - should now see:
   ```
   [Firestore] Successfully updated video ...
   [Firestore] Updated user stats: totalClips = X
   ```
3. **Dashboard** - should auto-update to show completed video!

## Step 4: Check Firestore Console (Optional)

To verify the data is actually being written:

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select project: **reframeai-87b24**
3. Click **Firestore Database** in left sidebar
4. Navigate to: `users/{your-user-id}/videos/{session-id}`
5. You should see:
   - `status: "completed"`
   - `clips: [array with 1 item]`
   - `completedAt: timestamp`

Your user_id is: `RvhJhMsmeMMhbTlzt5XzjzAeve92`
Your session_id is: `27cc46bc-3e8c-470c-9cfe-ba5df2e18099`

## Why Current Video Still Shows "Processing"

The video with session_id `27cc46bc-3e8c-470c-9cfe-ba5df2e18099` finished processing but Firestore was never updated because the environment variables weren't set.

**Two options:**

### Option 1: Wait for Next Video
- Set environment variables now
- Upload a new video
- New video will update Firestore correctly
- Dashboard will show it automatically

### Option 2: Manually Update Current Video in Firestore
- Go to Firebase Console
- Navigate to: `users/RvhJhMsmeMMhbTlzt5XzjzAeve92/videos/27cc46bc-3e8c-470c-9cfe-ba5df2e18099`
- Edit document and set:
  - `status` = `"completed"`
  - `clips` = (copy from Lambda output)
  - `completedAt` = (current timestamp)

## Quick Test Script

I can create a script to check if environment variables are set:

```bash
# Run this after setting env vars
aws lambda get-function-configuration \
  --function-name opus-finalize \
  --query 'Environment.Variables' \
  --output json
```

Should show:
```json
{
  "BUCKET_NAME": "opus-clip-videos",
  "FIREBASE_PROJECT_ID": "reframeai-87b24",
  "FIREBASE_WEB_API_KEY": "AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU"
}
```

## Summary

**Current State:**
- ✅ Step Functions passes user_id correctly
- ✅ Finalize Lambda receives user_id
- ❌ Lambda environment variables not set
- ❌ Firestore updates skipped
- ❌ UI shows "processing" forever

**After Setting Env Vars:**
- ✅ Step Functions passes user_id correctly
- ✅ Finalize Lambda receives user_id
- ✅ Lambda environment variables set
- ✅ Firestore updates succeed
- ✅ UI shows "completed" automatically

## Next Steps

1. **Check CloudWatch logs** (confirm env vars are missing)
2. **Set Lambda environment variables** (2 minutes)
3. **Test with new video** (should work end-to-end!)

Let me know what you see in the CloudWatch logs!

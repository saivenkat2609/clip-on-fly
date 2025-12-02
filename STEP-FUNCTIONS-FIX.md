# Critical Fix: Step Functions Not Passing user_id

## Problem

Your Step Functions state machine is **not passing `user_id` and `user_email`** to the finalize Lambda, which is why:

1. ❌ Firestore never gets updated (user_id is empty)
2. ❌ Videos don't appear in the UI (no real-time updates)
3. ❌ The video count increments but videos don't show

## Evidence from Your Response

```json
{
  "user_id": "",      // ❌ Empty!
  "user_email": "",   // ❌ Empty!
  "clips": [],        // ❌ No clips generated!
  "total_clips": 0
}
```

## Root Cause

In `step-functions-state-machine.json`, the `FinalizeResults` state (lines 159-169) is missing `user_id` and `user_email`:

**BEFORE (Current - BROKEN):**
```json
"FinalizeResults": {
  "Type": "Task",
  "Resource": "arn:aws:lambda:us-east-1:930115312558:function:opus-finalize",
  "Parameters": {
    "session_id.$": "$.session_id",
    "processed_clips.$": "$.processed_clips",
    "video_info.$": "$.video_info"
    // ❌ Missing: user_id and user_email!
  },
  "End": true
}
```

**AFTER (Fixed):**
```json
"FinalizeResults": {
  "Type": "Task",
  "Resource": "arn:aws:lambda:us-east-1:930115312558:function:opus-finalize",
  "Parameters": {
    "session_id.$": "$.session_id",
    "processed_clips.$": "$.processed_clips",
    "video_info.$": "$.video_info",
    "user_id.$": "$.user_id",           // ✅ Added!
    "user_email.$": "$.user_email"      // ✅ Added!
  },
  "End": true
}
```

## About Empty Clips Array

The `"clips": []` issue is separate - this happens when:
1. The detect Lambda doesn't find any viral moments (90-second video might be too short)
2. The process-clips Lambda fails silently
3. The video doesn't have speech/transcript

For now, let's focus on fixing the user_id issue first.

## Solution: Update Step Functions State Machine

### Option 1: AWS Console (Easiest)

1. Go to **AWS Step Functions Console**
2. Find your state machine (likely named `OpusClipProcessing` or similar)
3. Click **Edit**
4. Find the `FinalizeResults` state
5. Update the `Parameters` section to include:
   ```json
   "user_id.$": "$.user_id",
   "user_email.$": "$.user_email"
   ```
6. Also update `ProcessClipsInParallel` → `Parameters` to pass user_id:
   ```json
   "user_id.$": "$.user_id",
   "user_email.$": "$.user_email"
   ```
7. Click **Save**

### Option 2: Use Fixed JSON File

I've created a fixed version: `step-functions-state-machine-FIXED.json`

**Changes Made:**
1. Line 135-136: Added `user_id` and `user_email` to ProcessClipsInParallel Parameters
2. Line 167-168: Added `user_id` and `user_email` to FinalizeResults Parameters
3. Line 182-183: Added `user_id` and `user_email` to HandleError Parameters

**To Deploy:**

```bash
cd C:\Projects\opus-clip-cloud\lambda-functions

# Update state machine (replace with your ARN)
aws stepfunctions update-state-machine \
  --state-machine-arn "arn:aws:states:us-east-1:930115312558:stateMachine:OpusClipProcessing" \
  --definition file://step-functions-state-machine-FIXED.json
```

Or manually:
1. Copy contents of `step-functions-state-machine-FIXED.json`
2. Go to AWS Step Functions Console
3. Select your state machine
4. Click **Edit**
5. Paste the JSON definition
6. Click **Save**

## Verify the Fix

After updating the state machine:

1. **Process a test video**
2. **Check the finalize Lambda response** - should now have:
   ```json
   {
     "user_id": "abc123...",     // ✅ Has value!
     "user_email": "user@gmail.com"  // ✅ Has value!
   }
   ```
3. **Check CloudWatch Logs** for finalize Lambda:
   ```
   [Firestore] Successfully updated video abc-123
   [Firestore] Updated user stats: totalClips = 5
   ```
4. **Dashboard should auto-update** with completed video

## About the Empty Clips Issue

This is a separate issue. The video you tested (90 seconds) might be too short for clip detection. To debug:

1. **Check CloudWatch Logs** for `opus-detect` Lambda
2. Look for messages like:
   ```
   [Detect] Analyzing X segments...
   [Detect] Found Y clip candidates
   [Detect] Selected Z top clips
   ```
3. If it says "Found 0 clip candidates", the video didn't have detectable viral moments

**Quick test with a longer video:**
- Try a video that's 5+ minutes long
- With clear speech/dialogue
- Popular content (like a podcast or interview)

## Deployment Checklist

- [ ] Update Step Functions state machine definition
- [ ] Add user_id to FinalizeResults Parameters
- [ ] Add user_email to FinalizeResults Parameters
- [ ] Add user_id to ProcessClipsInParallel Parameters
- [ ] Add user_email to ProcessClipsInParallel Parameters
- [ ] Set Lambda environment variables (FIREBASE_WEB_API_KEY)
- [ ] Test with a longer video (5+ minutes)
- [ ] Check CloudWatch logs for Firestore success messages
- [ ] Verify Dashboard updates automatically

## Why Video Count Increased But No Videos Show

1. Frontend creates Firestore doc on upload → Count increases ✅
2. Lambda processes video → Uploads to S3 ✅
3. Lambda tries to update Firestore → **user_id is empty** → Skips update ❌
4. Dashboard never receives "completed" status → Video stays "processing" forever ❌

## After This Fix

1. Frontend creates doc: `status="processing"` ✅
2. Dashboard shows "processing" in real-time ✅
3. Lambda completes and receives user_id ✅
4. Lambda updates Firestore: `status="completed", clips=[...]` ✅
5. Dashboard instantly shows completed video ✅
6. Download buttons appear ✅

## Files Modified

- `step-functions-state-machine-FIXED.json` - Fixed state machine definition

## Next Steps

1. **Deploy the fixed state machine** (Option 1 or 2 above)
2. **Set Lambda environment variables** (if not already done):
   - FIREBASE_PROJECT_ID=reframeai-87b24
   - FIREBASE_WEB_API_KEY=AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU
3. **Test with a longer video** (5+ minutes with speech)
4. **Check CloudWatch logs** to verify Firestore updates

Need help accessing AWS Step Functions Console or deploying the fix? Let me know!

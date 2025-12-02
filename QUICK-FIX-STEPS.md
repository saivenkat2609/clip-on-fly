# Quick Fix: 3-Minute Solution for Real-Time Updates

## The Problem
Videos upload to S3 successfully, but your Dashboard doesn't show real-time updates because Lambda environment variables are missing.

## The Solution (3 Steps)

### Step 1: Go to AWS Lambda Console

1. Open https://console.aws.amazon.com/lambda/
2. Find and click on the function named **"opus-finalize"** (or similar)

### Step 2: Add Environment Variables

1. Click the **"Configuration"** tab
2. Click **"Environment variables"** in the left sidebar
3. Click **"Edit"** button
4. Click **"Add environment variable"** (twice - for two variables)

Add these two variables:

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

5. Click **"Save"**

### Step 3: Test It

1. Go to your app: http://localhost:5173 (or your app URL)
2. Navigate to **Upload** page
3. Paste a YouTube URL and click **"Start Processing"**
4. Go to **Dashboard** - you should see status: "processing"
5. Wait 2-5 minutes - Dashboard should auto-update to "completed" with download buttons

**No manual refresh needed!**

## How to Verify It's Working

### Check CloudWatch Logs (Optional)

1. Go to AWS CloudWatch Console
2. Click "Log groups" in left sidebar
3. Find `/aws/lambda/opus-finalize`
4. Click on the most recent log stream
5. Look for these messages:

**SUCCESS:**
```
[Firestore] Successfully updated video abc-123-def-456
[Firestore] Updated user stats: totalClips = 5
```

**FAILURE (means env vars not set):**
```
[Firestore] Skipping update - missing user_id or API key
```

## Alternative: Use Command Line (if you have AWS CLI)

Run this command:

```bash
aws lambda update-function-configuration \
  --function-name opus-finalize \
  --environment "Variables={FIREBASE_PROJECT_ID=reframeai-87b24,FIREBASE_WEB_API_KEY=AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU,BUCKET_NAME=opus-clip-videos}"
```

Or on Windows:

```cmd
check-lambda-config.bat
```

This script will check if the variables are set and help you add them.

## What If It Still Doesn't Work?

### Common Issues:

**1. Wrong Lambda Function Name**
- Check if your function is called something else
- Look for functions with "finalize" or "5-lambda" in the name

**2. Multiple Regions**
- Make sure you're in the correct AWS region (probably us-east-1)
- Check the region dropdown in top-right of AWS Console

**3. Permission Errors in CloudWatch**
- If you see "403 Forbidden" errors
- Verify the Firebase Web API key is correct (check your .env file)

**4. Lambda in VPC**
- If Lambda is in a VPC, it might not have internet access
- Go to Configuration → VPC → Remove VPC configuration

**5. Still Shows "Processing" Forever**
- Check if Lambda is actually completing
- Go to AWS Step Functions and check execution status
- If Step Functions shows "Failed", check individual Lambda logs

## Understanding the Fix

### Before (Current State):
```
Lambda runs → Uploads to S3 ✅ → Tries to update Firestore →
Missing API key → Skips update ❌ → Dashboard never updates ❌
```

### After (Fixed):
```
Lambda runs → Uploads to S3 ✅ → Updates Firestore ✅ →
Dashboard onSnapshot listener receives update ✅ → UI updates automatically ✅
```

## Support Files

- **FIRESTORE-REALTIME-FIX.md** - Detailed explanation and troubleshooting
- **check-lambda-config.bat** - Script to verify Lambda configuration
- **PHASE-3-5-IMPLEMENTATION.md** - Full implementation documentation

## Need Help?

If you still have issues after following these steps:

1. Run `check-lambda-config.bat` and share the output
2. Check CloudWatch logs and look for "[Firestore]" messages
3. Verify your Dashboard is using Firestore listeners (src/pages/Dashboard.tsx:103-134)
4. Check Firebase Console to see if video documents are being created

The fix should take **less than 3 minutes** and requires no code changes!

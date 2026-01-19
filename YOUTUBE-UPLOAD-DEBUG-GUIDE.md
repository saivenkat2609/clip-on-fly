# YouTube Upload UTF-8 Error Debugging Guide

## What Changed

I've added comprehensive debugging and sanitization to fix the "Malformed UTF-8 data" error.

### Changes Made

1. **New Sanitization Function** (`sanitizeForYouTube`)
   - Removes null bytes and control characters
   - Validates UTF-8 encoding
   - Falls back to ASCII if UTF-8 validation fails

2. **Enhanced Validation** (`validateYouTubeMetadata`)
   - Logs detailed metadata before upload
   - Checks for emojis, null bytes, character counts
   - Shows exact byte counts for each field

3. **Better Error Logging**
   - Captures complete YouTube API error responses
   - Logs error domain, reason, and detailed messages
   - Shows all validation details in Firebase logs

4. **Test Function** (`testYouTubeMetadata`)
   - Test metadata WITHOUT uploading
   - See exactly what will be sent to YouTube
   - Validate before attempting upload

## How to Debug

### Step 1: Deploy Updated Functions

```bash
cd C:\Projects\reframeAI\reframe-ai\functions
npm run build
firebase deploy --only functions:uploadToYouTube,functions:testYouTubeMetadata
```

### Step 2: Enable Debug Mode in Frontend

Add to your `.env` file:
```
VITE_DEBUG_MODE=true
```

This will show the "🔍 Test Metadata" button in the YouTube upload modal.

### Step 3: Test Your Metadata

1. Open a video clip
2. Click "Post to YouTube"
3. Fill in title, description, and tags
4. Click "🔍 Test Metadata (Debug)" button (will appear if debug mode is enabled)
5. Check browser console for validation results

The test will show:
- Original metadata
- Sanitized metadata
- Character/byte counts
- Whether emojis or null bytes were detected

### Step 4: View Firebase Logs

When you attempt an actual upload, check Firebase logs:

```bash
firebase functions:log --only uploadToYouTube
```

Look for these log sections:

#### Raw Metadata Received
```
Raw metadata received: {
  title: "...",
  description: "...",
  tags: [...]
}
```

#### Validation Results
```
=== YouTube Metadata Validation ===
Title: {
  length: 50,
  bytes: 50,
  preview: "My Video Title",
  containsEmojis: false,
  containsNullBytes: false
}
Description: {...}
Tags: {...}
=================================
```

#### YouTube API Errors (if any)
```
YouTube API Error Details: {
  message: "...",
  code: 400,
  errors: [{
    domain: "youtube.snippet",
    reason: "invalidValue",
    message: "Malformed UTF-8 data"
  }]
}
```

## Common Issues and Fixes

### Issue 1: Emojis in Tags
**Symptoms:** "Malformed UTF-8 data" error
**Fix:** Tags are now automatically sanitized to remove emojis
**Verification:** Use test function, check logs for `containsEmojis: true`

### Issue 2: Null Bytes in Text
**Symptoms:** "Malformed UTF-8 data" error
**Fix:** `sanitizeForYouTube` removes null bytes
**Verification:** Check logs for `containsNullBytes: true`

### Issue 3: Special Characters in Description
**Symptoms:** "Malformed UTF-8 data" error
**Fix:** Full UTF-8 validation and re-encoding
**Verification:** Check logs for UTF-8 encoding errors

### Issue 4: Very Long Tags
**Symptoms:** YouTube rejects upload
**Fix:** Tags are truncated to 500 characters each
**Verification:** Check `bytes` count in logs

## Manual Testing Scenarios

### Test 1: Emojis in All Fields
```
Title: "My Amazing Video 🔥✨"
Description: "Check this out! 🎉🎊"
Tags: "viral,trending,🔥,awesome"
```
Expected: Emojis removed, upload succeeds

### Test 2: Special Characters
```
Title: "Video with Ñoño & André"
Description: "Café™ © 2024"
Tags: "español,français,português"
```
Expected: Special characters preserved, upload succeeds

### Test 3: Very Long Content
```
Title: 120 character title (truncated to 100)
Description: 6000 character description (truncated to 5000)
Tags: "tag1,tag2,...,tag100" (each validated)
```
Expected: Content truncated, upload succeeds

## Where to Look for Errors

### 1. Browser Console
- Test metadata results
- Frontend error messages
- Network request details

### 2. Firebase Functions Logs
```bash
# Real-time logs
firebase functions:log --only uploadToYouTube

# Or view in Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs
```

Look for:
- "Raw metadata received"
- "YouTube Metadata Validation"
- "YouTube API Error Details"

### 3. YouTube API Response
Check the detailed error in logs:
```json
{
  "domain": "youtube.snippet",
  "reason": "invalidValue",
  "message": "Malformed UTF-8 data",
  "locationType": "parameter",
  "location": "snippet.title" // <-- This tells you WHICH field
}
```

## Quick Fixes

### If title is the problem:
```typescript
// Check what's being sent
console.log('Title bytes:', Buffer.byteLength(title, 'utf8'));
console.log('Title chars:', Array.from(title).length);
```

### If description is the problem:
```typescript
// Test for problematic characters
const hasNullBytes = /\x00/.test(description);
const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(description);
console.log({ hasNullBytes, hasEmojis });
```

### If tags are the problem:
```typescript
// Validate each tag individually
tags.forEach((tag, i) => {
  console.log(`Tag ${i}:`, {
    value: tag,
    bytes: Buffer.byteLength(tag, 'utf8'),
    valid: /^[\x20-\x7E\u00C0-\u017F\s-]*$/.test(tag)
  });
});
```

## Still Getting Errors?

If you're still seeing "Malformed UTF-8 data" after these fixes:

1. **Test with minimal data first:**
   ```
   Title: "Test Video"
   Description: "Test"
   Tags: "test"
   ```

2. **Add one field at a time:**
   - Start with just title
   - Add description
   - Add one tag
   - Add more tags

3. **Check the exact error location:**
   - Look at `error.response.data.error.errors[0].location`
   - This tells you which field (title, description, or tags)

4. **Share the logs:**
   - Copy the "YouTube API Error Details" from Firebase logs
   - Copy the "YouTube Metadata Validation" output
   - This will show exactly what's being rejected

## Next Steps

After deploying:
1. Try uploading a video with simple ASCII text
2. Try with emojis
3. Try with special characters
4. Check Firebase logs for validation details
5. Use the test function to validate before uploading

The logs will now tell you EXACTLY which field and what character is causing the issue.

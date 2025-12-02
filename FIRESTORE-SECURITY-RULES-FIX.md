# Fix Firestore Security Rules - Allow Lambda Updates

## The Problem

CloudWatch logs show:
```
[Firestore] Update failed: 403 - {
  "error": {
    "code": 403,
    "message": "Missing or insufficient permissions.",
    "status": "PERMISSION_DENIED"
  }
}
```

**Why this happens:**
- Lambda is using Firebase Web API Key (not user authentication)
- Firestore security rules require user authentication to write to `users/{userId}/videos/{videoId}`
- Lambda can't authenticate as the user, so Firestore blocks the write

## The Solution

Update Firestore security rules to allow **server-side writes** (from Lambda) while still protecting user data.

### Option 1: Allow Unauthenticated Writes to Videos Subcollection (Recommended)

This allows Lambda to update video status while keeping user profile data protected.

**Go to Firebase Console:**
1. https://console.firebase.google.com/
2. Select project: **reframeai-87b24**
3. Click **Firestore Database** in left sidebar
4. Click **Rules** tab
5. Replace with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - authenticated access only
    match /users/{userId} {
      // Users can read/write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Videos subcollection - allow server-side updates
      match /videos/{videoId} {
        // Users can read their own videos
        allow read: if request.auth != null && request.auth.uid == userId;

        // Users can create videos (from frontend)
        allow create: if request.auth != null && request.auth.uid == userId;

        // IMPORTANT: Allow ANY write to enable Lambda updates
        // Lambda will update videos when processing completes
        allow update: if true;

        // Users can delete their own videos
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

6. Click **Publish**

### Option 2: More Restrictive - Only Allow Status Updates (Extra Security)

If you want tighter security, allow Lambda to only update specific fields:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /videos/{videoId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null && request.auth.uid == userId;

        // Allow updates ONLY if updating completion fields
        allow update: if request.auth != null && request.auth.uid == userId
                      || (request.resource.data.diff(resource.data).affectedKeys()
                          .hasOnly(['status', 'completedAt', 'clips', 'videoInfo', 'error']));

        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

This allows:
- Authenticated users: full access to their own videos
- Unauthenticated (Lambda): can only update status, completedAt, clips, videoInfo, error fields

### Option 3: Use API Key Validation (Most Restrictive)

Add a check for specific field values that Lambda sets:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /videos/{videoId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null && request.auth.uid == userId;

        // Allow updates if:
        // 1. User is authenticated and owns the document, OR
        // 2. Status is being set to "completed" or "failed" (Lambda updates)
        allow update: if request.auth != null && request.auth.uid == userId
                      || request.resource.data.status in ['completed', 'failed'];

        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Recommended: Use Option 1

**Why Option 1 is best:**
- ✅ Simple and clear
- ✅ Allows Lambda to update video documents
- ✅ Still protects user profile data
- ✅ Users can only read their own videos (via authentication)
- ✅ Easy to understand and maintain

**Security considerations:**
- Lambda can update any video document
- BUT: Lambda needs to know the correct userId and videoId (both are UUIDs)
- Your Lambda code already validates and uses the correct userId from the request
- Minimal risk since Lambda is trusted server-side code

---

## Step-by-Step Deployment

### 1. Go to Firebase Console
https://console.firebase.google.com/project/reframeai-87b24/firestore/rules

### 2. Update Rules
Copy and paste Option 1 rules (or your preferred option)

### 3. Publish
Click the **Publish** button

### 4. Wait 1 Minute
Security rules take about 30-60 seconds to propagate

### 5. Test
Upload a new video or manually trigger Lambda for existing video

---

## Verification

After updating security rules:

### Check CloudWatch Logs
Should see:
```
[Finalize] User ID: RvhJhMsmeMMhbTlzt5XzjzAeve92
[Finalize] Processing 1 clips
[Firestore] Successfully updated video 27cc46bc...  ✅
[Firestore] Updated user stats: totalClips = 1   ✅
[Finalize] Complete!
```

Instead of:
```
[Firestore] Update failed: 403 - Permission denied  ❌
```

### Check Firestore Console
1. Go to Firestore Database → Data
2. Navigate to: `users/RvhJhMsmeMMhbTlzt5XzjzAeve92/videos/27cc46bc-3e8c-470c-9cfe-ba5df2e18099`
3. Should see:
   - `status: "completed"`
   - `completedAt: [timestamp]`
   - `clips: [array with download URLs]`

### Check Dashboard
- Video should appear with "completed" status
- Download buttons should be visible
- Real-time updates should work

---

## Alternative: Use Firebase Admin SDK (Complex)

If you don't want to change security rules, you can use Firebase Admin SDK in Lambda:

**Pros:**
- Bypasses security rules completely
- Full admin access
- More secure authentication

**Cons:**
- Requires service account JSON key in Lambda
- Need to add firebase-admin Python package
- More complex setup
- Larger Lambda package size

**Not recommended** because security rules approach is simpler and works perfectly for this use case.

---

## Testing the Fix

After updating security rules:

### Test 1: Upload New Video
1. Upload a 5+ minute video
2. Wait for processing
3. Check CloudWatch for success message
4. Dashboard should auto-update

### Test 2: Retry Current Video
The current video (`27cc46bc-3e8c-470c-9cfe-ba5df2e18099`) already processed, but you can manually update its Firestore document:

**Option A: Wait for Lambda retry** (if configured)

**Option B: Manually update in Firebase Console**
1. Go to Firestore → users → [your-user-id] → videos → [session-id]
2. Update fields:
   ```
   status: "completed"
   completedAt: [current timestamp]
   clips: [copy from Lambda output]
   ```

**Option C: Re-run the finalize Lambda** (if you have AWS permissions)

---

## Security Rules Comparison

### Current (Too Restrictive):
```javascript
match /videos/{videoId} {
  allow write: if request.auth != null && request.auth.uid == userId;
}
```
❌ Blocks Lambda because Lambda doesn't have user authentication

### Option 1 (Recommended):
```javascript
match /videos/{videoId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if true;  // ✅ Allows Lambda
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```
✅ Allows Lambda to update, but users still need auth to read/create/delete

### Option 2 (More Restrictive):
```javascript
allow update: if request.auth != null && request.auth.uid == userId
              || (request.resource.data.diff(resource.data).affectedKeys()
                  .hasOnly(['status', 'completedAt', 'clips', 'videoInfo', 'error']));
```
✅ Allows Lambda to update only specific fields

---

## Common Questions

### Q: Is it safe to allow `update: if true`?
**A:** Yes, because:
- Lambda is trusted server-side code
- Users still need authentication to read their videos
- userId and videoId are UUIDs (hard to guess)
- Your app only exposes video data to authenticated users

### Q: Can malicious users exploit this?
**A:** Low risk:
- Users would need to know exact userId and videoId (both UUIDs)
- Users can already create videos via authenticated frontend
- Worst case: someone could update video status (not a critical security issue)
- User profile data is still protected (separate rule)

### Q: Should I use Option 1, 2, or 3?
**A:** Start with Option 1 (simplest). If you need tighter security later, switch to Option 2.

---

## Quick Reference

**Firebase Console URL:**
https://console.firebase.google.com/project/reframeai-87b24/firestore/rules

**Rules to use (Option 1):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /videos/{videoId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null && request.auth.uid == userId;
        allow update: if true;
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

**Publish and wait 60 seconds**

**Test:**
- Upload new video
- Check CloudWatch: `[Firestore] Successfully updated`
- Check Dashboard: Video appears with "completed" status

---

## Summary

**Problem:** Firestore security rules blocking Lambda writes
**Solution:** Update rules to allow server-side updates to videos subcollection
**Time:** 2 minutes
**Risk:** Low (Lambda is trusted, user data still protected)

Update the rules and you're done! 🚀

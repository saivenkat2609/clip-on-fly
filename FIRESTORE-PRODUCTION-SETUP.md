# Firestore Production Mode Setup

## What You Need to Do

Since you selected **production mode**, Firestore denies all reads/writes by default. You must add security rules to allow authenticated users to access their data.

## Setup Steps (5 minutes)

### 1. Go to Firebase Console
- Navigate to: https://console.firebase.google.com/
- Select project: **reframeai-87b24**
- Click **Firestore Database** in left sidebar

### 2. Update Security Rules
- Click the **Rules** tab at the top
- Replace the default rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Videos subcollection (for future use)
      match /videos/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 3. Publish Rules
- Click **Publish** button
- Rules take effect immediately

## What These Rules Do

✅ **Allow**: Authenticated users can read/write their own `users/{uid}` document
✅ **Allow**: Users can access their own videos subcollection
❌ **Deny**: Users cannot read/write other users' data
❌ **Deny**: Unauthenticated users cannot access any data

## No Code Changes Required

Your application code is already production-ready. The security rules match exactly what the app expects:
- Creating user profiles on signup (src/contexts/AuthContext.tsx:99-118, 205-224)
- Updating theme/mode settings (src/components/ThemeProvider.tsx:71-77, 86-92)
- Reading user data (future Dashboard features)

## Testing After Rules Published

1. Sign up with email/password → Should create Firestore document
2. Sign in with Google → Should create Firestore document
3. Change theme → Should update Firestore document
4. Check Firestore Console → You should see `users` collection with your user document

## Advantages of Production Mode

✅ No 30-day expiration
✅ Secure by default
✅ Same rules work for 10 users or 10 million users
✅ No need to update rules later

Your choice was better for long-term stability!

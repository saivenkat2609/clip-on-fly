# User Data Storage Strategy

## Current Architecture

### What We're Storing Now
1. **User Authentication** - Firebase Auth (email, password, Google OAuth)
2. **Video Processing Results** - S3 JSON files (`users/{user_id}/{session_id}/result.json`)
3. **Processed Video Clips** - S3 bucket (`users/{user_id}/{session_id}/clips/`)

### Current Data Flow
```
User Signs In (Firebase)
  ↓
Processes Video (Lambda)
  ↓
Results Saved to S3 (JSON files per session)
  ↓
Dashboard Fetches from Lambda API
  ↓
Lambda Reads S3 JSON files
```

---

## What User Data Needs to Be Saved

### 1. **User Profile Data**
- Display name
- Email address (from Firebase)
- Profile picture URL
- Account creation date
- Email verification status
- Authentication provider (email/password or Google)

### 2. **Video Processing Metadata**
- Video session IDs
- YouTube URLs processed
- Processing status (pending/processing/completed/failed)
- Created timestamps
- Clips generated count
- Video titles/thumbnails

### 3. **User Preferences**
- Theme selection (indigo, ocean, sunset, etc.)
- UI mode (light/dark)
- Notification preferences
- Default clip settings (duration, aspect ratio)

### 4. **Usage Statistics**
- Total videos processed
- Total clips generated
- Storage used
- API calls made
- Last activity timestamp

---

## Free Storage Options Comparison

### Option 1: **Firebase Firestore** ⭐ RECOMMENDED

**Why Firestore:**
- Already using Firebase for authentication
- Real-time database with live updates
- Excellent SDK integration with React
- Automatic scaling
- Offline support built-in

**Free Tier:**
- ✅ 1 GiB storage
- ✅ 50,000 reads per day
- ✅ 20,000 writes per day
- ✅ 20,000 deletes per day
- ✅ 10 GiB network egress/month

**Estimated Usage (1000 users):**
- User profiles: ~1 MB
- Video metadata: ~100 MB (100 videos/user)
- Settings: ~1 MB
- **Total: ~102 MB** (well under 1 GB limit)

**Cost for 10,000 users:** Still FREE (within limits)

---

### Option 2: **AWS DynamoDB**

**Why DynamoDB:**
- Already using AWS for Lambda
- Serverless, fully managed
- Fast key-value lookups
- Integrates with Lambda

**Free Tier (Always Free):**
- ✅ 25 GB storage
- ✅ 25 read capacity units (200M requests/month)
- ✅ 25 write capacity units (200M requests/month)

**Pros:**
- Massive free tier
- In same AWS account as Lambda
- No egress charges within AWS

**Cons:**
- Requires separate SDK setup in React
- No real-time updates without extra work
- Slightly complex query patterns

---

### Option 3: **Supabase** (PostgreSQL)

**Why Supabase:**
- Open-source Firebase alternative
- Full PostgreSQL database
- Built-in authentication (could replace Firebase)
- Real-time subscriptions
- RESTful API auto-generated

**Free Tier:**
- ✅ 500 MB database
- ✅ Unlimited API requests
- ✅ 50 MB file storage
- ✅ 2 GB bandwidth

**Pros:**
- Powerful SQL queries
- Row-level security
- Built-in auth + storage
- Real-time updates

**Cons:**
- Would require migrating from Firebase Auth
- Smaller storage than others
- Another service to manage

---

### Option 4: **MongoDB Atlas**

**Free Tier (M0):**
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Shared vCPU

**Pros:**
- Flexible document model
- Good for JSON data
- Easy to scale

**Cons:**
- Limited storage on free tier
- Need MongoDB driver
- Slower than DynamoDB for simple queries

---

### Option 5: **Keep Current S3 Approach**

**Current Setup:**
- JSON files in S3
- Lambda reads/writes directly
- No additional service needed

**Pros:**
- ✅ Already implemented
- ✅ No extra cost
- ✅ Simple architecture
- ✅ Unlimited storage (S3)

**Cons:**
- ❌ No real-time updates
- ❌ Inefficient for queries (must list all files)
- ❌ Slow for large user bases
- ❌ No indexing or search

---

## Recommended Solution: Firebase Firestore

### Why Firestore is Best for This Project

1. **Already Integrated** - Using Firebase Auth, adding Firestore is trivial
2. **Real-Time Updates** - Dashboard auto-updates when videos complete
3. **Zero Setup** - Same SDK, same account, same console
4. **Scales Automatically** - No configuration needed
5. **Best Developer Experience** - Simple API, great docs

### Architecture with Firestore

```
┌─────────────────────────────────────────────────┐
│                 Frontend (React)                 │
│  - Firebase Auth (already using)                 │
│  - Firestore SDK (to add)                        │
└─────────────────────────────────────────────────┘
                        ↓
        ┌──────────────────────────────┐
        │     Firebase Firestore        │
        │  - users/{userId}/            │
        │    ├── profile                │
        │    ├── settings               │
        │    └── videos/{sessionId}     │
        └──────────────────────────────┘
                        ↑
        ┌──────────────────────────────┐
        │      AWS Lambda (Python)      │
        │  - Process videos             │
        │  - Update Firestore via API   │
        └──────────────────────────────┘
```

---

## Firestore Data Structure

### Collection: `users/{userId}`

**Document Fields:**
```javascript
{
  uid: "firebase-user-uid",
  email: "user@gmail.com",
  displayName: "John Doe",
  photoURL: "https://...",
  createdAt: Timestamp,
  lastLogin: Timestamp,
  emailVerified: boolean,
  provider: "google" | "password",

  // Stats
  totalVideos: 0,
  totalClips: 0,
  storageUsed: 0,

  // Preferences
  theme: "indigo",
  mode: "light",
  notifications: {
    processing: true,
    weekly: true,
    marketing: false
  }
}
```

### SubCollection: `users/{userId}/videos/{sessionId}`

```javascript
{
  sessionId: "uuid",
  youtubeUrl: "https://youtube.com/watch?v=...",
  projectName: "My Video Project",

  status: "processing" | "completed" | "failed",

  createdAt: Timestamp,
  completedAt: Timestamp,

  videoInfo: {
    title: "Video Title",
    duration: 600,
    thumbnail: "https://..."
  },

  clips: [
    {
      clipIndex: 0,
      downloadUrl: "https://s3.amazonaws.com/...",
      s3Key: "users/uid/session/clips/clip_0.mp4",
      duration: 30,
      startTime: 120,
      endTime: 150
    }
  ],

  error: null // or error message if failed
}
```

---

## Implementation Plan

### Phase 1: Add Firestore SDK (5 minutes)

```bash
# Already have firebase SDK, just enable Firestore
npm install firebase  # Already installed
```

**Update `src/lib/firebase.ts`:**
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';  // ADD THIS

// ... existing config ...

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);  // ADD THIS
```

### Phase 2: Create User Profile on Signup (10 minutes)

**Update `src/contexts/AuthContext.tsx`:**
```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function signUp(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Create user profile in Firestore
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    uid: userCredential.user.uid,
    email: email,
    displayName: userCredential.user.displayName,
    createdAt: new Date(),
    emailVerified: false,
    provider: 'password',
    totalVideos: 0,
    totalClips: 0,
    theme: 'indigo',
    mode: 'light'
  });
}
```

### Phase 3: Update Dashboard to Use Firestore (15 minutes)

**Replace API calls with Firestore queries:**

```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const fetchUserVideos = () => {
  const q = query(
    collection(db, `users/${currentUser.uid}/videos`),
    orderBy('createdAt', 'desc')
  );

  // Real-time updates!
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const videos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setVideos(videos);
  });

  return unsubscribe;
};
```

### Phase 4: Update Lambda to Write to Firestore (20 minutes)

**Option A: Use Firebase Admin SDK in Lambda**
```python
# In Lambda finalize function
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize (use service account key)
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Update video status
db.collection('users').document(user_id).collection('videos').document(session_id).set({
    'status': 'completed',
    'clips': clips_data,
    'completedAt': firestore.SERVER_TIMESTAMP
})
```

**Option B: Use Firestore REST API (simpler)**
```python
import requests

def update_firestore(user_id, session_id, data):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/users/{user_id}/videos/{session_id}"

    headers = {"Authorization": f"Bearer {token}"}
    requests.patch(url, json=data, headers=headers)
```

---

## Alternative: Hybrid Approach (S3 + Firestore)

**Best of Both Worlds:**

1. **Firestore** - Store metadata, status, user profiles
   - Fast queries
   - Real-time updates
   - User preferences

2. **S3** - Store actual video clips and large JSON files
   - Cheap storage
   - Direct download URLs
   - No database cost

**Data Flow:**
```
Lambda processes video
  ↓
Saves clips to S3 (current)
  ↓
Saves metadata to Firestore (new)
  ↓
Dashboard listens to Firestore (real-time)
  ↓
Downloads clips from S3 (current)
```

---

## Cost Estimate with Firestore

### 1,000 Active Users
- **Storage:** ~100 MB (FREE)
- **Reads:** ~10K/day (20% of free limit)
- **Writes:** ~2K/day (10% of free limit)
- **Cost:** $0/month

### 10,000 Active Users
- **Storage:** ~1 GB (at limit but still FREE)
- **Reads:** ~100K/day (need paid plan)
- **Writes:** ~20K/day (at limit)
- **Cost:** ~$10-20/month (still very cheap)

### 100,000 Users
- **Storage:** ~10 GB
- **Reads:** ~1M/day
- **Writes:** ~200K/day
- **Cost:** ~$100-150/month

---

## Implementation Timeline

- ✅ **Day 1 (30 min):** Add Firestore SDK and create user profiles on signup
- ✅ **Day 2 (1 hour):** Migrate Dashboard to read from Firestore with real-time updates
- ✅ **Day 3 (1 hour):** Update Lambda to write video status to Firestore
- ✅ **Day 4 (30 min):** Add settings sync to Firestore
- ✅ **Day 5 (30 min):** Add usage statistics tracking

**Total Time:** ~3.5 hours

---

## Security Rules for Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Videos subcollection
      match /videos/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Final Recommendation

**Use Firebase Firestore** because:

1. ✅ Already using Firebase (no new service)
2. ✅ Free for your use case (up to 10K users)
3. ✅ Real-time updates (videos appear instantly)
4. ✅ Simple SDK (2 lines of code to read/write)
5. ✅ Built-in security rules
6. ✅ Automatic backups
7. ✅ No server management
8. ✅ Scales automatically

**Keep S3 for:**
- Video file storage (clips)
- Large binary data
- Pre-signed download URLs

**Perfect Hybrid:**
- Metadata → Firestore (fast, queryable)
- Files → S3 (cheap, scalable)
- Auth → Firebase (current)
- Processing → Lambda (current)

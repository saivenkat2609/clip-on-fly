# YouTube "Malformed UTF-8" Error - REAL CAUSE FOUND

## ✅ The Actual Problem

The error was **NOT** from your video metadata (title, description, tags).

The error was from **decrypting the stored YouTube OAuth access token** in Firestore!

### Stack Trace Shows:
```
at decryptToken (/workspace/lib/index.js:66:18)
at /workspace/lib/index.js:267:27
```

This means the encrypted YouTube access token stored in your `user_social_connections` collection is either:
1. **Corrupted** during storage
2. **Encrypted with a different key** than the current `ENCRYPTION_KEY` secret
3. **Contains invalid UTF-8** in the encrypted data

## 🔧 How to Fix It

### Option 1: Reconnect Your YouTube Account (Recommended)

The corrupted connection will be **automatically deleted** when you try to upload. Then:

1. Go to **Settings** in your app
2. Click **"Connect YouTube"** again
3. Complete the OAuth flow
4. Try uploading again

This will create a fresh, properly encrypted token.

### Option 2: Admin Cleanup Tool (If Multiple Users Affected)

I've added an admin function to clean up ALL corrupted YouTube connections:

```typescript
// Call this from browser console (as admin user)
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const cleanUp = httpsCallable(functions, 'cleanCorruptedYouTubeConnections');
const result = await cleanUp();
console.log(result.data); // Shows how many were cleaned
```

This will:
- Check all YouTube connections in Firestore
- Try to decrypt each token
- Delete any that fail decryption
- Return stats: `{ corrupted: X, valid: Y, total: Z }`

### Option 3: Manual Firestore Cleanup

If you have access to Firestore console:

1. Go to Firestore → `user_social_connections` collection
2. Filter by `platform == 'youtube'`
3. Delete all YouTube connection documents
4. Have users reconnect their accounts

## 🛡️ What I Fixed

### 1. Better Error Handling in `decryptToken`

**Before:**
```typescript
function decryptToken(encryptedToken: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, key);
  return bytes.toString(CryptoJS.enc.Utf8);  // ❌ Fails silently
}
```

**After:**
```typescript
function decryptToken(encryptedToken: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted || decrypted.length === 0) {
      throw new Error('Decryption failed - token is empty or key is incorrect');
    }

    return decrypted;
  } catch (error: any) {
    console.error('Token decryption error:', {
      error: error.message,
      encryptedTokenLength: encryptedToken?.length,
      keyLength: key?.length,
    });
    throw new Error('Failed to decrypt token. Please reconnect your YouTube account.');
  }
}
```

### 2. Automatic Cleanup in `uploadToYouTube`

Now when decryption fails:
1. Logs the error clearly
2. **Deletes the corrupted connection**
3. Throws a user-friendly error message
4. Frontend shows "Go to Settings" button

```typescript
try {
  accessToken = decryptToken(connectionData.accessToken, encryptionKey.value());
} catch (decryptError: any) {
  console.error('Failed to decrypt YouTube access token:', decryptError.message);

  // Delete the corrupted connection
  await connectionDoc.ref.delete();

  throw new functions.https.HttpsError(
    'failed-precondition',
    'Your YouTube connection has expired or is corrupted. Please reconnect your YouTube account in Settings.'
  );
}
```

### 3. Better Frontend Error Messages

The frontend now:
- Detects token decryption errors
- Shows clear message: "Your YouTube connection has expired"
- Provides "Go to Settings" button
- Automatically marks connection as invalid

## 📝 Why This Happened

Possible causes:
1. **ENCRYPTION_KEY secret was changed** - Old tokens can't be decrypted with new key
2. **Firestore data corruption** - Rare but possible during writes
3. **CryptoJS version change** - Different encryption/decryption behavior
4. **Special characters in OAuth token** - Rare but YouTube might return tokens with special chars

## 🚀 Deploy the Fix

```bash
cd C:\Projects\reframeAI\reframe-ai\functions
npm run build
firebase deploy --only functions:uploadToYouTube,functions:cleanCorruptedYouTubeConnections
```

## ✅ Verify the Fix

After deployment:

1. **Try to upload** - You'll now see a clear error message
2. **Check the error** - Should say "Please reconnect your YouTube account"
3. **Reconnect YouTube** - Go to Settings → Connect YouTube
4. **Try upload again** - Should work now!

## 🔍 Debugging Tips

If it still fails:

### Check Firebase Logs:
```bash
firebase functions:log --only uploadToYouTube --limit 50
```

Look for:
```
Token decryption error: {
  error: "...",
  encryptedTokenLength: 128,
  keyLength: 32
}
```

### Check ENCRYPTION_KEY Secret:
```bash
firebase functions:secrets:access ENCRYPTION_KEY
```

Make sure it's the same key used to encrypt the tokens originally.

### Check Firestore Data:
In Firestore console, find a YouTube connection document:
```javascript
{
  accessToken: "U2FsdGVkX1...",  // Should be base64-like encrypted string
  refreshToken: "U2FsdGVkX1...",
  expiresAt: 1737294000000,
  // ...
}
```

If `accessToken` looks corrupted (weird characters, incomplete, etc.), delete it and reconnect.

## 🎯 Next Steps

1. **Deploy the updated functions** ✅
2. **Reconnect your YouTube account** ✅
3. **Test uploading** ✅
4. **If multiple users affected** → Run the cleanup function
5. **Monitor Firebase logs** for any decryption errors

The video metadata sanitization I added earlier is still useful as an extra safety layer, but the real issue was the token decryption!

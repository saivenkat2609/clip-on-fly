# Quick Start: Video Preview (3 Minutes)

## Step 1: Deploy Lambda (2 minutes)

1. Open: https://console.aws.amazon.com/lambda/
2. Click: **opus-finalize**
3. Copy code from: `C:\Projects\opus-clip-cloud\lambda-functions\5-lambda-finalize.py`
4. Paste → Click **Deploy**

## Step 2: Start Dev Server (30 seconds)

```bash
cd C:\Projects\reframe-ai
npm run dev
```

## Step 3: Test (30 seconds)

1. Go to: http://localhost:5173/dashboard
2. Find completed video
3. Click **"Preview"** button (blue)
4. Video plays in modal! 🎉

---

## Optional: Enable Public URLs (No Expiry)

### Quick Setup:

1. **AWS Lambda** → opus-finalize → Configuration → Environment variables
2. Add:
   ```
   R2_PUBLIC_DOMAIN = pub-xxxxx.r2.dev
   ```
   (Get this from Cloudflare R2 bucket settings)

3. Save → Done!

**Without this:** URLs expire after 7 days (still works fine)
**With this:** URLs never expire (better long-term)

---

## What You Get:

✅ Professional video player
✅ Preview + Download buttons
✅ Mobile responsive
✅ Free forever

**That's it!** 🚀

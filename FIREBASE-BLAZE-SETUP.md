# Firebase Blaze Plan Setup (Free Tier)

## Quick Setup Guide - 5 Minutes

### Why You Need This
Firebase Functions requires the **Blaze (Pay-as-you-go) plan**, but it includes a **generous free tier** that covers your usage.

**Your estimated cost**: **$0/month** (unless you exceed 2M function calls)

---

## Step-by-Step Setup

### 1. Open Firebase Console
- Go to: https://console.firebase.google.com/
- Select your project

### 2. Upgrade to Blaze Plan

1. Click on **"⚙️ Project Settings"** (bottom left)
2. Click on **"Usage and billing"** tab
3. You'll see: **"Spark plan (no-cost)"**
4. Click **"Modify plan"** button
5. Select **"Blaze plan"**
6. Click **"Continue"**

### 3. Add Billing Information

1. Click **"Set up Cloud billing"** or **"Link a billing account"**
2. If you don't have a billing account:
   - Click **"Create billing account"**
   - Enter your billing details (name, address)
   - **Add credit card** (required but won't be charged if under free tier)
3. Accept terms and conditions
4. Click **"Submit and enable billing"**

### 4. Set Up Budget Alert (Highly Recommended)

Protect yourself from unexpected charges:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"☰ Menu"** → **"Billing"** → **"Budgets & alerts"**
3. Click **"CREATE BUDGET"**
4. Fill in:
   - **Name**: "Firebase Monthly Budget"
   - **Budget amount**: $10
   - **Alert thresholds**: 50%, 90%, 100%
   - **Email recipients**: Your email
5. Click **"FINISH"**

### 5. Verify Upgrade

1. Go back to [Firebase Console](https://console.firebase.google.com/)
2. Click your project
3. Bottom left should now show: **"Blaze plan"** ✅

---

## ✅ You're Done!

You can now deploy Cloud Functions. The free tier includes:

- **2M function invocations/month** (you'll use ~500-1,000)
- **400k GB-seconds compute** (plenty for your needs)
- **5GB network egress**
- **2GB Cloud Firestore storage**

**Estimated monthly cost for 100-200 video uploads**: **$0.00**

---

## 📊 Monitor Your Usage

Check usage anytime:
1. Firebase Console → Your Project
2. Click **"Usage and billing"** in Project Settings
3. View **"Usage this month"**

---

## 🔐 Safety Tips

✅ **Budget alert is set** - You'll get email if approaching $10
✅ **Monitor monthly** - Check usage in Firebase Console
✅ **Free tier is generous** - Hard to exceed with normal usage
✅ **No surprises** - You control when functions are called

---

## Next Steps

Now continue with **YOUTUBE-AUTOPOST-NEXT-STEPS.md** at **Step 6** (Deploy Cloud Functions).

Good luck! 🚀

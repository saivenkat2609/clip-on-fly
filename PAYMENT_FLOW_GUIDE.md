# Payment Flow & Plan Update Guide

This document explains how user plan and credits are updated after a successful payment in NebulaAI.

---

## 📋 Table of Contents
1. [Payment Flow Overview](#payment-flow-overview)
2. [Data Update Points](#data-update-points)
3. [Where Plan/Credits are Displayed](#where-plancredits-are-displayed)
4. [How UI Stays in Sync](#how-ui-stays-in-sync)
5. [Troubleshooting](#troubleshooting)

---

## 🔄 Payment Flow Overview

```
┌─────────────┐
│   User      │
│   Clicks    │──────┐
│  "Upgrade"  │      │
└─────────────┘      │
                     ▼
            ┌────────────────┐
            │ Payment Modal  │
            │    Opens       │
            └────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Frontend Calls        │
         │ createSubscription()  │
         │ Cloud Function        │
         └───────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ Backend (Cloud Function)       │
    │ 1. Creates Razorpay Customer   │
    │ 2. Creates Subscription        │
    │ 3. Saves to Firestore          │
    │    (status: "created")         │
    └────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────┐
         │ Razorpay Checkout │
         │   Modal Opens     │
         └───────────────────┘
                     │
                     ▼
         ┌───────────────────┐
         │  User Enters      │
         │  Test Card Info   │
         │  & Pays           │
         └───────────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ Razorpay Processes Payment     │
    │ Returns: paymentId, signature  │
    └────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Frontend Calls        │
         │ verifyPayment()       │
         │ Cloud Function        │
         └───────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ Backend Verifies & Updates:    │
    │ ✓ Subscription status: active  │
    │ ✓ User plan: Starter/Pro       │
    │ ✓ User credits: 300/500        │
    │ ✓ Creates transaction record   │
    └────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ Razorpay Webhook (Optional)    │
    │ subscription.activated event   │
    │ Double-confirms everything     │
    └────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────┐
         │   UI Updates      │
         │   Automatically   │
         └───────────────────┘
```

---

## 📍 Data Update Points

### 1. **After Successful Payment Verification**

**File:** `functions/src/index.ts` → `verifyRazorpayPayment` function (lines 590-666)

**What Gets Updated:**

#### A. Subscription Document (Firestore)
```
Path: users/{userId}/subscriptions/{subscriptionId}

Updates:
  ✓ status: "active"
  ✓ startedAt: timestamp
  ✓ currentStart: timestamp
  ✓ currentEnd: timestamp
  ✓ nextBillingAt: timestamp
```

**Code Location:** `functions/src/index.ts:610-617`

#### B. User Profile (Firestore)
```
Path: users/{userId}

Updates:
  ✓ plan: "Starter" or "Professional"
  ✓ subscriptionStatus: "active"
  ✓ subscriptionId: "sub_xxxxx"
  ✓ totalCredits: 300 or 500
  ✓ creditsUsed: 0 (reset)
  ✓ creditsExpiryDate: timestamp
  ✓ planFeatures: { maxVideoLength, exportQuality, etc. }
```

**Code Location:** `functions/src/index.ts:620-629`

#### C. Transaction Record (Firestore)
```
Path: users/{userId}/transactions/{transactionId}

Creates New Document:
  ✓ razorpayPaymentId
  ✓ razorpaySubscriptionId
  ✓ planName
  ✓ billingPeriod
  ✓ amount
  ✓ currency: "INR"
  ✓ status: "captured"
  ✓ createdAt: timestamp
```

**Code Location:** `functions/src/index.ts:632-648`

---

### 2. **Via Razorpay Webhook (Backup Confirmation)**

**File:** `functions/src/index.ts` → `razorpayWebhook` function (lines 869-945)

**When Triggered:** Razorpay sends webhook after payment succeeds

**Events Handled:**
- `subscription.activated` - Initial activation
- `subscription.charged` - Monthly/yearly renewal
- `subscription.cancelled` - User cancels
- `payment.failed` - Payment failed

**What It Does:**
- Re-confirms all data is correctly updated
- Creates usage tracking document
- Updates credits on renewal

**Code Location:** `functions/src/index.ts:950-1012`

---

## 🖥️ Where Plan/Credits are Displayed

### 1. **Sidebar (Always Visible)**

**File:** `src/components/layout/AppSidebar.tsx`

**Shows:**
- Current plan badge
- Credits remaining progress bar

**Data Source:**
```typescript
const { plan, totalCredits, creditsUsed } = useUserPlan();
```

**Hook:** `src/hooks/useUserProfile.ts` → `useUserPlan()`

---

### 2. **Billing Page**

**File:** `src/pages/Billing.tsx`

**Shows:**
- Current plan with "Current Plan" badge
- Usage statistics (minutes used)
- Available credits progress bar
- Billing history table

**Data Sources:**
```typescript
const { plan, totalCredits } = useUserPlan();
const { data: activeSubscription } = useActiveSubscription();
const { data: transactions } = useTransactions();
```

**Hooks:**
- `src/hooks/useUserProfile.ts` → `useUserPlan()`
- `src/hooks/useSubscription.ts` → `useActiveSubscription()`
- `src/hooks/useTransactions.ts` → `useTransactions()`

---

### 3. **Upload Page**

**File:** `src/pages/Upload.tsx`

**Shows:**
- Credits available warning
- Plan-specific upload limits

**Data Source:**
```typescript
const { plan, totalCredits, creditsUsed } = useUserPlan();
```

---

### 4. **Dashboard**

**File:** `src/pages/Dashboard.tsx`

**Shows:**
- Quick stats card with plan info
- Credits remaining

**Data Source:**
```typescript
const { plan, totalCredits } = useUserPlan();
```

---

## 🔄 How UI Stays in Sync

### React Query Cache Invalidation

After payment succeeds, these queries are automatically invalidated and refetched:

**File:** `src/hooks/useSubscription.ts`

```typescript
// After verifyPayment succeeds (lines 149-164):
queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
queryClient.invalidateQueries({ queryKey: ['subscriptionHistory'] });
queryClient.invalidateQueries({ queryKey: ['userProfile'] });
queryClient.invalidateQueries({ queryKey: ['transactions'] });

// Also clears sessionStorage cache
sessionStorage.removeItem(`user_profile_${userId}`);
```

**What This Does:**
1. ✅ Forces React Query to refetch latest data from Firestore
2. ✅ All components using these hooks update automatically
3. ✅ User sees updated plan and credits immediately

---

## 🔍 Data Flow Diagram

```
Payment Success
    │
    ▼
┌───────────────────────────────┐
│  verifyPayment() Function     │
│  Updates Firestore:           │
│  • Subscription doc           │
│  • User profile               │
│  • Transaction record         │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│  React Query Invalidates:     │
│  • activeSubscription         │
│  • userProfile                │
│  • transactions               │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│  All Hooks Refetch Data:      │
│  • useUserPlan()              │
│  • useActiveSubscription()    │
│  • useTransactions()          │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│  UI Components Update:        │
│  • Sidebar (plan badge)       │
│  • Billing page (current)     │
│  • Upload page (credits)      │
│  • Dashboard (stats)          │
└───────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Issue 1: Plan Shows "Free" After Payment

**Possible Causes:**
1. Payment verification failed
2. Cloud function error
3. Firestore update failed

**How to Check:**

1. **Check Firestore Console:**
   ```
   Go to: users/{userId}
   Look for fields:
     - plan: should be "Starter" or "Professional"
     - totalCredits: should be 300 or 500
     - subscriptionStatus: should be "active"
   ```

2. **Check Cloud Functions Logs:**
   ```bash
   firebase functions:log --only verifyRazorpayPayment
   ```

3. **Check Razorpay Dashboard:**
   - Go to Subscriptions → Check if status is "Active"
   - Go to Payments → Check if payment is "Captured"

**Solution:**
- If Firestore not updated but Razorpay shows active:
  - Webhook will auto-fix within 5 minutes
  - Or manually trigger: Call `verifyPayment` again from browser console

---

### Issue 2: Credits Not Showing Correct Amount

**Expected Values:**
- Free: 60 minutes
- Starter: 300 minutes
- Professional: 500 minutes

**How to Check:**

1. **Check User Profile:**
   ```
   Firestore: users/{userId}
   Fields:
     - totalCredits: number
     - creditsUsed: number
   ```

2. **Check Active Subscription:**
   ```
   Firestore: users/{userId}/subscriptions/{subscriptionId}
   Fields:
     - totalCredits: should match plan
     - creditsRemaining: totalCredits - creditsUsed
   ```

**Solution:**
- If wrong, update Firestore manually or cancel + resubscribe

---

### Issue 3: UI Not Updating After Payment

**Possible Causes:**
1. React Query cache not invalidated
2. SessionStorage cache stuck
3. Browser not refetching

**Solution:**

1. **Hard Refresh:** Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Clear Cache Manually (Browser Console):**
   ```javascript
   // Clear sessionStorage
   sessionStorage.clear();

   // Force reload
   window.location.reload();
   ```

3. **Check Network Tab:**
   - Should see Firestore requests after payment
   - Should fetch `/users/{userId}` document

---

### Issue 4: Transaction Not Showing in Billing History

**How to Check:**
```
Firestore: users/{userId}/transactions
Should have document with:
  - razorpayPaymentId
  - amount
  - status: "captured"
  - createdAt
```

**Solution:**
- Webhook creates transaction automatically
- Wait 2-3 minutes for webhook to fire
- Check Razorpay Webhooks logs for errors

---

## 📊 Summary Table

| What | Where Updated | When | Who Updates It |
|------|--------------|------|----------------|
| **Subscription Status** | `users/{uid}/subscriptions/{id}` | After payment | `verifyPayment()` function |
| **User Plan** | `users/{uid}.plan` | After payment | `verifyPayment()` function |
| **Total Credits** | `users/{uid}.totalCredits` | After payment | `verifyPayment()` function |
| **Credits Used** | `users/{uid}.creditsUsed` | After payment (reset to 0) | `verifyPayment()` function |
| **Transaction Record** | `users/{uid}/transactions/{id}` | After payment | `verifyPayment()` function |
| **Usage Tracking** | `users/{uid}/usage/{monthYear}` | On webhook | `razorpayWebhook()` function |
| **UI Plan Badge** | Sidebar, Billing, Dashboard | Real-time | `useUserPlan()` hook |
| **UI Credits** | Sidebar, Upload, Billing | Real-time | `useUserPlan()` hook |

---

## 🎯 Key Files Reference

### Backend (Cloud Functions)
- `functions/src/index.ts` - Main payment logic
  - Line 456-562: `createRazorpaySubscription` - Creates subscription
  - Line 567-666: `verifyRazorpayPayment` - Updates plan & credits ⭐
  - Line 869-945: `razorpayWebhook` - Handles Razorpay events

- `functions/src/razorpay/planMapping.ts`
  - Line 43-47: `PLAN_CREDITS` - Defines credits per plan
  - Line 52-92: `PLAN_FEATURES` - Defines features per plan

### Frontend (React)
- `src/hooks/useUserProfile.ts` - User plan & credits data ⭐
- `src/hooks/useSubscription.ts` - Subscription management
- `src/hooks/useTransactions.ts` - Transaction history
- `src/components/PaymentModal.tsx` - Payment UI
- `src/pages/Billing.tsx` - Billing dashboard

---

## ✅ Testing Checklist

After making a test payment, verify:

- [ ] Razorpay shows payment as "Captured"
- [ ] Razorpay shows subscription as "Active"
- [ ] Firestore `users/{uid}.plan` = "Starter" or "Professional"
- [ ] Firestore `users/{uid}.totalCredits` = 300 or 500
- [ ] Firestore `users/{uid}.creditsUsed` = 0
- [ ] Firestore `users/{uid}/subscriptions/{id}.status` = "active"
- [ ] Firestore `users/{uid}/transactions/{id}` exists
- [ ] Sidebar shows correct plan badge
- [ ] Billing page shows "Current Plan" badge on correct plan
- [ ] Credits progress bar shows correct amount
- [ ] Upload page shows correct credit warnings
- [ ] Dashboard shows correct stats

---

**Last Updated:** January 2, 2026
**Version:** 1.0
**Project:** NebulaAI Payment Integration

# Payment Integration Test Cases

Complete test suite for NebulaAI payment integration. Run these tests after implementing payment gateway to ensure everything works correctly.

---

## 📋 Test Environment Setup

### Prerequisites
- [ ] Razorpay Test Mode enabled
- [ ] Test API keys configured in `.env`
- [ ] Firebase Functions deployed
- [ ] Frontend running locally or on staging
- [ ] Test card ready: `5267 3181 8797 5449` (Mastercard India)

---

## 🧪 Test Suite Overview

| Test ID | Category | Priority | Status |
|---------|----------|----------|--------|
| TC-001 | Starter Monthly Subscription | HIGH | ⬜ |
| TC-002 | Starter Yearly Subscription | HIGH | ⬜ |
| TC-003 | Professional Monthly Subscription | HIGH | ⬜ |
| TC-004 | Professional Yearly Subscription | HIGH | ⬜ |
| TC-005 | Payment Failure Handling | HIGH | ⬜ |
| TC-006 | Subscription Cancellation | HIGH | ⬜ |
| TC-007 | UI Updates Verification | CRITICAL | ⬜ |
| TC-008 | Firestore Data Verification | CRITICAL | ⬜ |
| TC-009 | Credits Deduction Test | HIGH | ⬜ |
| TC-010 | Usage Warning Test | MEDIUM | ⬜ |
| TC-011 | Billing History Display | MEDIUM | ⬜ |
| TC-012 | Plan Downgrade Flow | MEDIUM | ⬜ |
| TC-013 | Duplicate Payment Prevention | HIGH | ⬜ |
| TC-014 | Webhook Event Handling | HIGH | ⬜ |
| TC-015 | Session Timeout Recovery | MEDIUM | ⬜ |

---

## 🔍 Detailed Test Cases

---

## TC-001: Starter Monthly Subscription

**Objective:** Verify that user can successfully subscribe to Starter Monthly plan and all data updates correctly.

### Pre-conditions
- User logged in
- User currently on Free plan
- Test card available

### Test Steps

1. **Navigate to Billing Page**
   - [ ] Go to `/billing`
   - [ ] Verify page loads without errors
   - [ ] Verify "Free" plan shows "Current Plan" badge

2. **Select Starter Plan**
   - [ ] Click "Upgrade" button on Starter plan card
   - [ ] Verify billing period is set to "Monthly"
   - [ ] Verify price shows "₹2,400"

3. **Payment Modal Opens**
   - [ ] Verify PaymentModal component opens
   - [ ] Verify plan name: "Starter"
   - [ ] Verify billing period: "monthly"
   - [ ] Verify amount: 2400
   - [ ] Verify currency: "INR"

4. **Complete Payment**
   - [ ] Click "Pay with Razorpay"
   - [ ] Razorpay checkout opens
   - [ ] Enter card: `5267 3181 8797 5449`
   - [ ] Enter CVV: `123`
   - [ ] Enter expiry: `12/25`
   - [ ] Enter name: `Test User`
   - [ ] Click "Pay"

5. **Verify Success Message**
   - [ ] Toast notification appears: "Payment successful"
   - [ ] Modal closes automatically
   - [ ] Page refreshes or data updates

### Expected Results - UI Updates

**Billing Page:**
- [ ] Starter plan card shows "Current Plan" badge
- [ ] Free plan badge removed
- [ ] Price remains "₹2,400/month"

**Sidebar:**
- [ ] Plan badge shows "Starter"
- [ ] Credits shows "0 / 300 minutes"
- [ ] Progress bar at 0%

**Dashboard:**
- [ ] Stats card shows "Starter Plan"
- [ ] Credits remaining: 300

**Upload Page:**
- [ ] No "upgrade" warning shown
- [ ] Upload limit shows "Up to 30 minutes"

### Expected Results - Firestore

**Path: `users/{userId}`**
```json
{
  "plan": "Starter",
  "subscriptionStatus": "active",
  "subscriptionId": "sub_xxxxx",
  "totalCredits": 300,
  "creditsUsed": 0,
  "creditsExpiryDate": Timestamp(~30 days from now),
  "maxVideoLength": 1800,
  "exportQuality": "1080p",
  "hasWatermark": false,
  "hasAIViralityScore": true,
  "supportLevel": "email"
}
```

**Path: `users/{userId}/subscriptions/{subscriptionId}`**
```json
{
  "razorpaySubscriptionId": "sub_xxxxx",
  "razorpayPlanId": "plan_RybpDLG1KKnDCb",
  "razorpayCustomerId": "cust_xxxxx",
  "userId": "{userId}",
  "planName": "Starter",
  "billingPeriod": "monthly",
  "currency": "INR",
  "amount": 240000,
  "status": "active",
  "totalCredits": 300,
  "creditsUsed": 0,
  "creditsRemaining": 300,
  "startedAt": Timestamp,
  "currentStart": Timestamp,
  "currentEnd": Timestamp,
  "nextBillingAt": Timestamp,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

**Path: `users/{userId}/transactions/{transactionId}`**
```json
{
  "razorpayPaymentId": "pay_xxxxx",
  "razorpaySubscriptionId": "sub_xxxxx",
  "userId": "{userId}",
  "planName": "Starter",
  "billingPeriod": "monthly",
  "amount": 240000,
  "currency": "INR",
  "status": "captured",
  "method": "card",
  "createdAt": Timestamp,
  "description": "Starter Plan - monthly"
}
```

### Expected Results - Razorpay Dashboard

**Subscriptions Tab:**
- [ ] New subscription appears
- [ ] Status: "Active"
- [ ] Plan: Matches your Starter Monthly plan
- [ ] Amount: ₹2,400
- [ ] Next charge date: ~30 days from now

**Payments Tab:**
- [ ] Payment appears
- [ ] Status: "Captured"
- [ ] Amount: ₹2,400
- [ ] Method: Card
- [ ] Card: Mastercard ending in 5449

**Customers Tab:**
- [ ] Customer created/updated
- [ ] Email matches user email
- [ ] Active subscription listed

### Post-conditions
- User has active Starter subscription
- Credits: 300 minutes available
- Next billing: ~30 days

### Test Data
- **Plan:** Starter
- **Billing:** Monthly
- **Amount:** ₹2,400
- **Card:** 5267 3181 8797 5449

---

## TC-002: Starter Yearly Subscription

**Objective:** Verify yearly subscription with discount works correctly.

### Test Steps

1. **Navigate to Billing Page**
   - [ ] Go to `/billing`
   - [ ] Toggle billing period to "Yearly"
   - [ ] Verify "Save 20%" badge appears

2. **Verify Pricing**
   - [ ] Starter plan shows "₹23,200/year"
   - [ ] Savings calculation: 2,400 × 12 = 28,800
   - [ ] Discount: 28,800 - 23,200 = ₹5,600 saved
   - [ ] Percentage: (5,600 / 28,800) × 100 = 19.44% ≈ 20%

3. **Complete Payment**
   - [ ] Click "Upgrade" on Starter plan
   - [ ] Verify amount: ₹23,200
   - [ ] Verify billing period: "yearly"
   - [ ] Complete payment with test card

### Expected Results
- [ ] Plan: "Starter"
- [ ] Credits: 300 (same as monthly)
- [ ] Next billing: ~365 days from now
- [ ] Amount charged: ₹23,200
- [ ] Firestore `billingPeriod`: "yearly"

---

## TC-003: Professional Monthly Subscription

**Objective:** Verify Professional plan subscription with higher credits.

### Test Steps

1. **Navigate to Billing Page**
   - [ ] Set billing period to "Monthly"
   - [ ] Click "Upgrade" on Professional plan
   - [ ] Verify price: "₹6,560/month"

2. **Complete Payment**
   - [ ] Pay with test card
   - [ ] Wait for success confirmation

### Expected Results

**UI:**
- [ ] Plan badge: "Professional"
- [ ] Credits: "0 / 500 minutes"
- [ ] All premium features enabled

**Firestore:**
```json
{
  "plan": "Professional",
  "totalCredits": 500,
  "maxVideoLength": 10800,
  "exportQuality": "4K",
  "hasCustomBranding": true,
  "hasSocialScheduler": true,
  "hasAITitleGeneration": true,
  "supportLevel": "priority"
}
```

**Razorpay:**
- [ ] Amount: ₹6,560
- [ ] Status: Active

---

## TC-004: Professional Yearly Subscription

**Objective:** Verify highest tier yearly subscription.

### Test Steps

1. **Select Professional Yearly**
   - [ ] Toggle to "Yearly"
   - [ ] Verify price: "₹63,064/year"
   - [ ] Calculate savings: 6,560 × 12 = 78,720
   - [ ] Discount: 78,720 - 63,064 = ₹15,656 saved

2. **Complete Payment**
   - [ ] Subscribe and pay

### Expected Results
- [ ] Plan: "Professional"
- [ ] Credits: 500
- [ ] Billing: yearly
- [ ] Amount: ₹63,064
- [ ] Next charge: ~365 days

---

## TC-005: Payment Failure Handling

**Objective:** Verify system handles payment failures gracefully.

### Test Steps

1. **Navigate to Billing**
   - [ ] Click "Upgrade" on any plan

2. **Use Failure Test Card**
   - [ ] Card: `4000 0000 0000 0002` (Razorpay failure card)
   - [ ] CVV: `123`
   - [ ] Expiry: `12/25`
   - [ ] Click "Pay"

3. **Verify Failure Handling**
   - [ ] Payment fails
   - [ ] Razorpay shows error message
   - [ ] User returned to billing page

### Expected Results

**UI:**
- [ ] Error toast appears: "Payment failed"
- [ ] User remains on Free plan
- [ ] No plan change

**Firestore:**
- [ ] No subscription document created
- [ ] User plan: "Free"
- [ ] No transaction record

**Razorpay:**
- [ ] Payment status: "Failed"
- [ ] No subscription created

### Post-conditions
- User still on Free plan
- No charges applied
- Can retry payment

---

## TC-006: Subscription Cancellation

**Objective:** Verify user can cancel active subscription.

### Pre-conditions
- User has active Starter or Professional subscription

### Test Steps

1. **Navigate to Billing Page**
   - [ ] Scroll to "Current Plan" section
   - [ ] Verify "Cancel Subscription" button exists

2. **Click Cancel**
   - [ ] Click "Cancel Subscription"
   - [ ] Confirm cancellation dialog appears
   - [ ] Read warning message
   - [ ] Confirm cancellation

3. **Verify Cancellation**
   - [ ] Toast: "Subscription will be cancelled at end of billing period"
   - [ ] Button text changes to "Cancellation Scheduled"

### Expected Results

**Firestore:**
```json
{
  "subscriptionStatus": "active",
  "cancelledAt": Timestamp
}
```

**Subscription Document:**
```json
{
  "status": "active",
  "cancelledAt": Timestamp
}
```

**Razorpay:**
- [ ] Subscription status: "Active" (until end of period)
- [ ] Cancellation scheduled
- [ ] End date displayed

### Post-conditions
- User retains access until billing period ends
- No future charges
- Plan will revert to Free at period end

---

## TC-007: UI Updates Verification

**Objective:** Verify all UI components update after payment.

### Test Locations

#### 1. Sidebar (AppSidebar.tsx)
- [ ] Plan badge updates to "Starter" or "Professional"
- [ ] Badge color changes (not Free color)
- [ ] Credits section appears
- [ ] Progress bar shows 0/300 or 0/500
- [ ] Progress bar color: green/blue

#### 2. Billing Page (Billing.tsx)
- [ ] "Current Plan" badge on correct plan card
- [ ] Other plans show "Upgrade" button
- [ ] Current plan shows "Manage" or "Cancel" button
- [ ] Usage stats update:
  - Projects count: accurate
  - Clips generated: accurate
  - Minutes used: accurate
- [ ] Credits progress bar accurate
- [ ] Billing history table populated
- [ ] Latest transaction appears at top

#### 3. Dashboard (Dashboard.tsx)
- [ ] Stats card shows correct plan name
- [ ] Credits remaining shown
- [ ] Plan features mentioned in description

#### 4. Upload Page (Upload.tsx)
- [ ] Credit warnings appropriate for plan:
  - Free: Shows upgrade prompt
  - Starter: Shows if >250 minutes used
  - Professional: Shows if >400 minutes used
- [ ] Upload limits displayed correctly

#### 5. Settings Page (Settings.tsx)
- [ ] Plan information section shows current plan
- [ ] Subscription details visible
- [ ] Features list matches plan

### Verification Checklist
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] All components show updated data
- [ ] No "Free" badge anywhere
- [ ] No console errors
- [ ] No infinite loading states

---

## TC-008: Firestore Data Verification

**Objective:** Comprehensive database check after payment.

### Collections to Check

#### 1. `users/{userId}` Document
```javascript
// Expected Fields After Payment
{
  // User Info
  "email": "user@example.com",
  "displayName": "Test User",

  // Subscription Info
  "plan": "Starter" | "Professional",
  "subscriptionStatus": "active",
  "subscriptionId": "sub_xxxxx",
  "razorpayCustomerId": "cust_xxxxx",

  // Credits
  "totalCredits": 300 | 500,
  "creditsUsed": 0,
  "creditsExpiryDate": Timestamp(future),

  // Plan Features
  "maxVideoLength": 1800 | 10800,
  "exportQuality": "1080p" | "4K",
  "hasWatermark": false,
  "hasAIViralityScore": true,
  "hasCustomBranding": false | true,
  "hasSocialScheduler": false | true,
  "hasAITitleGeneration": false | true,
  "supportLevel": "email" | "priority",

  // Timestamps
  "createdAt": Timestamp,
  "updatedAt": Timestamp(recent)
}
```

**Verification:**
- [ ] All fields present
- [ ] No null values in critical fields
- [ ] Timestamps are valid and recent
- [ ] Plan matches what user selected
- [ ] Credits match plan allocation

#### 2. `users/{userId}/subscriptions/{subscriptionId}` Collection
```javascript
{
  "razorpaySubscriptionId": "sub_xxxxx",
  "razorpayPlanId": "plan_RybpDLG1KKnDCb",
  "razorpayCustomerId": "cust_xxxxx",
  "userId": "{userId}",
  "planName": "Starter" | "Professional",
  "billingPeriod": "monthly" | "yearly",
  "currency": "INR",
  "amount": 240000 | 656000 | 2320000 | 6306400,
  "status": "active",
  "totalCredits": 300 | 500,
  "creditsUsed": 0,
  "creditsRemaining": 300 | 500,
  "startedAt": Timestamp,
  "currentStart": Timestamp,
  "currentEnd": Timestamp(future),
  "nextBillingAt": Timestamp(future),
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

**Verification:**
- [ ] Document exists with subscription ID
- [ ] Status: "active"
- [ ] Amount in paise (multiply by 100)
- [ ] Dates are logical (end > start)
- [ ] Credits not negative

#### 3. `users/{userId}/transactions/{transactionId}` Collection
```javascript
{
  "razorpayPaymentId": "pay_xxxxx",
  "razorpaySubscriptionId": "sub_xxxxx",
  "userId": "{userId}",
  "planName": "Starter" | "Professional",
  "billingPeriod": "monthly" | "yearly",
  "amount": 240000 | 656000 | 2320000 | 6306400,
  "currency": "INR",
  "status": "captured",
  "method": "card",
  "cardLast4": "5449",
  "cardNetwork": "MasterCard",
  "createdAt": Timestamp,
  "description": "Starter Plan - monthly"
}
```

**Verification:**
- [ ] Transaction document created
- [ ] Status: "captured"
- [ ] Amount matches subscription
- [ ] Payment ID from Razorpay

#### 4. `users/{userId}/usage/{monthYear}` Collection

After webhook fires (wait 2-3 minutes):

```javascript
{
  "userId": "{userId}",
  "monthYear": "2026-01",
  "subscriptionId": "sub_xxxxx",
  "planName": "Starter" | "Professional",
  "totalCredits": 300 | 500,
  "videosProcessed": 0,
  "totalMinutesUsed": 0,
  "clipsGenerated": 0,
  "videos": [],
  "creditsRemaining": 300 | 500,
  "warningsSent": {
    "at75Percent": false,
    "at90Percent": false,
    "at100Percent": false
  },
  "periodStart": Timestamp,
  "periodEnd": Timestamp,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

**Verification:**
- [ ] Usage document created
- [ ] Month/year correct
- [ ] Initial values all 0
- [ ] Warnings all false

---

## TC-009: Credits Deduction Test

**Objective:** Verify credits are deducted when user processes a video.

### Pre-conditions
- User has active Starter (300 credits) or Professional (500 credits)
- User has uploaded a test video

### Test Steps

1. **Record Initial Credits**
   - [ ] Note initial `creditsUsed` value
   - [ ] Note initial `creditsRemaining` value

2. **Process a Video**
   - [ ] Upload a video (or use existing)
   - [ ] Wait for processing to complete
   - [ ] Note video duration in seconds

3. **Check Credits After Processing**
   - [ ] Go to Billing page
   - [ ] Check credits progress bar

### Expected Results

**Calculation:**
```
Video duration = 180 seconds = 3 minutes
creditsUsed = previous + 3
creditsRemaining = totalCredits - creditsUsed
```

**Firestore:**
```javascript
// users/{userId}
{
  "creditsUsed": 3,
  "totalCredits": 300
}

// users/{userId}/usage/2026-01
{
  "totalMinutesUsed": 3,
  "videosProcessed": 1,
  "creditsRemaining": 297,
  "videos": [
    {
      "videoId": "xxx",
      "sessionId": "yyy",
      "minutesUsed": 3,
      "processedAt": Timestamp
    }
  ]
}
```

**UI:**
- [ ] Progress bar updates
- [ ] Credits shown: "3 / 300 minutes"
- [ ] Percentage: 1%

### Test with Multiple Videos

**Process 3 videos:**
- Video 1: 5 minutes → creditsUsed: 5
- Video 2: 10 minutes → creditsUsed: 15
- Video 3: 8 minutes → creditsUsed: 23

**Verify:**
- [ ] Credits cumulative
- [ ] Progress bar accurate
- [ ] Usage document tracks all videos

---

## TC-010: Usage Warning Test

**Objective:** Verify warnings appear at 75%, 90%, and 100% usage.

### Test Steps

**For Starter Plan (300 credits):**

1. **75% Usage (225 minutes)**
   - [ ] Process videos until 225+ minutes used
   - [ ] Check for warning banner
   - [ ] Verify message: "You've used 75% of your credits"

2. **90% Usage (270 minutes)**
   - [ ] Process more videos until 270+ minutes
   - [ ] Check for warning banner
   - [ ] Verify message: "You've used 90% of your credits"

3. **100% Usage (300 minutes)**
   - [ ] Process videos until 300 minutes
   - [ ] Check for warning banner
   - [ ] Verify message: "You've reached your credit limit"
   - [ ] Try to upload another video
   - [ ] Verify: Upload blocked or upgrade prompt shown

### Expected Results

**At 75%:**
- [ ] Yellow/warning banner appears
- [ ] Suggestion to upgrade if needed
- [ ] Can still upload

**At 90%:**
- [ ] Orange/warning banner appears
- [ ] More urgent messaging
- [ ] Can still upload

**At 100%:**
- [ ] Red/critical banner appears
- [ ] Upload blocked OR
- [ ] Strong upgrade prompt
- [ ] "Upgrade Plan" button prominent

**Firestore:**
```javascript
// users/{userId}/usage/2026-01
{
  "warningsSent": {
    "at75Percent": true,
    "at90Percent": true,
    "at100Percent": true
  }
}
```

---

## TC-011: Billing History Display

**Objective:** Verify transaction history displays correctly.

### Test Steps

1. **Navigate to Billing Page**
   - [ ] Scroll to "Billing History" section
   - [ ] Verify table exists

2. **Check Table Columns**
   - [ ] Date column
   - [ ] Description column
   - [ ] Amount column
   - [ ] Status column

3. **Verify Latest Transaction**
   - [ ] Most recent transaction at top
   - [ ] Date: Today's date
   - [ ] Description: "Starter Plan - monthly"
   - [ ] Amount: "₹2,400" (or correct amount)
   - [ ] Status: "Success" or "Captured" (green badge)

4. **Make Multiple Payments**
   - [ ] Subscribe, cancel, resubscribe
   - [ ] Verify all transactions listed
   - [ ] Verify chronological order (newest first)

### Expected Results

**Table Content:**
```
Date           | Description                  | Amount   | Status
---------------|------------------------------|----------|----------
Jan 2, 2026    | Starter Plan - monthly       | ₹2,400   | ✓ Success
```

**Empty State:**
- [ ] If no transactions: "No billing history yet"
- [ ] Helpful message displayed

---

## TC-012: Plan Downgrade Flow

**Objective:** Verify user can cancel and revert to Free plan.

### Test Steps

1. **Start with Active Subscription**
   - User on Starter or Professional plan

2. **Cancel Subscription**
   - [ ] Click "Cancel Subscription"
   - [ ] Confirm cancellation

3. **Wait for Period End**
   - In test: Manually update Firestore `currentEnd` to past date
   - In production: Wait for actual billing cycle end

4. **Verify Downgrade to Free**
   - [ ] Plan badge: "Free"
   - [ ] Credits: 60 minutes
   - [ ] Features: Free tier features
   - [ ] Watermark: true
   - [ ] Export quality: 720p

### Expected Results

**After Period Ends:**

**Firestore:**
```javascript
{
  "plan": "Free",
  "subscriptionStatus": "cancelled",
  "totalCredits": 60,
  "creditsUsed": 0,
  "maxVideoLength": 900,
  "exportQuality": "720p",
  "hasWatermark": true
}
```

**UI:**
- [ ] All pages show "Free"
- [ ] Upgrade prompts appear
- [ ] Limited features

---

## TC-013: Duplicate Payment Prevention

**Objective:** Ensure user can't create duplicate subscriptions.

### Test Steps

1. **Subscribe to Starter Monthly**
   - [ ] Complete payment successfully
   - [ ] Verify subscription active

2. **Try to Subscribe Again**
   - [ ] Go to Billing page
   - [ ] Try to click "Upgrade" on Starter plan
   - [ ] Verify button disabled or shows "Current Plan"

3. **Try to Subscribe to Different Plan**
   - [ ] Try to click "Upgrade" on Professional
   - [ ] Verify: Should offer "Change Plan" not "Upgrade"

### Expected Results
- [ ] Cannot create duplicate subscriptions
- [ ] Current plan button disabled
- [ ] Proper messaging shown
- [ ] Only one active subscription in Firestore

---

## TC-014: Webhook Event Handling

**Objective:** Verify Razorpay webhooks update data correctly.

### Test Steps

1. **Complete Payment**
   - [ ] Subscribe to any plan
   - [ ] Payment succeeds

2. **Wait for Webhook**
   - [ ] Wait 2-3 minutes
   - [ ] Check Firebase Functions logs

3. **Check Webhook Events**
   - [ ] Go to Razorpay Dashboard → Webhooks → Logs
   - [ ] Verify event: `subscription.activated`
   - [ ] Verify HTTP 200 response

4. **Check Firestore Updates**
   - [ ] Usage document created
   - [ ] Subscription timestamps updated

### Expected Results

**Firebase Functions Logs:**
```
Razorpay webhook received: subscription.activated
Subscription activated successfully: sub_xxxxx
```

**Razorpay Webhook Logs:**
- [ ] Event delivered
- [ ] Status: 200 OK
- [ ] Response time: < 5 seconds

---

## TC-015: Session Timeout Recovery

**Objective:** Verify payment recovery if session expires.

### Test Steps

1. **Start Payment Process**
   - [ ] Click "Upgrade"
   - [ ] Payment modal opens

2. **Wait for Session Timeout**
   - [ ] Keep modal open for 10+ minutes
   - [ ] Don't complete payment

3. **Complete Payment After Timeout**
   - [ ] Try to pay
   - [ ] Check if authentication required
   - [ ] Re-authenticate if needed

4. **Verify Payment Completes**
   - [ ] Payment succeeds
   - [ ] Data updates correctly

### Expected Results
- [ ] Graceful handling of timeout
- [ ] User prompted to re-login if needed
- [ ] Payment completes after re-auth
- [ ] No data loss

---

## 🎯 Master Checklist

Use this comprehensive checklist after every payment gateway change:

### Before Testing
- [ ] Razorpay test mode enabled
- [ ] Test API keys in `.env`
- [ ] Functions deployed
- [ ] Frontend running
- [ ] Test cards ready

### Payment Flow
- [ ] Starter Monthly payment succeeds
- [ ] Starter Yearly payment succeeds
- [ ] Professional Monthly payment succeeds
- [ ] Professional Yearly payment succeeds
- [ ] Payment failure handled gracefully

### UI Updates
- [ ] Sidebar plan badge updates
- [ ] Sidebar credits display correct
- [ ] Billing page shows "Current Plan"
- [ ] Dashboard updates
- [ ] Upload page updates
- [ ] Settings page updates

### Firestore Checks
- [ ] `users/{uid}` document updated
- [ ] `users/{uid}/subscriptions/{id}` created
- [ ] `users/{uid}/transactions/{id}` created
- [ ] `users/{uid}/usage/{month}` created (after webhook)
- [ ] All required fields present
- [ ] No null values in critical fields

### Razorpay Dashboard
- [ ] Subscription appears as Active
- [ ] Payment captured
- [ ] Customer created/updated
- [ ] Amount correct
- [ ] Next billing date set

### Webhooks
- [ ] Webhook events received
- [ ] Status 200 returned
- [ ] Data updated via webhook
- [ ] No duplicate updates

### Credits System
- [ ] Initial credits correct (300/500)
- [ ] Credits deduct after video processing
- [ ] Progress bar accurate
- [ ] Warning banners at 75%/90%/100%

### Edge Cases
- [ ] Duplicate subscription prevented
- [ ] Cancellation works
- [ ] Downgrade to Free works
- [ ] Session timeout handled
- [ ] Browser refresh doesn't break state

### Performance
- [ ] Payment completes in < 10 seconds
- [ ] UI updates in < 3 seconds
- [ ] No console errors
- [ ] No memory leaks
- [ ] Page loads remain fast

---

## 🐛 Common Issues & Solutions

### Issue: Plan shows "Free" after payment

**Check:**
1. Razorpay Dashboard - Is subscription active?
2. Firestore `users/{uid}.plan` field
3. Firebase Functions logs for errors

**Solution:**
- Hard refresh: Ctrl+Shift+R
- Clear cache: DevTools → Application → Clear storage
- Check webhook fired: Razorpay → Webhooks → Logs

---

### Issue: Credits not updating

**Check:**
1. Firestore `users/{uid}.totalCredits`
2. Subscription document credits fields

**Solution:**
- Verify plan mapping has correct credits
- Check webhook created usage document
- Manually update if needed

---

### Issue: Transaction not in history

**Check:**
1. Firestore `users/{uid}/transactions` collection
2. React Query cache

**Solution:**
- Wait 2-3 minutes for webhook
- Hard refresh page
- Check Firebase Functions logs

---

## 📊 Test Results Template

Use this template to document test results:

```markdown
## Test Execution Report
**Date:** January 2, 2026
**Tester:** [Your Name]
**Environment:** Test/Staging

### Test Summary
| Category | Passed | Failed | Blocked | Total |
|----------|--------|--------|---------|-------|
| Payment Flow | 4 | 0 | 0 | 4 |
| UI Updates | 5 | 0 | 0 | 5 |
| Firestore | 4 | 0 | 0 | 4 |
| Webhooks | 1 | 0 | 0 | 1 |
| Edge Cases | 3 | 0 | 0 | 3 |
| **TOTAL** | **17** | **0** | **0** | **17** |

### Failed Tests
None

### Blocked Tests
None

### Notes
All tests passed successfully. Ready for production deployment.

### Screenshots
- [Payment Success Screenshot]
- [Billing Page Screenshot]
- [Firestore Data Screenshot]
```

---

## ✅ Sign-off Criteria

Mark as ready for production when:
- [ ] All HIGH priority tests pass
- [ ] All CRITICAL tests pass
- [ ] No console errors during payment flow
- [ ] Firestore data 100% accurate
- [ ] Razorpay integration working
- [ ] Webhooks delivering successfully
- [ ] Credits system working correctly
- [ ] UI updates immediately after payment
- [ ] No duplicate subscriptions possible
- [ ] Payment failures handled gracefully
- [ ] Cancellation flow works end-to-end

---

**Document Version:** 1.0
**Last Updated:** January 2, 2026
**Project:** NebulaAI Payment Testing
**Status:** Ready for Testing

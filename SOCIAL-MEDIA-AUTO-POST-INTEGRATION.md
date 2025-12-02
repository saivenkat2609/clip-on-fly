# Social Media Auto-Post Integration Guide

## Overview

Platforms like Opus Clip enable users to post videos directly to multiple social media platforms through **OAuth authentication** and **platform APIs**. This document explains how to implement these integrations, their costs, and restrictions.

## How It Works

### General Flow
1. **OAuth Authentication**: User authorizes your app to post on their behalf
2. **Token Storage**: Store access/refresh tokens securely for the user
3. **API Upload**: Use platform APIs to upload video content with metadata
4. **Handle Response**: Confirm successful post or handle errors

---

## Platform-by-Platform Breakdown

### 1. YouTube (Google)

**API**: YouTube Data API v3

**How to Integrate**:
- Register app in Google Cloud Console
- Enable YouTube Data API v3
- Implement OAuth 2.0 flow
- Use `videos.insert` endpoint to upload videos

**Cost**:
- **Free** up to 10,000 quota units/day
- Each video upload = ~1,600 units (6-7 videos/day)
- Additional quota requires billing account

**Restrictions**:
- Maximum file size: 256GB or 12 hours
- Must comply with YouTube Community Guidelines
- Requires email verification for uploads
- Quota limits on daily uploads
- OAuth scopes required: `youtube.upload`, `youtube.force-ssl`

**Documentation**: https://developers.google.com/youtube/v3/docs/videos/insert

---

### 2. TikTok

**API**: TikTok Content Posting API

**How to Integrate**:
- Register app in TikTok Developer Portal
- Submit for approval (requires business verification)
- Implement OAuth 2.0 flow
- Use Content Posting API endpoints

**Cost**:
- **Free** for approved apps
- No direct cost but requires business account approval

**Restrictions**:
- **Requires TikTok business account approval** (not automatic)
- Video must be 3 seconds to 10 minutes
- Maximum file size: 4GB
- Supported formats: MP4, MOV, MPEG, 3GP, AVI
- Must comply with Community Guidelines
- Rate limits apply (varies by approval tier)
- OAuth scopes: `video.upload`, `video.publish`

**Documentation**: https://developers.tiktok.com/doc/content-posting-api-get-started

---

### 3. Instagram

**API**: Instagram Graph API (Meta)

**How to Integrate**:
- Create app in Meta Developer Portal
- Go through App Review for Instagram permissions
- Implement Facebook/Instagram OAuth
- Use Instagram Graph API for media publishing

**Cost**:
- **Free** for approved apps
- No usage costs

**Restrictions**:
- **Requires App Review** for `instagram_content_publish` permission
- Must be Instagram Business or Creator account
- Video length: 3 seconds to 60 minutes (feed), 90 seconds (Reels)
- File size: up to 100MB (Reels), 4GB (feed)
- Aspect ratios restricted (9:16 for Reels)
- Rate limits: 25 posts per user per 24 hours
- Must comply with Instagram Community Guidelines
- Cannot pre-schedule Reels (only feed posts)

**Documentation**: https://developers.facebook.com/docs/instagram-api/guides/content-publishing

---

### 4. LinkedIn

**API**: LinkedIn Share API / Video API

**How to Integrate**:
- Create app in LinkedIn Developer Portal
- Request OAuth permissions
- Implement OAuth 2.0 flow
- Use Video API for video uploads (multi-part upload)

**Cost**:
- **Free** for standard access
- No direct costs

**Restrictions**:
- **Requires LinkedIn Partner Program** for video API access (application process)
- Maximum file size: 5GB
- Supported formats: MP4, WebM
- Video length: 3 seconds to 10 minutes (15 min for some accounts)
- Rate limits: varies by approval level
- Must be LinkedIn Page or personal profile
- OAuth scopes: `w_member_social`, `w_organization_social`
- Video processing can take several minutes

**Documentation**: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/video-api

---

### 5. Twitter/X

**API**: Twitter API v2

**How to Integrate**:
- Register app in Twitter Developer Portal
- Apply for appropriate access level
- Implement OAuth 2.0 or OAuth 1.0a
- Use Media Upload API + Create Tweet endpoint

**Cost**:
- **Free tier**: Very limited (read-only mostly)
- **Basic tier**: $100/month (1,667 posts/month)
- **Pro tier**: $5,000/month (higher limits)
- Video uploads require at least Basic tier

**Restrictions**:
- **Requires paid API access** for posting ($100/month minimum)
- Maximum video length: 2 minutes 20 seconds (Basic), longer for Premium
- Maximum file size: 512MB
- Supported formats: MP4, MOV
- Rate limits based on tier
- Must comply with Twitter Rules
- OAuth scopes: `tweet.read`, `tweet.write`, `users.read`

**Documentation**: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets

---

## Implementation Considerations

### Security Best Practices
- Store OAuth tokens encrypted in database
- Use refresh tokens to maintain access
- Implement token expiration handling
- Use environment variables for API keys/secrets
- Validate video content before upload

### User Experience
- Show clear authorization prompts
- Display upload progress indicators
- Handle errors gracefully with retry options
- Allow users to disconnect accounts
- Preview before posting

### Technical Challenges
- **Different file format requirements** per platform
- **Video transcoding** may be needed
- **Multi-part uploads** for large files
- **Async processing** for slow uploads
- **Webhook handling** for upload confirmation

### Cost Summary
| Platform | API Cost | Restrictions |
|----------|----------|--------------|
| YouTube | Free (quota limits) | 6-7 videos/day free |
| TikTok | Free | Requires business approval |
| Instagram | Free | Requires app review |
| LinkedIn | Free | Requires partner program |
| Twitter/X | $100/month minimum | Paid only |

---

## Recommended Implementation Steps

1. **Start with YouTube** - Easiest to get started, generous free tier
2. **Add Instagram** - Free but requires Meta app review (2-4 weeks)
3. **Add LinkedIn** - Requires partner application
4. **Add TikTok** - Requires business verification
5. **Consider Twitter/X** - Only if users willing to pay for API access

## Alternative Approaches

### Third-Party Services
Instead of direct integration, consider:
- **Zapier** - Provides pre-built integrations (paid)
- **Make (Integromat)** - Workflow automation (freemium)
- **Buffer/Hootsuite APIs** - Social media management APIs (paid)

These services handle OAuth and API complexities but add costs.

---

## For Your Reframe AI Project

**Recommended Priority**:
1. **YouTube** - Start here (easiest, free)
2. **Instagram Reels** - High engagement platform
3. **TikTok** - If you get business approval
4. **LinkedIn** - For professional content
5. **Twitter/X** - Last priority due to cost

**Note**: Most platforms have review processes that take 1-4 weeks for approval.

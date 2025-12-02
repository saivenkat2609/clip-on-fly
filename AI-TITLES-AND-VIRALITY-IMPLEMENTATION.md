# AI Titles and Virality Scores Implementation

## ✅ What Was Implemented

Added AI-generated titles and virality scores with breakdowns for each clip, displayed throughout the UI.

---

## Features

### 1. **Lambda: AI Title Generation**
- ✅ Generates catchy, social-media-optimized titles for each clip
- ✅ Uses Groq AI (llama-3.3-70b) for creative title generation
- ✅ 40-70 character titles optimized for social media
- ✅ Emotional triggers and curiosity gaps
- ✅ Fallback to simple title generation if AI unavailable

### 2. **Lambda: Virality Scoring**
- ✅ Overall virality score (0-100)
- ✅ Breakdown into 4 dimensions:
  - **Hook** (30% weight): Opening strength, attention-grabbing
  - **Flow** (25% weight): Pacing, rhythm, completeness
  - **Engagement** (25% weight): Viewer retention, comments
  - **Trend** (20% weight): Viral content patterns

### 3. **UI: Virality Display**
- ✅ Color-coded virality badge on each clip:
  - 🔥 Green (80+): High viral potential
  - 🔥 Yellow (60-79): Good viral potential
  - 🔥 Blue (<60): Moderate viral potential
- ✅ Score breakdown displayed under clip title:
  - Hook, Flow, Engagement, Trend scores
- ✅ Shows in grid layout on ProjectDetails page

### 4. **UI: Title Display**
- ✅ AI-generated title as clip heading
- ✅ Replaces generic "Clip 1", "Clip 2" labels
- ✅ Shown in card, modal, and preview
- ✅ Line-clamp for long titles

---

## Files Modified

### Backend (Lambda)

**`C:\Projects\opus-clip-cloud\lambda-functions\3-lambda-detect-AI-VIRALITY.py`**

Added:
- `generate_clip_title_ai()` - AI-powered title generation using Groq
- `generate_fallback_title()` - Simple title extraction from text
- Modified `lambda_handler()` to generate title for each clip
- Updated logging to show generated titles

Output structure now includes:
```python
{
    "clip_index": 0,
    "title": "The Secret Nobody Tells You About Success",  # NEW
    "virality_score": 87,
    "score_breakdown": {
        "hook": 85,
        "flow": 90,
        "engagement": 88,
        "trend": 85
    },
    # ... other clip data
}
```

### Frontend (React/TypeScript)

**`src/pages/ProjectDetails.tsx`**
- Updated `VideoClip` interface to include `title`, `virality_score`, `score_breakdown`
- Added virality badge on clip thumbnails
- Displays AI-generated title as heading
- Shows score breakdown grid (Hook, Flow, Engagement, Trend)
- Uses title in preview modal

**`src/pages/Dashboard.tsx`**
- Updated `VideoClip` interface to match ProjectDetails

---

## UI Changes

### Before:
```
┌─────────────────────┐
│   [Thumbnail]       │
│   Clip 1            │ ← Generic label
│   Duration          │
│   [Preview][Download]│
└─────────────────────┘
```

### After:
```
┌─────────────────────┐
│ 🔥 87  [Thumbnail]  │ ← Virality badge
│ Clip 1              │
│                     │
│ How To Master This  │ ← AI-generated title
│ Trick in 30 Seconds │
│                     │
│ Hook: 85  Flow: 90  │ ← Score breakdown
│ Engagement: 88      │
│ Trend: 85           │
│                     │
│ Duration: 0:32      │
│ [Preview][Download] │
└─────────────────────┘
```

---

## AI Title Generation

### How It Works:

1. **Lambda extracts clip text** (transcript segment)
2. **Sends to Groq AI** with prompt:
   - Clip content (first 300 chars)
   - Virality score context
   - Hook and engagement scores
3. **AI generates title** following guidelines:
   - 40-70 characters
   - Powerful opening words
   - Emotional triggers
   - Curiosity gaps
   - Title case formatting
4. **Fallback**: If AI fails, extract first meaningful sentence from transcript

### Title Examples:

Good AI-generated titles:
- "The Secret Nobody Tells You About Success"
- "How I Fixed This Problem in 30 Seconds"
- "Why Everyone is Wrong About This Topic"
- "3 Simple Tricks That Changed Everything"
- "First Time Playing Hockey - Epic Moment"

### Prompt Strategy:

```
Generate a catchy, attention-grabbing title for this social media clip.

Clip Text: "{text}"
Virality Score: {score}/100

Requirements:
- 40-70 characters (optimal for social media)
- Start with powerful words or numbers
- Use emotional triggers or curiosity gaps
- Make it click-worthy but NOT clickbait
- Use title case

Good examples:
- "The Secret Nobody Tells You About Success"
- "How I Fixed This Problem in 30 Seconds"
...
```

---

## Virality Score System

### Scoring Dimensions:

**1. Hook (30% weight)**
- Opening strength
- Attention-grabbing in first 3 seconds
- Questions, shocking statements, curiosity

**2. Flow (25% weight)**
- Pacing and rhythm
- Optimal duration (30-50s)
- Speaking rate (2.5-3.5 words/sec)
- Clear structure and completion

**3. Engagement (25% weight)**
- Viewer retention likelihood
- Direct address ("you")
- Questions and emotion
- Comment potential

**4. Trend (20% weight)**
- Viral content patterns
- "How to", numbered lists
- Before/after, secrets revealed
- Value delivery

### Color Coding:

```typescript
virality_score >= 80  → 🔥 Green  (High viral potential)
virality_score >= 60  → 🔥 Yellow (Good viral potential)
virality_score < 60   → 🔥 Blue   (Moderate potential)
```

---

## Deployment Steps

### 1. Deploy Updated Lambda

```bash
cd C:\Projects\opus-clip-cloud\lambda-functions

# Create deployment package
powershell Compress-Archive -Path "3-lambda-detect-AI-VIRALITY.py" -DestinationPath "3-lambda-detect.zip" -Force

# Upload to AWS Lambda (via console or CLI)
aws lambda update-function-code \
  --function-name 3-lambda-detect \
  --zip-file fileb://3-lambda-detect.zip
```

**Or via AWS Console:**
1. Go to AWS Lambda → 3-lambda-detect function
2. Click **Code** tab → **Upload from** → **.zip file**
3. Select `3-lambda-detect.zip`
4. Click **Save**

### 2. Verify Environment Variables

Make sure these are set in Lambda:
- `GROQ_API_KEY` - Your Groq API key
- `USE_AI_SCORING=true` - Enable AI features
- Other existing variables (BUCKET_NAME, etc.)

### 3. Test with New Video

1. Upload a new video from http://localhost:8081/upload
2. Wait for processing to complete
3. Check Lambda CloudWatch logs for:
   ```
   [Detect] Generating title with Groq AI...
   [Detect] Generated title: "Amazing Title Here"
   [Detect] Clip 0: "Amazing Title Here" - Score 87/100
   ```
4. Go to project details page
5. Verify:
   - ✅ Titles are displayed
   - ✅ Virality badges show on thumbnails
   - ✅ Score breakdown visible
   - ✅ Colors match virality scores

---

## Firestore Data Structure

Clips now stored with:
```typescript
{
  clipIndex: 0,
  downloadUrl: "https://...",
  s3Key: "session-id/clips/clip_0_9x16.mp4",
  duration: 32,
  startTime: 10.5,
  endTime: 42.5,
  title: "How To Master This Trick in 30 Seconds",  // NEW
  virality_score: 87,                                // NEW
  score_breakdown: {                                  // NEW
    hook: 85,
    flow: 90,
    engagement: 88,
    trend: 85
  }
}
```

---

## API Cost Considerations

### Groq API Calls Per Video:

- **1 call per clip** for title generation
- **1 call per clip** for virality scoring (already existing)

With default `NUM_CLIPS=3`:
- Total: 6 Groq API calls per video
- Model: llama-3.3-70b-versatile (fast & free tier available)

### Token Usage:

**Title Generation:**
- Input: ~200 tokens (prompt + clip text)
- Output: ~15 tokens (title)
- Total: ~215 tokens per clip

**Virality Scoring:**
- Input: ~300 tokens
- Output: ~30 tokens
- Total: ~330 tokens per clip

**Per Video (3 clips):**
- Title generation: 645 tokens
- Virality scoring: 990 tokens
- **Total: ~1,635 tokens per video**

**Groq Free Tier:**
- 30 requests/minute
- 6,000 tokens/minute
- Enough for ~3-4 videos per minute

---

## Fallback Behavior

### If Groq API Unavailable:

**Title Generation:**
- Extracts first meaningful sentence from transcript
- Title case formatting
- Limits to 60 characters
- Example: "First Time Playing Hockey..."

**Virality Scoring:**
- Uses heuristic-based scoring
- Keyword analysis
- Duration checks
- Pattern matching
- Still provides 0-100 scores

---

## Testing

### Test Scenario 1: AI Features Enabled

1. Upload YouTube video with clear segments
2. Wait for processing
3. Go to project details page
4. **Expected:**
   - Creative AI-generated titles
   - Accurate virality scores
   - Detailed breakdown visible
   - Color-coded badges

### Test Scenario 2: AI Features Disabled

1. Set `USE_AI_SCORING=false` in Lambda
2. Process a video
3. **Expected:**
   - Fallback titles (first sentence)
   - Heuristic virality scores
   - Still functional, just less creative

### Test Scenario 3: Groq API Error

1. Use invalid `GROQ_API_KEY`
2. Process a video
3. **Expected:**
   - Lambda logs: "Title generation API error"
   - Falls back to simple titles
   - Processing continues (doesn't fail)

---

## Benefits

### For Users:
✅ **Better clip organization** - Descriptive titles instead of "Clip 1"
✅ **Viral potential visibility** - Know which clips perform best
✅ **Data-driven decisions** - Score breakdown shows why clips are good
✅ **Professional appearance** - AI-generated titles look polished

### For Development:
✅ **Automatic titles** - No manual input needed
✅ **Consistent quality** - AI generates similar-quality titles
✅ **Scalable** - Works for any video content
✅ **Cost-effective** - Groq's free tier supports good volume

---

## Troubleshooting

### Titles not showing?

1. Check Lambda CloudWatch logs:
   ```
   [Detect] Generating title with Groq AI...
   [Detect] Generated title: "..."
   ```
2. Verify `GROQ_API_KEY` is set
3. Check Firestore has `title` field in clips
4. Hard refresh browser (Ctrl+Shift+R)

### Virality scores all the same?

1. Check if AI scoring is enabled
2. Verify Groq API key is valid
3. Check Lambda logs for AI errors
4. May be using fallback scoring (still functional)

### Scores not displaying in UI?

1. Check browser console for errors
2. Verify TypeScript interfaces updated
3. Check Firestore clip structure
4. Upload a new video (old clips may lack data)

---

## Future Enhancements

### Potential additions:

1. **Title editing** - Let users customize AI titles
2. **Multiple title options** - Generate 3 titles, user picks one
3. **Title templates** - Style preferences (professional, casual, clickbait)
4. **A/B testing** - Test different titles for same clip
5. **Title analytics** - Track which titles get more clicks
6. **Language support** - Generate titles in multiple languages
7. **Emoji integration** - Add relevant emojis to titles
8. **Hashtag suggestions** - Auto-generate relevant hashtags

---

## Summary

**What Changed:**
1. ✅ Added AI title generation to Lambda
2. ✅ Updated TypeScript interfaces
3. ✅ Display titles throughout UI
4. ✅ Show virality scores with color coding
5. ✅ Display score breakdowns (Hook, Flow, Engagement, Trend)

**User Experience:**
- 🎯 See catchy AI-generated title for each clip
- 🎯 Know viral potential at a glance (color badge)
- 🎯 Understand why clips score well (breakdown)
- 🎯 Make data-driven decisions about which clips to use

**Result:** Professional, data-rich clip management with AI-powered insights! 🎬✨🔥

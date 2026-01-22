# Smart Recommendation System

## Overview
Added an intelligent recommendation system to blog post pages that suggests relevant content based on user reading history and post relationships.

## Features Implemented

### 1. **Recommended Posts Widget** (`components/recommended-posts.tsx`)
- Displays personalized post recommendations in the sidebar
- Uses a smart scoring algorithm based on:
  - Same category (50 points)
  - Shared tags (20 points per tag)
  - User's reading history categories (30 points)
  - User's reading history tags (15 points per tag)
  - Recency boost (15 points for posts < 7 days, 5 points for < 30 days)
  - Penalty for already-read posts (-40 points)
  - Similar reading time preference (10 points)
- Shows up to 5 recommendations with visual indicators
- Displays cover images, reading time, and category badges
- Includes explanatory text (e.g., "based on your reading", "same category")

### 2. **Latest Posts Widget** (`components/latest-posts-widget.tsx`)
- Shows the most recent blog posts
- Numbered list format with gradient badges
- Displays reading time and category
- Excludes the current post being viewed

### 3. **Recommendations API** (`app/api/recommendations/route.ts`)
- Server-side recommendation engine
- Analyzes user reading history from Supabase
- Calculates similarity scores between posts
- Returns top 5 recommendations with reasoning

### 4. **Latest Posts API** (`app/api/posts/latest/route.ts`)
- Fetches latest published posts
- Supports exclusion of specific posts
- Configurable limit parameter

### 5. **Enhanced Reading History Tracking**
- Updated `components/reading-history-tracker.tsx` to store user identifier in both:
  - `localStorage` - for client-side persistence
  - Cookies - for server-side API access
- Enables the recommendation API to access reading history

## User Experience

### Sidebar Layout (Top to Bottom)
1. **Recommended for You** - Personalized recommendations
2. **Latest Posts** - Recent content
3. **Quick Links** - Content navigation
4. **Table of Contents** - Article structure
5. **Wired News** - Related news
6. **Gallery** - Images
7. **Weather** - Local weather
8. **Contact** - Contact info
9. **Article Stats** - Reading metrics

## How It Works

### Recommendation Algorithm
```
1. Fetch all posts from database
2. Get user's reading history (up to 50 posts)
3. Extract patterns:
   - Tags they've read
   - Categories they've read
   - Posts they've already seen
4. Score each candidate post:
   - Match against current post (tags, category)
   - Match against reading history
   - Apply recency boost
   - Penalize already-read content
5. Sort by score and return top 5
```

### User Identification
- Anonymous users get a unique identifier: `anon_[timestamp]_[random]`
- Stored persistently in localStorage and cookies
- No authentication required
- Privacy-friendly (no personal data collected)

## Benefits

1. **Increased Engagement** - Users discover more relevant content
2. **Personalized Experience** - Recommendations improve over time
3. **Reduced Bounce Rate** - Users stay on site longer
4. **Better Content Discovery** - Surface related and trending posts
5. **SEO Friendly** - Internal linking improves site structure

## Technical Details

### Performance
- All widgets use lazy loading (`ssr: false`)
- Loading skeletons prevent layout shift
- Client-side data fetching for dynamic updates
- Caches reading history for 30 seconds

### Responsive Design
- Desktop: Full sidebar with all widgets
- Mobile: Collapsible mobile widget bar (existing)
- Smooth animations and transitions

### Data Privacy
- No tracking of personal information
- Anonymous user identifiers only
- All data stored in user's own database
- GDPR compliant

## Future Enhancements

1. **Machine Learning** - Improve recommendations with collaborative filtering
2. **A/B Testing** - Test different recommendation strategies
3. **Analytics** - Track click-through rates on recommendations
4. **Social Signals** - Factor in post popularity
5. **Time-based Patterns** - Recommend based on reading time preferences
6. **Series Awareness** - Prioritize posts in same series
7. **Bookmark Integration** - Recommend bookmarked content

## Files Modified

- `app/blog/[slug]/page.tsx` - Added recommendation widgets to sidebar
- `components/reading-history-tracker.tsx` - Enhanced with cookie storage

## Files Created

- `components/recommended-posts.tsx` - Recommendation widget
- `components/latest-posts-widget.tsx` - Latest posts widget
- `app/api/recommendations/route.ts` - Recommendation API
- `app/api/posts/latest/route.ts` - Latest posts API

## Testing Recommendations

1. Visit multiple blog posts to build reading history
2. Check sidebar for personalized recommendations
3. Verify recommendations change based on reading patterns
4. Test with different categories and tags
5. Confirm latest posts update correctly

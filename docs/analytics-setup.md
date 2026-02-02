# Analytics Setup Guide

## Overview

The WiredLiving blog now includes a complete, real-time analytics system that tracks:

- **Page Views**: Total and unique page views
- **Visitor Analytics**: Unique visitors and returning visitors
- **Post Performance**: Views per post, engagement metrics
- **Device Analytics**: Desktop, mobile, tablet breakdown
- **Traffic Sources**: Referrers and traffic sources
- **Time-based Analytics**: Daily, weekly, and monthly trends

## Architecture

### Frontend Tracking
- **AnalyticsTracker Component**: Automatically tracks page views on every page
- **Client-side Storage**: Uses localStorage for visitor ID and sessionStorage for session ID
- **Privacy-First**: Generates anonymous IDs, no personal data collection

### Backend Storage
- **Supabase Database**: Stores all analytics data
- **Tables**:
  - `page_views` - Individual page view records
  - `unique_visitors` - Visitor tracking and profiles
  - `post_analytics` - Aggregated post statistics
  - `daily_analytics` - Daily aggregated statistics

### Admin Dashboard
- **Real-time Charts**: Using Chart.js for beautiful visualizations
- **Interactive UI**: Time range filters (7d, 30d, 90d)
- **Detailed Metrics**: Comprehensive analytics overview

## Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase dashboard:

```bash
# In Supabase Dashboard → SQL Editor
# Run the file: migrations/supabase-analytics-schema.sql
```

Or run it from the command line:
```bash
# Make sure you have Supabase CLI installed
supabase db push
```

### 2. Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Verify Installation

1. Navigate to `/admin` in your browser
2. Click on the "Analytics" tab
3. You should see:
   - Key metrics (Total Views, Unique Visitors, etc.)
   - Traffic overview chart
   - Device breakdown
   - Top performing posts
   - Referrer statistics

### 4. Testing Analytics Tracking

1. Visit any blog post
2. Open developer console (F12)
3. Check for analytics tracking request:
   - Should see POST to `/api/analytics/track`
   - Response should be `{success: true}`

## Features

### Real-time Tracking
- ✅ Every page view is tracked automatically
- ✅ Session management (resets on page reload)
- ✅ Visitor identification (persistent across sessions)
- ✅ Device and browser detection
- ✅ Referrer tracking

### Analytics Dashboard
- ✅ Beautiful charts with Chart.js
- ✅ Time range filters
- ✅ Device breakdown (Desktop/Mobile/Tablet)
- ✅ Top performing posts
- ✅ Traffic sources and referrers
- ✅ Daily trends

### Privacy Features
- ✅ No cookies required
- ✅ Anonymous visitor IDs
- ✅ No personal data collection
- ✅ IP addresses stored temporarily
- ✅ GDPR compliant

## API Endpoints

### Track Page View
```
POST /api/analytics/track
Body: {
  pagePath: string,
  pageTitle?: string,
  postSlug?: string,
  referrer?: string,
  sessionId: string,
  visitorId: string,
  screenWidth?: number,
  screenHeight?: number
}
```

### Get Analytics Data
```
GET /api/admin/analytics
Returns: {
  success: boolean,
  data: {
    postAnalytics: Array,
    dailyAnalytics: Array,
    totalViews: number,
    uniqueVisitors: number,
    topPosts: Array,
    deviceStats: Object,
    referrers: Array
  }
}
```

## Troubleshooting

### No analytics data showing
1. Check Supabase connection:
   ```bash
   # Test Supabase connection
   curl https://YOUR_SUPABASE_URL/rest/v1/page_views \
     -H "apikey: YOUR_ANON_KEY"
   ```

2. Verify tables exist:
   - Go to Supabase Dashboard → Table Editor
   - Check for: `page_views`, `unique_visitors`, `post_analytics`, `daily_analytics`

3. Check browser console for errors
4. Verify environment variables are set

### Charts not rendering
1. Ensure Chart.js is installed:
   ```bash
   npm install chart.js react-chartjs-2
   ```

2. Clear browser cache
3. Check for JavaScript errors in console

### Slow analytics loading
1. Add indexes to database (should already be in schema)
2. Consider data retention policies
3. Archive old data periodically

## Data Retention

By default, all analytics data is kept indefinitely. To implement data retention:

```sql
-- Delete page views older than 90 days
DELETE FROM page_views 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive before deleting (optional)
CREATE TABLE page_views_archive AS 
SELECT * FROM page_views 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Future Enhancements

Potential improvements:
- [ ] Real-time dashboard updates
- [ ] Export analytics data (CSV/PDF)
- [ ] Custom date range selection
- [ ] A/B testing capabilities
- [ ] Heatmap visualization
- [ ] User journey tracking
- [ ] Goal and conversion tracking
- [ ] Email analytics reports

## Support

For issues or questions:
1. Check the logs: `/logs/`
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set

---

**Note**: This analytics system is privacy-focused and doesn't use cookies. It generates anonymous IDs for tracking purposes only.

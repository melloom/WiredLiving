# Analytics Setup Guide

This guide will help you set up real-time analytics tracking for your blog.

## Step 1: Create Database Tables

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** → **New Query**
3. Copy and paste the contents of `supabase-analytics-schema.sql`
4. Click **Run** to create all analytics tables, indexes, functions, and triggers

## Step 2: Set Environment Variables

Make sure you have these environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SERVICE_ROLE_KEY=your_service_role_key
```

The service role key is needed for the analytics API to insert data.

## Step 3: Verify Setup

1. Visit any blog post page
2. Check your browser's Network tab - you should see a POST request to `/api/analytics/track`
3. In Supabase Dashboard, go to **Table Editor** and check:
   - `page_views` table should have new entries
   - `unique_visitors` table should have visitor records
   - `post_analytics` table should have aggregated stats

## Step 4: View Analytics in Admin Dashboard

1. Log into your admin dashboard
2. Go to the **Analytics** tab
3. You should now see real-time data including:
   - Total page views
   - Unique visitors
   - Top performing posts
   - Daily analytics charts
   - Device and browser breakdowns
   - Referrer statistics

## What Gets Tracked

- **Page Views**: Every time someone visits a blog post
- **Unique Visitors**: Based on localStorage visitor ID
- **Session Tracking**: Based on sessionStorage
- **Device Info**: Desktop, mobile, or tablet
- **Browser & OS**: Browser type and operating system
- **Referrer**: Where visitors came from
- **Screen Size**: Screen dimensions
- **Post Analytics**: Aggregated stats per post

## Privacy Considerations

- IP addresses are stored but can be anonymized
- No personal information is collected
- Visitor IDs are randomly generated
- All tracking is client-side and can be blocked by users

## Troubleshooting

### Analytics not tracking

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Check Supabase RLS policies allow inserts
4. Verify the analytics schema was created successfully

### No data showing in dashboard

1. Make sure you've visited some blog posts
2. Check that `post_analytics` table has data
3. Verify the admin dashboard is fetching from the correct tables

### Performance concerns

- Analytics tracking is fire-and-forget (doesn't block page load)
- Database triggers handle aggregation automatically
- Consider adding indexes if you have high traffic

## Next Steps

- Set up daily analytics aggregation (already handled by triggers)
- Add geographic tracking (requires IP geolocation service)
- Add time-on-page tracking (requires additional client-side code)
- Export analytics data for external analysis


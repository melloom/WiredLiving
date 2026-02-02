-- Analytics Schema for Supabase
-- Run this in your Supabase Dashboard → SQL Editor → New Query

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Create page_views table to track individual page views
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  session_id TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique_visitors table to track unique visitors
CREATE TABLE IF NOT EXISTS unique_visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT UNIQUE NOT NULL, -- Generated client-side ID
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_views INTEGER DEFAULT 1,
  country TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT
);

-- Create post_analytics table for aggregated post statistics
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT UNIQUE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0, -- in seconds
  bounce_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  last_viewed TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_analytics table for daily aggregated stats
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_posts_viewed INTEGER DEFAULT 0,
  avg_time_on_site INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Page views indexes
CREATE INDEX IF NOT EXISTS idx_page_views_post_slug ON page_views(post_slug);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);

-- Unique visitors indexes
CREATE INDEX IF NOT EXISTS idx_unique_visitors_visitor_id ON unique_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_unique_visitors_last_seen ON unique_visitors(last_seen DESC);

-- Post analytics indexes
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_slug ON post_analytics(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_analytics_total_views ON post_analytics(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_post_analytics_last_viewed ON post_analytics(last_viewed DESC);

-- Daily analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to get or create visitor ID
CREATE OR REPLACE FUNCTION get_or_create_visitor(visitor_id_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO unique_visitors (visitor_id, last_seen, total_views)
  VALUES (visitor_id_param, NOW(), 1)
  ON CONFLICT (visitor_id) 
  DO UPDATE SET 
    last_seen = NOW(),
    total_views = unique_visitors.total_views + 1;
  
  RETURN visitor_id_param;
END;
$$;

-- Function to update post analytics
CREATE OR REPLACE FUNCTION update_post_analytics(post_slug_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  view_count INTEGER;
  unique_count INTEGER;
BEGIN
  -- Count total views for this post
  SELECT COUNT(*) INTO view_count
  FROM page_views
  WHERE post_slug = post_slug_param;
  
  -- Count unique visitors for this post
  SELECT COUNT(DISTINCT session_id) INTO unique_count
  FROM page_views
  WHERE post_slug = post_slug_param;
  
  -- Insert or update post analytics
  INSERT INTO post_analytics (post_slug, total_views, unique_visitors, last_viewed)
  VALUES (post_slug_param, view_count, unique_count, NOW())
  ON CONFLICT (post_slug)
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    last_viewed = EXCLUDED.last_viewed,
    updated_at = NOW();
END;
$$;

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  view_count INTEGER;
  unique_count INTEGER;
  posts_count INTEGER;
BEGIN
  -- Count total views for today
  SELECT COUNT(*) INTO view_count
  FROM page_views
  WHERE DATE(created_at) = today;
  
  -- Count unique visitors for today
  SELECT COUNT(DISTINCT session_id) INTO unique_count
  FROM page_views
  WHERE DATE(created_at) = today;
  
  -- Count unique posts viewed today
  SELECT COUNT(DISTINCT post_slug) INTO posts_count
  FROM page_views
  WHERE DATE(created_at) = today AND post_slug IS NOT NULL;
  
  -- Insert or update daily analytics
  INSERT INTO daily_analytics (date, total_views, unique_visitors, total_posts_viewed)
  VALUES (today, view_count, unique_count, posts_count)
  ON CONFLICT (date)
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    total_posts_viewed = EXCLUDED.total_posts_viewed;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update post analytics when a new page view is added
CREATE OR REPLACE FUNCTION trigger_update_post_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.post_slug IS NOT NULL THEN
    PERFORM update_post_analytics(NEW.post_slug);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_post_analytics_trigger ON page_views;
CREATE TRIGGER update_post_analytics_trigger
AFTER INSERT ON page_views
FOR EACH ROW
WHEN (NEW.post_slug IS NOT NULL)
EXECUTE FUNCTION trigger_update_post_analytics();

-- Trigger to update daily analytics periodically (runs on insert)
CREATE OR REPLACE FUNCTION trigger_update_daily_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM update_daily_analytics();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_daily_analytics_trigger ON page_views;
CREATE TRIGGER update_daily_analytics_trigger
AFTER INSERT ON page_views
FOR EACH ROW
EXECUTE FUNCTION trigger_update_daily_analytics();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS for all analytics tables
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE unique_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- RLS for page_views - only admins can read, anyone can insert
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (session_id IS NOT NULL OR page_path IS NOT NULL);

DROP POLICY IF EXISTS "Admins can read page views" ON page_views;
CREATE POLICY "Admins can read page views"
  ON page_views FOR SELECT
  USING ((SELECT is_admin()));

-- RLS for unique_visitors - only admins can read
DROP POLICY IF EXISTS "Admins can read unique visitors" ON unique_visitors;
CREATE POLICY "Admins can read unique visitors"
  ON unique_visitors FOR SELECT
  USING ((SELECT is_admin()));

-- RLS for post_analytics - public can read (for public stats), admins can manage
DROP POLICY IF EXISTS "Public can read post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Admins can manage post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Anyone can read post analytics" ON post_analytics;
CREATE POLICY "Anyone can read post analytics"
  ON post_analytics FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage post analytics"
  ON post_analytics FOR ALL
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- RLS for daily_analytics - only admins can read
DROP POLICY IF EXISTS "Admins can read daily analytics" ON daily_analytics;
CREATE POLICY "Admins can read daily analytics"
  ON daily_analytics FOR SELECT
  USING ((SELECT is_admin()));

-- Success message
SELECT '✅ Analytics schema created successfully!' as message;
SELECT '📝 Next steps:' as info;
SELECT '   1. Create API endpoint /api/analytics/track' as step1;
SELECT '   2. Add tracking script to blog post pages' as step2;
SELECT '   3. Update admin dashboard to fetch real analytics' as step3;


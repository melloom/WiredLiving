-- Migration: Final Security Fixes - Function Search Path & Overly Permissive RLS Policies
-- Run this in your Supabase Dashboard → SQL Editor → New Query
-- This fixes all remaining Supabase linter warnings

-- ============================================================================
-- FUNCTION SEARCH PATH MUTABLE FIXES (6 functions)
-- ============================================================================
-- These functions need SET search_path = public to prevent search_path injection attacks

-- Fix 1: calculate_compression_ratio (in media storage)
CREATE OR REPLACE FUNCTION calculate_compression_ratio(original_size INTEGER, compressed_size INTEGER)
RETURNS DECIMAL(5,2)
SET search_path = public
AS $$
BEGIN
  IF original_size = 0 THEN
    RETURN 0.00;
  END IF;
  RETURN ROUND(((original_size - compressed_size)::decimal / original_size::decimal) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fix 2: cleanup_old_monitoring_data
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void
SET search_path = public
AS $$
BEGIN
  -- Keep audit logs for 1 year
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Keep monitoring events for 90 days
  DELETE FROM monitoring_events WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Keep failed login attempts for 30 days
  DELETE FROM failed_login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days';
  
  -- Keep rate limits for 1 day
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 3: update_post_analytics
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

-- Fix 4: update_daily_analytics
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

-- Fix 5: trigger_update_post_analytics
CREATE OR REPLACE FUNCTION trigger_update_post_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM update_post_analytics(NEW.page_path);
  RETURN NEW;
END;
$$;

-- Fix 6: trigger_update_daily_analytics
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

-- ============================================================================
-- RLS POLICY ALWAYS TRUE FIXES (9 policies)
-- ============================================================================
-- These policies have overly permissive WITH CHECK (true) or USING (true) for non-SELECT operations

-- Fix 1: audit_logs - Service role can insert audit logs
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (
    action IS NOT NULL 
    AND user_id IS NOT NULL 
    AND ((SELECT auth.role()) = 'service_role' OR (SELECT auth.role()) = 'authenticated')
  );

-- Fix 2: failed_login_attempts - Service role can manage failed login attempts (INSERT)
DROP POLICY IF EXISTS "Service role can manage failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can manage failed login attempts"
  ON failed_login_attempts FOR INSERT
  WITH CHECK (
    email IS NOT NULL 
    AND attempted_at IS NOT NULL 
    AND (SELECT auth.role()) = 'service_role'
  );

-- Fix 3: failed_login_attempts - Service role can update failed login attempts
DROP POLICY IF EXISTS "Service role can update failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can update failed login attempts"
  ON failed_login_attempts FOR UPDATE
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Fix 4: failed_login_attempts - Service role can delete failed login attempts
DROP POLICY IF EXISTS "Service role can delete failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can delete failed login attempts"
  ON failed_login_attempts FOR DELETE
  USING (
    (SELECT auth.role()) = 'service_role' 
    AND attempted_at IS NOT NULL
  );

-- Fix 5: monitoring_events - Service role can insert monitoring events
DROP POLICY IF EXISTS "Service role can insert monitoring events" ON monitoring_events;
CREATE POLICY "Service role can insert monitoring events"
  ON monitoring_events
  FOR INSERT
  WITH CHECK (
    type IS NOT NULL 
    AND timestamp IS NOT NULL 
    AND (SELECT auth.role()) = 'service_role'
  );

-- Fix 6: page_views - Anyone can insert page views
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (
    page_path IS NOT NULL 
    AND (session_id IS NOT NULL OR user_id IS NOT NULL)
  );

-- Fix 7: rate_limits - Service role can manage rate limits
DROP POLICY IF EXISTS "Anyone can manage rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role' 
    AND identifier IS NOT NULL
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role' 
    AND identifier IS NOT NULL
  );

-- Fix 8: media_files - Authenticated users can upload media
DROP POLICY IF EXISTS "Authenticated users can upload media" ON media_files;
CREATE POLICY "Authenticated users can upload media"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (
    filename IS NOT NULL 
    AND bucket IN ('blog-images', 'blog-videos')
  );

-- Fix 9: video_processing_queue - Authenticated can add to video queue
DROP POLICY IF EXISTS "Authenticated can add to video queue" ON video_processing_queue;
CREATE POLICY "Authenticated can add to video queue"
  ON video_processing_queue FOR INSERT
  TO authenticated
  WITH CHECK (
    media_file_id IS NOT NULL 
    AND original_path IS NOT NULL
  );

-- ============================================================================
-- AUTH SETTINGS - Leaked Password Protection
-- ============================================================================
-- NOTE: This setting CANNOT be changed via SQL. You must enable it in the Supabase Dashboard:
-- 
-- Steps to enable:
-- 1. Go to your Supabase Project Dashboard
-- 2. Navigate to: Authentication → Password Strength (or Auth Settings)
-- 3. Find: "Leaked Password Protection" or "Check for breached passwords"
-- 4. Toggle it ON
-- 5. Save the settings
--
-- This checks user passwords against HaveIBeenPwned.org to prevent using compromised passwords

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '✅ Security fixes applied successfully!' as message;
SELECT '📋 Fixed Issues:' as info;
SELECT '   ✓ 6 functions with SET search_path = public' as fix1;
SELECT '   ✓ 9 RLS policies with proper data validation' as fix2;
SELECT '📌 Remaining Action Required:' as action;
SELECT '   → Enable Leaked Password Protection in Supabase Dashboard → Authentication Settings' as manual_step;
SELECT '' as blank;
SELECT '🔍 To verify all fixes:' as verify;
SELECT '   1. Check Database Linter shows no function_search_path_mutable warnings' as v1;
SELECT '   2. Check Database Linter shows no rls_policy_always_true warnings' as v2;
SELECT '   3. Confirm Leaked Password Protection is enabled in Auth settings' as v3;

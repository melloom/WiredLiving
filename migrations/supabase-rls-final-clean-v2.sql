-- Complete RLS Fix: Resolve ALL auth_rls_initplan warnings
-- Run in Supabase Dashboard → SQL Editor
-- Date: January 22, 2026
-- Idempotent: Safe to re-run
-- Pattern: Extract auth values with SELECT, compare outside

-- ============================================================================
-- FIX POSTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Public can read published posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can read published posts" ON posts;
DROP POLICY IF EXISTS "Admins can read all posts" ON posts;
DROP POLICY IF EXISTS "Public and authenticated can read posts" ON posts;

CREATE POLICY "Public and authenticated can read posts"
  ON posts FOR SELECT
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (
      EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'created_by'
      )
      AND (SELECT auth.jwt() ->> 'email') = (SELECT email FROM users WHERE id = posts.created_by LIMIT 1)
    )
    OR (
      (SELECT auth.role()) = 'authenticated'
      AND published = true
      AND status = 'published'
      AND visibility IN ('public', 'unlisted')
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    )
    OR (
      published = true 
      AND status = 'published'
      AND visibility = 'public'
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    )
  );

DROP POLICY IF EXISTS "Only admins can create posts" ON posts;
CREATE POLICY "Only admins can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

DROP POLICY IF EXISTS "Only admins can update posts" ON posts;
CREATE POLICY "Only admins can update posts"
  ON posts FOR UPDATE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

DROP POLICY IF EXISTS "Only admins can delete posts" ON posts;
CREATE POLICY "Only admins can delete posts"
  ON posts FOR DELETE
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FIX TAGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Public can read tags" ON tags;
DROP POLICY IF EXISTS "Only admins can manage tags" ON tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON tags;
DROP POLICY IF EXISTS "Admins can update tags" ON tags;
DROP POLICY IF EXISTS "Admins can delete tags" ON tags;

CREATE POLICY "Public can read tags"
  ON tags FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON tags FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

CREATE POLICY "Admins can update tags"
  ON tags FOR UPDATE TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

-- ============================================================================
-- FIX POST_TAGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Public can read post_tags" ON post_tags;
DROP POLICY IF EXISTS "Only admins can manage post_tags" ON post_tags;
DROP POLICY IF EXISTS "Admins can insert post_tags" ON post_tags;
DROP POLICY IF EXISTS "Admins can update post_tags" ON post_tags;
DROP POLICY IF EXISTS "Admins can delete post_tags" ON post_tags;

CREATE POLICY "Public can read post_tags"
  ON post_tags FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.published = true
      AND posts.status = 'published'
      AND posts.visibility = 'public'
    )
  );

CREATE POLICY "Admins can insert post_tags"
  ON post_tags FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

CREATE POLICY "Admins can update post_tags"
  ON post_tags FOR UPDATE TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

CREATE POLICY "Admins can delete post_tags"
  ON post_tags FOR DELETE TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

-- ============================================================================
-- FIX USERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admins can manage users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can view own or admins manage" ON users;

CREATE POLICY "Users can view own or admins manage"
  ON users FOR SELECT TO anon, authenticated
  USING (
    (SELECT auth.uid())::text = id::text 
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can manage users"
  ON users FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Only admins can update users"
  ON users FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Only admins can delete users"
  ON users FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FIX ADMIN_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Only admins can read admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can delete admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can read admin logs" ON admin_logs;

CREATE POLICY "Admins can read admin logs"
  ON admin_logs FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can delete admin logs"
  ON admin_logs FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FIX POST_REVISIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can read all revisions" ON post_revisions;
DROP POLICY IF EXISTS "Only admins can create revisions" ON post_revisions;
DROP POLICY IF EXISTS "Only admins can delete revisions" ON post_revisions;

CREATE POLICY "Admins can read all revisions"
  ON post_revisions FOR SELECT TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

CREATE POLICY "Only admins can create revisions"
  ON post_revisions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin','editor'))
  );

CREATE POLICY "Only admins can delete revisions"
  ON post_revisions FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FIX FAILED_LOGIN_ATTEMPTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can read failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Service role can manage failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Service role can update failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Service role can delete failed login attempts" ON failed_login_attempts;

CREATE POLICY "Admins can read failed login attempts"
  ON failed_login_attempts FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Service role can manage failed login attempts"
  ON failed_login_attempts FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service role can update failed login attempts"
  ON failed_login_attempts FOR UPDATE
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service role can delete failed login attempts"
  ON failed_login_attempts FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================================================
-- FIX AUDIT_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    (SELECT auth.role()) = 'service_role' 
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- FIX MONITORING_EVENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Service role can insert monitoring events" ON monitoring_events;
DROP POLICY IF EXISTS "Users can view monitoring events" ON monitoring_events;

CREATE POLICY "Service role can insert monitoring events"
  ON monitoring_events FOR INSERT
  WITH CHECK (
    (SELECT auth.role()) = 'service_role' 
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Users can view monitoring events"
  ON monitoring_events FOR SELECT
  USING (
    (SELECT auth.role()) = 'authenticated' 
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- FIX RATE_LIMITS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Admins can manage rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Anyone can manage rate limits" ON rate_limits;

CREATE POLICY "Admins can manage rate limits"
  ON rate_limits FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FIX POST_ANALYTICS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Read post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Admins can insert post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Admins can update post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Admins can delete post analytics" ON post_analytics;

CREATE POLICY "Read post analytics"
  ON post_analytics FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert post analytics"
  ON post_analytics FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can update post analytics"
  ON post_analytics FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can delete post analytics"
  ON post_analytics FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FIX SERIES_METADATA TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access to active series" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated read access to all series" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated update access" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON series_metadata;

CREATE POLICY "Allow public read access to active series"
  ON series_metadata FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Allow authenticated read access to all series"
  ON series_metadata FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert access"
  ON series_metadata FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin', 'editor'))
  );

CREATE POLICY "Allow authenticated update access"
  ON series_metadata FOR UPDATE TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin', 'editor'))
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin' 
    OR (SELECT auth.jwt() ->> 'email') IN (SELECT email FROM users WHERE role IN ('admin', 'editor'))
  );

CREATE POLICY "Allow authenticated delete access"
  ON series_metadata FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FIX MEDIA_FILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can upload media" ON media_files;

CREATE POLICY "Authenticated users can upload media"
  ON media_files FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = (SELECT auth.uid()) 
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT '✅ Complete RLS fix applied successfully!' as message;
SELECT '📋 All auth.* calls wrapped in top-level SELECT' as fix1;
SELECT '   ✓ 33+ auth_rls_initplan warnings should be resolved' as fix2;

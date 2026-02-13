-- Migration: RLS initplan + permissive policy hotfixes
-- Run in Supabase Dashboard → SQL Editor
-- Idempotent: safe to re-run

-- =============================
-- POSTS (wrap auth.* with SELECT)
-- =============================
DROP POLICY IF EXISTS "Only admins can create posts" ON posts;
CREATE POLICY "Only admins can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')
    )
  );

DROP POLICY IF EXISTS "Only admins can update posts" ON posts;
CREATE POLICY "Only admins can update posts"
  ON posts FOR UPDATE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')
    )
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')
    )
  );

DROP POLICY IF EXISTS "Only admins can delete posts" ON posts;
CREATE POLICY "Only admins can delete posts"
  ON posts FOR DELETE
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

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

-- =============================
-- TAGS (wrap auth.*; split roles)
-- =============================
DROP POLICY IF EXISTS "Admins can manage tags" ON tags;
DROP POLICY IF EXISTS "Admins can update tags" ON tags;
DROP POLICY IF EXISTS "Admins can delete tags" ON tags;
DROP POLICY IF EXISTS "Public can read tags" ON tags;

CREATE POLICY "Public can read tags"
  ON tags FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON tags FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

CREATE POLICY "Admins can update tags"
  ON tags FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')))
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

-- =============================
-- POST_TAGS (wrap auth.*)
-- =============================
DROP POLICY IF EXISTS "Admins can insert post_tags" ON post_tags;
DROP POLICY IF EXISTS "Admins can update post_tags" ON post_tags;
DROP POLICY IF EXISTS "Admins can delete post_tags" ON post_tags;
DROP POLICY IF EXISTS "Public can read post_tags" ON post_tags;

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
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

CREATE POLICY "Admins can update post_tags"
  ON post_tags FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')))
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

CREATE POLICY "Admins can delete post_tags"
  ON post_tags FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

-- =============================
-- USERS (wrap auth.*)
-- =============================
DROP POLICY IF EXISTS "Users can view own or admins manage" ON users;
CREATE POLICY "Users can view own or admins manage"
  ON users FOR SELECT TO anon, authenticated
  USING ((SELECT auth.uid())::text = id::text OR (SELECT auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Only admins can manage users" ON users;
CREATE POLICY "Only admins can manage users"
  ON users FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Only admins can update users" ON users;
CREATE POLICY "Only admins can update users"
  ON users FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Only admins can delete users" ON users;
CREATE POLICY "Only admins can delete users"
  ON users FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- =============================
-- ADMIN_LOGS (wrap auth.*)
-- =============================
DROP POLICY IF EXISTS "Admins can read admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can delete admin logs" ON admin_logs;

CREATE POLICY "Admins can read admin logs"
  ON admin_logs FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can delete admin logs"
  ON admin_logs FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- =============================
-- POST_REVISIONS (wrap auth.*)
-- =============================
DROP POLICY IF EXISTS "Admins can read all revisions" ON post_revisions;
DROP POLICY IF EXISTS "Only admins can create revisions" ON post_revisions;
DROP POLICY IF EXISTS "Only admins can delete revisions" ON post_revisions;

CREATE POLICY "Admins can read all revisions"
  ON post_revisions FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

CREATE POLICY "Only admins can create revisions"
  ON post_revisions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor')));

CREATE POLICY "Only admins can delete revisions"
  ON post_revisions FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- =============================
-- FAILED_LOGIN_ATTEMPTS (wrap auth.*)
-- =============================
DROP POLICY IF EXISTS "Admins can read failed login attempts" ON failed_login_attempts;
CREATE POLICY "Admins can read failed login attempts"
  ON failed_login_attempts FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Service role can manage failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can manage failed login attempts"
  ON failed_login_attempts FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can update failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can update failed login attempts"
  ON failed_login_attempts FOR UPDATE
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can delete failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can delete failed login attempts"
  ON failed_login_attempts FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- =============================
-- AUDIT_LOGS & MONITORING_EVENTS (wrap auth.*)
-- =============================
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can insert monitoring events" ON monitoring_events;
CREATE POLICY "Service role can insert monitoring events"
  ON monitoring_events FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- =============================
-- RATE_LIMITS (wrap auth.*)
-- =============================
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- =============================
-- POST_ANALYTICS (wrap auth.*)
-- =============================
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

-- =============================
-- SERIES_METADATA: fix multiple permissive (scope roles)
-- =============================
DROP POLICY IF EXISTS "Allow public read access to active series" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated read access to all series" ON series_metadata;

CREATE POLICY "Allow public read access to active series"
  ON series_metadata FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Allow authenticated read access to all series"
  ON series_metadata FOR SELECT TO authenticated
  USING (true);

-- done
SELECT '✅ RLS initplan hotfixes applied' AS message;

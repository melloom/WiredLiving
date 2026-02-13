-- Migration: RLS performance fixes (auth_rls_initplan + multiple_permissive_policies)
-- Run in Supabase Dashboard → SQL Editor
-- Idempotent: safe to re-run

-- ============================================================================
-- POSTS: wrap auth.* calls with SELECT to avoid per-row re-evaluation
-- ============================================================================
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
    OR EXISTS (
      SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Only admins can update posts" ON posts;
CREATE POLICY "Only admins can update posts"
  ON posts FOR UPDATE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Only admins can delete posts" ON posts;
CREATE POLICY "Only admins can delete posts"
  ON posts FOR DELETE
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TAGS: split admin manage from SELECT to avoid multiple permissive
-- ============================================================================
DROP POLICY IF EXISTS "Public can read tags" ON tags;
DROP POLICY IF EXISTS "Only admins can manage tags" ON tags;
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

-- ============================================================================
-- POST_TAGS: split admin manage from SELECT; wrap auth.*
-- ============================================================================
DROP POLICY IF EXISTS "Public can read post_tags" ON post_tags;
DROP POLICY IF EXISTS "Only admins can manage post_tags" ON post_tags;
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

-- ============================================================================
-- USERS: split manage from SELECT and wrap auth.*
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own or admins manage" ON users;
CREATE POLICY "Users can view own or admins manage"
  ON users FOR SELECT TO anon, authenticated
  USING (
    (SELECT auth.uid())::text = id::text 
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Only admins can manage users" ON users;
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
-- ADMIN_LOGS: split SELECT from write; wrap auth.*
-- ============================================================================
DROP POLICY IF EXISTS "Only admins can read admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Only admins can delete admin logs" ON admin_logs;

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
-- POST_REVISIONS: wrap auth.* and keep admin-only
-- ============================================================================
DROP POLICY IF EXISTS "Admins can read all revisions" ON post_revisions;
DROP POLICY IF EXISTS "Only admins can create revisions" ON post_revisions;
DROP POLICY IF EXISTS "Only admins can delete revisions" ON post_revisions;

CREATE POLICY "Admins can read all revisions"
  ON post_revisions FOR SELECT TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor'))
  );

CREATE POLICY "Only admins can create revisions"
  ON post_revisions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin','editor'))
  );

CREATE POLICY "Only admins can delete revisions"
  ON post_revisions FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- FAILED_LOGIN_ATTEMPTS: ensure read policy wrapped
-- ============================================================================
DROP POLICY IF EXISTS "Admins can read failed login attempts" ON failed_login_attempts;
CREATE POLICY "Admins can read failed login attempts"
  ON failed_login_attempts FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- SERIES_METADATA: wrap auth.* in existing policies
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated insert access" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated update access" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON series_metadata;
DROP POLICY IF EXISTS "Allow authenticated read access to all series" ON series_metadata;
DROP POLICY IF EXISTS "Allow public read access to active series" ON series_metadata;

CREATE POLICY "Allow public read access to active series"
  ON series_metadata FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow authenticated read access to all series"
  ON series_metadata FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert access"
  ON series_metadata FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update access"
  ON series_metadata FOR UPDATE TO authenticated
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated delete access"
  ON series_metadata FOR DELETE TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================================
-- POST_ANALYTICS: consolidate permissive SELECT into one policy; separate admin writes
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can read post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Admins can manage post analytics" ON post_analytics;

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
-- DONE
-- ============================================================================
SELECT '✅ RLS performance fixes applied' AS message;

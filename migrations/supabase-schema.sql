-- Supabase Database Schema with Security
-- Run this in your Supabase Dashboard → SQL Editor → New Query
-- Then click "Run" to create all tables, indexes, and security policies

-- ============================================================================
-- TABLES
-- ============================================================================

-- Create users/admins table for authentication tracking
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  slug_override TEXT,
  slug_locked BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  is_premium BOOLEAN DEFAULT false,
  requires_login BOOLEAN DEFAULT false,
  reading_time INTEGER,
  word_count INTEGER,
  excerpt TEXT,
  cover_image TEXT,
  featured BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  og_image_override TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  gallery_images JSONB,
  category TEXT,
  series TEXT,
  series_order INTEGER,
  canonical_url TEXT,
  structured_data_type TEXT,
  related_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add related_links column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'related_links'
  ) THEN
    ALTER TABLE posts ADD COLUMN related_links JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add comment to describe related_links column
COMMENT ON COLUMN posts.related_links IS 'Array of related links/backlinks with structure: [{"title": "...", "url": "...", "description": "..."}]';

-- Add created_by column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE posts ADD COLUMN created_by UUID;
    -- Add foreign key constraint after users table is created
    -- This will be done later in the script
  END IF;
END $$;

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create_post', 'update_post', 'delete_post', 'login', 'logout', 'other')),
  target_type TEXT,
  target_id TEXT,
  ip TEXT,
  user_agent TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE admin_logs ADD COLUMN user_id UUID;
  END IF;
END $$;

-- Create sessions table for tracking active sessions (optional, for enhanced security)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN user_id UUID;
  END IF;
END $$;

-- Add foreign key constraints after users table exists
DO $$ 
BEGIN
  -- Add foreign key for posts.created_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'posts' 
    AND constraint_name = 'posts_created_by_fkey'
  ) THEN
    ALTER TABLE posts 
    ADD CONSTRAINT posts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for admin_logs.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_logs' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'admin_logs' 
    AND constraint_name = 'admin_logs_user_id_fkey'
  ) THEN
    ALTER TABLE admin_logs 
    ADD CONSTRAINT admin_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for user_sessions.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_sessions' 
    AND constraint_name = 'user_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE user_sessions 
    ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
-- Only create created_by index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_posts_created_by ON posts(created_by);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Post tags indexes
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Admin logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_email ON admin_logs(user_email);
-- Only create user_id index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_logs' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);

-- Sessions indexes
-- Only create user_id index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile or admins can view all
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can view own or admins manage" ON users;
CREATE POLICY "Users can view own or admins manage"
  ON users FOR SELECT
  USING (
    (SELECT auth.uid())::text = id::text 
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Only admins can manage users" ON users;
CREATE POLICY "Only admins can manage users"
  ON users FOR ALL
  USING ((SELECT auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- POSTS TABLE POLICIES
-- ============================================================================

-- Public and authenticated users can read published posts
DROP POLICY IF EXISTS "Public can read published posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can read published posts" ON posts;
DROP POLICY IF EXISTS "Admins can read all posts" ON posts;
DROP POLICY IF EXISTS "Public and authenticated can read posts" ON posts;
CREATE POLICY "Public and authenticated can read posts"
  ON posts FOR SELECT
  USING (
    -- Admins can read all posts (including drafts and private)
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (
      EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'created_by'
      )
      AND (SELECT auth.jwt() ->> 'email') = (SELECT email FROM users WHERE id = posts.created_by LIMIT 1)
    )
    -- Authenticated users can read published posts (including unlisted)
    OR (
      (SELECT auth.role()) = 'authenticated'
      AND published = true
      AND status = 'published'
      AND visibility IN ('public', 'unlisted')
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    )
    -- Public can read published, public posts
    OR (
      published = true 
      AND status = 'published'
      AND visibility = 'public'
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    )
  );

-- Only admins can insert posts
DROP POLICY IF EXISTS "Only admins can create posts" ON posts;
CREATE POLICY "Only admins can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  );

-- Only admins can update posts
DROP POLICY IF EXISTS "Only admins can update posts" ON posts;
CREATE POLICY "Only admins can update posts"
  ON posts FOR UPDATE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  );

-- Only admins can delete posts
DROP POLICY IF EXISTS "Only admins can delete posts" ON posts;
CREATE POLICY "Only admins can delete posts"
  ON posts FOR DELETE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- TAGS TABLE POLICIES
-- ============================================================================

-- Public can read tags, only admins can manage
DROP POLICY IF EXISTS "Public can read tags" ON tags;
DROP POLICY IF EXISTS "Only admins can manage tags" ON tags;
CREATE POLICY "Public can read tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage tags"
  ON tags FOR ALL
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  );

-- ============================================================================
-- POST_TAGS TABLE POLICIES
-- ============================================================================

-- Public and admin read/manage post_tags
DROP POLICY IF EXISTS "Public can read post_tags" ON post_tags;
DROP POLICY IF EXISTS "Only admins can manage post_tags" ON post_tags;
CREATE POLICY "Public can read post_tags"
  ON post_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.published = true
      AND posts.status = 'published'
      AND posts.visibility = 'public'
    )
  );

CREATE POLICY "Only admins can manage post_tags"
  ON post_tags FOR ALL
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  );

-- ============================================================================
-- ADMIN_LOGS TABLE POLICIES
-- ============================================================================

-- Only admins can read admin logs
DROP POLICY IF EXISTS "Only admins can read admin logs" ON admin_logs;
CREATE POLICY "Only admins can read admin logs"
  ON admin_logs FOR SELECT
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- System can insert admin logs (for audit trail)
-- Note: This is typically done via service role key, not RLS
-- But we allow authenticated admins to insert logs
DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR (SELECT auth.role()) = 'authenticated'
  );

-- Only admins can delete admin logs (for cleanup)
DROP POLICY IF EXISTS "Only admins can delete admin logs" ON admin_logs;
CREATE POLICY "Only admins can delete admin logs"
  ON admin_logs FOR DELETE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- USER_SESSIONS TABLE POLICIES
-- ============================================================================

-- Users can only see their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING ((SELECT auth.uid())::text = user_id::text);

-- System can insert sessions
DROP POLICY IF EXISTS "System can insert sessions" ON user_sessions;
CREATE POLICY "System can insert sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (session_token IS NOT NULL AND expires_at IS NOT NULL);

-- Users can delete their own sessions
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;
CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  USING ((SELECT auth.uid())::text = user_id::text);

-- ============================================================================
-- FUNCTIONS FOR SECURITY
-- ============================================================================

-- Function to check if user is admin (helper function)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' 
      AND role = 'admin'
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on posts
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL ADMIN USER (Optional - uncomment if you want to create admin via SQL)
-- ============================================================================

-- Uncomment and modify to create an initial admin user:
-- INSERT INTO users (email, name, role, is_active)
-- VALUES ('admin@example.com', 'Admin User', 'admin', true)
-- ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STORAGE BUCKET POLICIES (Run separately in Storage section)
-- ============================================================================

-- Note: Storage bucket policies are set via Supabase Dashboard → Storage → Policies
-- Recommended policies for 'blog-images' bucket:
-- 
-- 1. Public Read Policy:
--    - Policy Name: "Public can read images"
--    - Allowed Operation: SELECT
--    - Target Roles: anon, authenticated
--    - Policy: true (allow all)
--
-- 2. Admin Write Policy:
--    - Policy Name: "Admins can upload images"
--    - Allowed Operation: INSERT
--    - Target Roles: authenticated
--    - Policy: auth.jwt() ->> 'role' = 'admin'
--
-- 3. Admin Update Policy:
--    - Policy Name: "Admins can update images"
--    - Allowed Operation: UPDATE
--    - Target Roles: authenticated
--    - Policy: auth.jwt() ->> 'role' = 'admin'
--
-- 4. Admin Delete Policy:
--    - Policy Name: "Admins can delete images"
--    - Allowed Operation: DELETE
--    - Target Roles: authenticated
--    - Policy: auth.jwt() ->> 'role' = 'admin'

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Database schema with security created successfully!' as message;
SELECT '📝 Next steps:' as info;
SELECT '   1. Create storage bucket "blog-images" in Storage section' as step1;
SELECT '   2. Set up storage bucket policies (see comments above)' as step2;
SELECT '   3. Add admin users to the users table if needed' as step3;
SELECT '   4. Configure your app to use service_role key for admin operations' as step4;

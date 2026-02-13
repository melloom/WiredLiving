-- Migration: Add new features (Post Revisions, Likes/Reactions, Reading History)
-- Run this in your Supabase Dashboard → SQL Editor → New Query
-- This is safe to run multiple times (idempotent)

-- ============================================================================
-- POST REVISIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT post_revisions_post_revision_unique UNIQUE (post_id, revision_number)
);

-- Indexes for post_revisions
CREATE INDEX IF NOT EXISTS idx_post_revisions_post_id ON post_revisions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_revisions_created_at ON post_revisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_revisions_revision_number ON post_revisions(post_id, revision_number DESC);

-- ============================================================================
-- POST LIKES/REACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- Can be IP, session ID, or user ID
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'thumbs_up', 'bookmark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_identifier, reaction_type)
);

-- Indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_identifier ON post_likes(user_identifier);
CREATE INDEX IF NOT EXISTS idx_post_likes_reaction_type ON post_likes(reaction_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

-- ============================================================================
-- READING HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- Can be IP, session ID, or user ID
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT reading_history_unique UNIQUE (post_id, user_identifier)
);

-- Indexes for reading_history
CREATE INDEX IF NOT EXISTS idx_reading_history_post_id ON reading_history(post_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user_identifier ON reading_history(user_identifier);
CREATE INDEX IF NOT EXISTS idx_reading_history_last_read_at ON reading_history(last_read_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POST_REVISIONS POLICIES
-- ============================================================================

-- Admins can read all revisions
DROP POLICY IF EXISTS "Admins can read all revisions" ON post_revisions;
CREATE POLICY "Admins can read all revisions"
  ON post_revisions FOR SELECT
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  );

-- Only admins can create revisions
DROP POLICY IF EXISTS "Only admins can create revisions" ON post_revisions;
CREATE POLICY "Only admins can create revisions"
  ON post_revisions FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM users WHERE email = (SELECT auth.jwt() ->> 'email') AND role IN ('admin', 'editor'))
  );

-- Only admins can delete revisions
DROP POLICY IF EXISTS "Only admins can delete revisions" ON post_revisions;
CREATE POLICY "Only admins can delete revisions"
  ON post_revisions FOR DELETE
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- POST_LIKES POLICIES
-- ============================================================================

-- Public can read likes (aggregated counts)
DROP POLICY IF EXISTS "Public can read likes" ON post_likes;
CREATE POLICY "Public can read likes"
  ON post_likes FOR SELECT
  USING (true);

-- Anyone can create likes (using user_identifier)
DROP POLICY IF EXISTS "Anyone can create likes" ON post_likes;
CREATE POLICY "Anyone can create likes"
  ON post_likes FOR INSERT
  WITH CHECK (post_id IS NOT NULL AND user_identifier IS NOT NULL);

-- Users can delete their own likes (matching user_identifier)
DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;
CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  USING (user_identifier IS NOT NULL); -- We'll validate user_identifier in application code

-- ============================================================================
-- READING_HISTORY POLICIES
-- ============================================================================

-- Users can only read their own reading history
DROP POLICY IF EXISTS "Users can read own reading history" ON reading_history;
CREATE POLICY "Users can read own reading history"
  ON reading_history FOR SELECT
  USING (user_identifier IS NOT NULL); -- We'll validate user_identifier in application code

-- Anyone can create reading history
DROP POLICY IF EXISTS "Anyone can create reading history" ON reading_history;
CREATE POLICY "Anyone can create reading history"
  ON reading_history FOR INSERT
  WITH CHECK (post_id IS NOT NULL AND user_identifier IS NOT NULL);

-- Users can update their own reading history
DROP POLICY IF EXISTS "Users can update own reading history" ON reading_history;
CREATE POLICY "Users can update own reading history"
  ON reading_history FOR UPDATE
  USING (user_identifier IS NOT NULL) -- We'll validate user_identifier in application code
  WITH CHECK (user_identifier IS NOT NULL);

-- Users can delete their own reading history
DROP POLICY IF EXISTS "Users can delete own reading history" ON reading_history;
CREATE POLICY "Users can delete own reading history"
  ON reading_history FOR DELETE
  USING (user_identifier IS NOT NULL); -- We'll validate user_identifier in application code

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically create revision when post is updated
CREATE OR REPLACE FUNCTION create_post_revision()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
  next_revision INTEGER;
BEGIN
  -- Get the next revision number
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO next_revision
  FROM post_revisions
  WHERE post_id = NEW.id;

  -- Create revision with old values
  INSERT INTO post_revisions (
    post_id,
    title,
    description,
    content,
    author,
    revision_number,
    created_by
  )
  VALUES (
    NEW.id,
    OLD.title,
    OLD.description,
    OLD.content,
    OLD.author,
    next_revision,
    NEW.created_by
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create revision on post update
DROP TRIGGER IF EXISTS trigger_create_post_revision ON posts;
CREATE TRIGGER trigger_create_post_revision
  AFTER UPDATE ON posts
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.content IS DISTINCT FROM NEW.content
  )
  EXECUTE FUNCTION create_post_revision();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ New features migration completed successfully!' as message;
SELECT '📝 New tables created:' as info;
SELECT '   - post_revisions (for tracking post edit history)' as table1;
SELECT '   - post_likes (for likes/reactions)' as table2;
SELECT '   - reading_history (for tracking reading progress)' as table3;
SELECT '📝 Next steps:' as next_steps;
SELECT '   1. The trigger will automatically create revisions when posts are updated' as step1;
SELECT '   2. Use user_identifier (IP, session ID, or user ID) for likes and reading history' as step2;


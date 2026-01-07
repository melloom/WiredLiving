-- Combined Migration: Add all missing columns (created_by, user_id)
-- Run this to fix all missing column errors at once
-- This is safe to run multiple times (idempotent)

-- ============================================================================
-- FIX POSTS TABLE - Add created_by column
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE posts ADD COLUMN created_by UUID;
    RAISE NOTICE '✅ Added created_by column to posts table';
  ELSE
    RAISE NOTICE 'ℹ️  created_by column already exists in posts';
  END IF;
END $$;

-- ============================================================================
-- FIX ADMIN_LOGS TABLE - Add user_id column
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE admin_logs ADD COLUMN user_id UUID;
    RAISE NOTICE '✅ Added user_id column to admin_logs table';
  ELSE
    RAISE NOTICE 'ℹ️  user_id column already exists in admin_logs';
  END IF;
END $$;

-- ============================================================================
-- FIX USER_SESSIONS TABLE - Add user_id column (if table exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_sessions' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE user_sessions ADD COLUMN user_id UUID;
      RAISE NOTICE '✅ Added user_id column to user_sessions table';
    ELSE
      RAISE NOTICE 'ℹ️  user_id column already exists in user_sessions';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  user_sessions table does not exist (optional table)';
  END IF;
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS (after users table exists)
-- ============================================================================

DO $$ 
BEGIN
  -- Add foreign key for posts.created_by
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'created_by'
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'posts' 
      AND constraint_name = 'posts_created_by_fkey'
    ) THEN
    ALTER TABLE posts 
    ADD CONSTRAINT posts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added foreign key constraint for posts.created_by';
  END IF;

  -- Add foreign key for admin_logs.user_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_logs' AND column_name = 'user_id'
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'admin_logs' 
      AND constraint_name = 'admin_logs_user_id_fkey'
    ) THEN
    ALTER TABLE admin_logs 
    ADD CONSTRAINT admin_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added foreign key constraint for admin_logs.user_id';
  END IF;

  -- Add foreign key for user_sessions.user_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_sessions' AND column_name = 'user_id'
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'user_sessions' 
      AND constraint_name = 'user_sessions_user_id_fkey'
    ) THEN
    ALTER TABLE user_sessions 
    ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint for user_sessions.user_id';
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for posts.created_by
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'created_by'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'posts' AND indexname = 'idx_posts_created_by'
  ) THEN
    CREATE INDEX idx_posts_created_by ON posts(created_by);
    RAISE NOTICE '✅ Created index on posts.created_by';
  END IF;
END $$;

-- Index for admin_logs.user_id
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_logs' AND column_name = 'user_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'admin_logs' AND indexname = 'idx_admin_logs_user_id'
  ) THEN
    CREATE INDEX idx_admin_logs_user_id ON admin_logs(user_id);
    RAISE NOTICE '✅ Created index on admin_logs.user_id';
  END IF;
END $$;

-- Index for user_sessions.user_id
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_sessions' AND column_name = 'user_id'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'user_sessions' AND indexname = 'idx_user_sessions_user_id'
    ) THEN
    CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
    RAISE NOTICE '✅ Created index on user_sessions.user_id';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Migration completed! All missing columns have been added.' as message;
SELECT '📝 Columns added:' as info;
SELECT '   - posts.created_by' as col1;
SELECT '   - admin_logs.user_id' as col2;
SELECT '   - user_sessions.user_id (if table exists)' as col3;


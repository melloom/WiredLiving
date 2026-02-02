-- Migration: Add created_by column to posts table
-- Run this if you get an error about created_by column not existing
-- This is safe to run multiple times (idempotent)

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE posts ADD COLUMN created_by UUID;
    RAISE NOTICE 'Added created_by column to posts table';
  ELSE
    RAISE NOTICE 'created_by column already exists';
  END IF;
END $$;

-- Add foreign key constraint if users table exists and constraint doesn't exist
DO $$ 
BEGIN
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
    RAISE NOTICE 'Added foreign key constraint for created_by';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists or users table not found';
  END IF;
END $$;

-- Create index if column exists and index doesn't exist
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
    RAISE NOTICE 'Created index on created_by column';
  ELSE
    RAISE NOTICE 'Index already exists or column not found';
  END IF;
END $$;

SELECT '✅ Migration completed! created_by column added to posts table.' as message;


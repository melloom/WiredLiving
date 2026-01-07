-- Migration: Add user_id column to admin_logs table
-- Run this if you get an error about user_id column not existing
-- This is safe to run multiple times (idempotent)

-- Add user_id column to admin_logs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE admin_logs ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column to admin_logs table';
  ELSE
    RAISE NOTICE 'user_id column already exists in admin_logs';
  END IF;
END $$;

-- Add foreign key constraint if users table exists and constraint doesn't exist
DO $$ 
BEGIN
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
    RAISE NOTICE 'Added foreign key constraint for user_id in admin_logs';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists or users table not found';
  END IF;
END $$;

-- Create index if column exists and index doesn't exist
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
    RAISE NOTICE 'Created index on user_id column in admin_logs';
  ELSE
    RAISE NOTICE 'Index already exists or column not found';
  END IF;
END $$;

SELECT '✅ Migration completed! user_id column added to admin_logs table.' as message;


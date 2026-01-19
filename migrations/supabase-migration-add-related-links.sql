-- Migration: Add related_links column to posts table
-- This migration adds support for backlinks and internal links in blog posts
-- Run this in your Supabase Dashboard → SQL Editor → New Query

-- Add related_links column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'related_links'
  ) THEN
    ALTER TABLE posts ADD COLUMN related_links JSONB DEFAULT '[]'::jsonb;
    
    -- Add comment to describe the column
    COMMENT ON COLUMN posts.related_links IS 'Array of related links/backlinks with structure: [{"title": "...", "url": "...", "description": "..."}]';
    
    RAISE NOTICE 'Column related_links added successfully to posts table';
  ELSE
    RAISE NOTICE 'Column related_links already exists in posts table';
  END IF;
END $$;

-- Optional: Create an index on related_links for faster queries if needed
-- CREATE INDEX IF NOT EXISTS idx_posts_related_links ON posts USING gin(related_links);

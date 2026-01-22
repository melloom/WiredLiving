-- -- Migration: Add cover_image_crop field to posts table
-- This allows storing crop settings for featured posts on the home page
-- Date: 2026-01-14

-- Drop constraints if they exist
ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_cover_crop_rotation;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_cover_crop_zoom;

-- Drop index if it exists
DROP INDEX IF EXISTS idx_posts_cover_image_crop;

-- Drop column if it exists
ALTER TABLE posts DROP COLUMN IF EXISTS cover_image_crop;

-- Add cover_image_crop column to posts table
ALTER TABLE posts
ADD COLUMN cover_image_crop jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN posts.cover_image_crop IS 'Crop settings for cover image on home page featured cards. Format: {"x": number, "y": number, "width": number, "height": number, "zoom": number, "rotation": number, "aspectRatio": string, "objectPosition": "string"}';

-- Add validation constraint for rotation (-360 to 360)
ALTER TABLE posts
ADD CONSTRAINT check_cover_crop_rotation
CHECK (
    cover_image_crop IS NULL OR
    (cover_image_crop->>'rotation')::numeric BETWEEN -360 AND 360
);

-- Add validation constraint for zoom (0.1 to 5)
ALTER TABLE posts
ADD CONSTRAINT check_cover_crop_zoom
CHECK (
    cover_image_crop IS NULL OR
    (cover_image_crop->>'zoom')::numeric BETWEEN 0.1 AND 5
);

-- Create an index for faster queries on posts with crop settings
CREATE INDEX idx_posts_cover_image_crop ON posts USING GIN (cover_image_crop) WHERE cover_image_crop IS NOT NULL;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================
-- The RLS policies need to be refreshed after adding a new column
-- This ensures the new column is accessible through the existing policies

-- Refresh the public read policy
DROP POLICY IF EXISTS "Public can read published posts" ON posts;
CREATE POLICY "Public can read published posts"
  ON posts FOR SELECT
  USING (
    published = true 
    AND status = 'published'
    AND visibility = 'public'
    AND (scheduled_at IS NULL OR scheduled_at <= NOW())
  );

-- Refresh authenticated users policy
DROP POLICY IF EXISTS "Authenticated users can read published posts" ON posts;
CREATE POLICY "Authenticated users can read published posts"
  ON posts FOR SELECT
  USING (
    (SELECT auth.role()) = 'authenticated'
    AND published = true
    AND status = 'published'
    AND visibility IN ('public', 'unlisted')
    AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    AND (requires_login = false OR requires_login = true)
  );

-- Refresh admin read policy
DROP POLICY IF EXISTS "Admins can read all posts" ON posts;
CREATE POLICY "Admins can read all posts"
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
  );

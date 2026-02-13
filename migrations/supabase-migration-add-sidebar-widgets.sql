-- Add sidebar_widgets column to posts table
-- This column stores JSON configuration for sidebar widget visibility

-- Add the sidebar_widgets column
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS sidebar_widgets JSONB DEFAULT '{
  "showRelatedNews": true,
  "showGallery": true,
  "showWeather": true,
  "showContact": true,
  "showTableOfContents": true
}'::jsonb;

-- Update existing posts to have the default sidebar widgets configuration
UPDATE posts
SET sidebar_widgets = '{
  "showRelatedNews": true,
  "showGallery": true,
  "showWeather": true,
  "showContact": true,
  "showTableOfContents": true
}'::jsonb
WHERE sidebar_widgets IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN posts.sidebar_widgets IS 'JSON configuration for sidebar widget visibility on blog posts';

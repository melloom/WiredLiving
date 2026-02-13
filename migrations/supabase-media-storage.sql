-- Supabase Media Storage Setup (Videos, GIFs, Images)
-- Run this in your Supabase Dashboard → SQL Editor → New Query

-- ============================================================================
-- CREATE STORAGE BUCKETS
-- ============================================================================

-- Create blog-videos bucket for video files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-videos',
  'blog-videos',
  true, -- Public bucket for video access
  104857600, -- 100MB file size limit (compressed videos should be much smaller)
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

-- Create blog-images bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true, -- Public bucket for image access
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- ============================================================================
-- CREATE MEDIA METADATA TABLE
-- ============================================================================

-- Table to track uploaded media with compression info
CREATE TABLE IF NOT EXISTS media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  bucket TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  original_size INTEGER,
  compression_ratio DECIMAL(5,2),
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- for videos in seconds
  thumbnail_path TEXT,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  post_slug TEXT,
  is_compressed BOOLEAN DEFAULT false,
  compression_status TEXT DEFAULT 'pending' CHECK (compression_status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_media_files_bucket ON media_files(bucket);
CREATE INDEX IF NOT EXISTS idx_media_files_post_slug ON media_files(post_slug);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_mime_type ON media_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at DESC);

-- Add comment
COMMENT ON TABLE media_files IS 'Tracks all uploaded media files (images, videos, GIFs) with compression metadata';

-- ============================================================================
-- CREATE VIDEO PROCESSING QUEUE TABLE
-- ============================================================================

-- Queue for background video compression jobs
CREATE TABLE IF NOT EXISTS video_processing_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  quality_preset TEXT DEFAULT 'medium' CHECK (quality_preset IN ('high', 'medium', 'small', 'tiny')),
  original_path TEXT NOT NULL,
  output_path TEXT,
  error_message TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_queue_status ON video_processing_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_video_queue_media_file ON video_processing_queue(media_file_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_processing_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Media Files Policies
-- Public can read all media
DROP POLICY IF EXISTS "Public can read media files" ON media_files;
CREATE POLICY "Public can read media files"
  ON media_files FOR SELECT
  USING (true);

-- Authenticated users can insert media
DROP POLICY IF EXISTS "Authenticated users can upload media" ON media_files;
CREATE POLICY "Authenticated users can upload media"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (filename IS NOT NULL AND bucket IN ('blog-images', 'blog-videos'));

-- Users can update their own media
DROP POLICY IF EXISTS "Users can update own media" ON media_files;
CREATE POLICY "Users can update own media"
  ON media_files FOR UPDATE
  TO authenticated
  USING (uploaded_by = (SELECT auth.uid()));

-- Users can delete their own media
DROP POLICY IF EXISTS "Users can delete own media" ON media_files;
CREATE POLICY "Users can delete own media"
  ON media_files FOR DELETE
  TO authenticated
  USING (uploaded_by = (SELECT auth.uid()));

-- Video Processing Queue Policies
-- Authenticated users can read queue
DROP POLICY IF EXISTS "Authenticated can read video queue" ON video_processing_queue;
CREATE POLICY "Authenticated can read video queue"
  ON video_processing_queue FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert to queue
DROP POLICY IF EXISTS "Authenticated can add to video queue" ON video_processing_queue;
CREATE POLICY "Authenticated can add to video queue"
  ON video_processing_queue FOR INSERT
  TO authenticated
  WITH CHECK (media_file_id IS NOT NULL AND original_path IS NOT NULL);

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to media_files
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate compression ratio
CREATE OR REPLACE FUNCTION calculate_compression_ratio(original_size INTEGER, compressed_size INTEGER)
RETURNS DECIMAL(5,2)
SET search_path = public
AS $$
BEGIN
  IF original_size IS NULL OR original_size = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((1 - (compressed_size::DECIMAL / original_size::DECIMAL)) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check buckets
SELECT 
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_type_count,
  created_at
FROM storage.buckets 
WHERE id IN ('blog-images', 'blog-videos')
ORDER BY name;

-- Check tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('media_files', 'video_processing_queue')
ORDER BY table_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Media storage setup complete!' as message;
SELECT '' as separator;
SELECT '📦 Created Buckets:' as buckets;
SELECT '   - blog-videos (100MB limit, video formats)' as bucket1;
SELECT '   - blog-images (10MB limit, image + GIF formats)' as bucket2;
SELECT '' as separator2;
SELECT '📊 Created Tables:' as tables;
SELECT '   - media_files (tracks all uploads with metadata)' as table1;
SELECT '   - video_processing_queue (compression jobs)' as table2;
SELECT '' as separator3;
SELECT '🔒 Security:' as security;
SELECT '   - RLS enabled on all tables' as rls;
SELECT '   - Public read access for media' as public_read;
SELECT '   - Authenticated upload/edit/delete' as auth_write;
SELECT '' as separator4;
SELECT '⚡ Features:' as features;
SELECT '   - Auto compression tracking' as feature1;
SELECT '   - Compression ratio calculation' as feature2;
SELECT '   - Video processing queue' as feature3;
SELECT '   - Thumbnail support' as feature4;
SELECT '' as separator5;
SELECT '📝 Next Steps:' as next;
SELECT '   1. Set up storage policies in Dashboard' as step1;
SELECT '   2. Deploy video upload API endpoints' as step2;
SELECT '   3. Test upload from admin panel' as step3;
SELECT '   4. Verify automatic compression works' as step4;

-- ============================================================================
-- STORAGE POLICIES SETUP INSTRUCTIONS
-- ============================================================================
--
-- Go to: Dashboard → Storage → Policies
--
-- FOR blog-videos BUCKET:
-- 
-- Policy 1: Public Read
--   Name: Public can read videos
--   Allowed operation: SELECT
--   Target roles: public
--   Policy definition: bucket_id = 'blog-videos'
--
-- Policy 2: Authenticated Upload
--   Name: Authenticated can upload videos
--   Allowed operation: INSERT
--   Target roles: authenticated
--   Policy definition: bucket_id = 'blog-videos'
--
-- Policy 3: Authenticated Update
--   Name: Authenticated can update videos
--   Allowed operation: UPDATE
--   Target roles: authenticated
--   Policy definition: bucket_id = 'blog-videos'
--
-- Policy 4: Authenticated Delete
--   Name: Authenticated can delete videos
--   Allowed operation: DELETE
--   Target roles: authenticated
--   Policy definition: bucket_id = 'blog-videos'
--
-- REPEAT FOR blog-images BUCKET (same policies with bucket_id = 'blog-images')

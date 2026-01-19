-- Supabase Storage Bucket Setup
-- Run this in your Supabase Dashboard → SQL Editor → New Query
-- This script creates the storage bucket and sets up security policies

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================

-- Create the blog-images bucket if it doesn't exist
-- Note: Storage buckets cannot be created via SQL in older Supabase versions
-- This is for newer Supabase versions that support it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true, -- Public bucket for image access
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];



-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'blog-images';

-- Note: Storage policies can be viewed in Dashboard → Storage → blog-images → Policies
-- Or you can check them with this query after creating them via Dashboard:
--
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects'
--   AND policyname LIKE '%blog images%'
-- ORDER BY policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Storage bucket created successfully!' as message;
SELECT '📝 Bucket Info:' as info;
SELECT '   - Name: blog-images' as bucket_name;
SELECT '   - Public: Yes (images are publicly accessible)' as bucket_public;
SELECT '   - Size Limit: 5MB per file' as size_limit;
SELECT '   - Allowed Types: JPEG, PNG, GIF, WebP, SVG' as allowed_types;
SELECT '' as separator;
SELECT '⚠️  IMPORTANT - Next Steps:' as important;
SELECT '   You must now create storage policies via Dashboard!' as warning;
SELECT '' as separator2;
SELECT '🔧 Required Actions:' as next_steps;
SELECT '   1. Go to Dashboard → Storage → blog-images → Policies' as step1;
SELECT '   2. Click "New Policy" for each policy (see comments above)' as step2;
SELECT '   3. Create 4 policies: Public Read, Admin Upload, Update, Delete' as step3;
SELECT '   4. Test image upload from admin panel' as step4;
SELECT '   5. Verify image URLs are publicly accessible' as step5;
SELECT '' as separator3;
SELECT '📖 See policy definitions in comments above this query' as reference;

-- ============================================================================
-- QUICK POLICY SETUP GUIDE
-- ============================================================================
--
-- After running this script, go to: Dashboard → Storage → blog-images → Policies
--
-- CREATE THESE 4 POLICIES:
--
-- 📖 POLICY 1: Public Read (Everyone can view images)
--    Click "New Policy" → Choose "Custom"
--    Name: Public can read blog images
--    Policy Command: SELECT
--    Target roles: public
--    USING expression: bucket_id = 'blog-images'
--    → Click "Review" → "Save policy"
--
-- 🔒 POLICY 2: Admin Upload (Only admins/editors can upload)
--    Click "New Policy" → Choose "Custom"
--    Name: Admins can upload blog images
--    Policy Command: INSERT
--    Target roles: authenticated
--    WITH CHECK expression: 
--      bucket_id = 'blog-images' AND (
--        (auth.jwt() ->> 'role') = 'admin' OR
--        EXISTS (
--          SELECT 1 FROM public.users 
--          WHERE email = (auth.jwt() ->> 'email')
--          AND role IN ('admin', 'editor')
--          AND is_active = true
--        )
--      )
--    → Click "Review" → "Save policy"
--
-- ✏️ POLICY 3: Admin Update (Only admins/editors can update)
--    Click "New Policy" → Choose "Custom"
--    Name: Admins can update blog images
--    Policy Command: UPDATE
--    Target roles: authenticated
--    USING expression: (same as Policy 2 WITH CHECK)
--    WITH CHECK expression: (same as Policy 2 WITH CHECK)
--    → Click "Review" → "Save policy"
--
-- 🗑️ POLICY 4: Admin Delete (Only admins can delete)
--    Click "New Policy" → Choose "Custom"
--    Name: Admins can delete blog images
--    Policy Command: DELETE
--    Target roles: authenticated
--    USING expression:
--      bucket_id = 'blog-images' AND (
--        (auth.jwt() ->> 'role') = 'admin' OR
--        EXISTS (
--          SELECT 1 FROM public.users 
--          WHERE email = (auth.jwt() ->> 'email')
--          AND role = 'admin'
--          AND is_active = true
--        )
--      )
--    → Click "Review" → "Save policy"
--
-- ============================================================================
-- ALTERNATIVE: Manual Bucket Creation
-- ============================================================================
--
-- If the SQL bucket creation fails, create manually:
-- 1. Dashboard → Storage → "New bucket"
-- 2. Name: blog-images
-- 3. Public: ON
-- 4. File size limit: 5242880 (5MB)
-- 5. Allowed MIME types: image/jpeg,image/png,image/gif,image/webp,image/svg+xml
-- 6. Click "Create bucket"
-- 7. Then follow the policy creation steps above

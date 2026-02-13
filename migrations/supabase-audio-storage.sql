-- Create audio storage bucket for YouTube to MP3 conversions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true,
  10485760, -- 10MB limit (compressed audio)
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to handle re-running)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view audio" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own audio" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create policies for audio bucket
-- Allow authenticated users to upload audio
CREATE POLICY "Authenticated users can upload audio" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio' AND 
  auth.role() = 'authenticated'
);

-- Allow public access to view audio files
CREATE POLICY "Public can view audio" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio'
);

-- Allow users to update their own audio files
CREATE POLICY "Users can update own audio" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audio' AND 
  auth.role() = 'authenticated'
);

-- Allow users to delete their own audio files
CREATE POLICY "Users can delete own audio" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio' AND 
  auth.role() = 'authenticated'
);

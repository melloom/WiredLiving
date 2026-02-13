-- Add sidebar_music_player column to posts table
-- This stores JSON config for an optional music player in the post sidebar
-- Format: { "enabled": true, "src": "https://...", "title": "Song", "artist": "Artist" }

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS sidebar_music_player jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN posts.sidebar_music_player IS 'JSON config for sidebar music player. Only one music player per post (sidebar OR inline content).';

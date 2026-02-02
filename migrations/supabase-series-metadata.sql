-- Series Metadata Table
-- This table stores additional metadata for blog post series including cover images and descriptions

CREATE TABLE IF NOT EXISTS series_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  color_scheme TEXT DEFAULT 'blue-purple', -- For gradient colors
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_series_metadata_name ON series_metadata(name);
CREATE INDEX IF NOT EXISTS idx_series_metadata_slug ON series_metadata(slug);
CREATE INDEX IF NOT EXISTS idx_series_metadata_active ON series_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_series_metadata_featured ON series_metadata(is_featured);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_series_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER series_metadata_updated_at
  BEFORE UPDATE ON series_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_series_metadata_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE series_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for series_metadata
-- Allow anyone to read active series
CREATE POLICY "Allow public read access to active series"
  ON series_metadata FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to read all series
CREATE POLICY "Allow authenticated read access to all series"
  ON series_metadata FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update/delete series
CREATE POLICY "Allow authenticated insert access"
  ON series_metadata FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access"
  ON series_metadata FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete access"
  ON series_metadata FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions
GRANT SELECT ON series_metadata TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON series_metadata TO authenticated;

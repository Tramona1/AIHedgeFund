-- Create economic_reports table for storing economic report data
CREATE TABLE IF NOT EXISTS economic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subject TEXT,
  url TEXT,
  summary TEXT,
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  from_email TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source, subject)
);

-- Create interviews table for storing interview transcriptions and summaries
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,
  video_url TEXT NOT NULL,
  title TEXT,
  speaker TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  summary TEXT,
  highlights JSONB,
  transcript_url TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for reports if it doesn't exist
-- Note: This needs to be done through the Supabase dashboard
-- 1. Go to Storage > Create a new bucket named 'reports'
-- 2. Set bucket to public (for easier access) or private (more secure)
-- 3. Add the appropriate policies:
--    - For private: Create policy to allow authenticated users to read
--    - For public: Create policy to allow public read access

-- Create storage bucket for interviews if it doesn't exist
-- Note: This also needs to be done through the Supabase dashboard
-- 1. Go to Storage > Create a new bucket named 'interviews'
-- 2. Set appropriate access policies

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS economic_reports_source_idx ON economic_reports(source);
CREATE INDEX IF NOT EXISTS economic_reports_category_idx ON economic_reports(category);
CREATE INDEX IF NOT EXISTS economic_reports_timestamp_idx ON economic_reports(timestamp);

-- Create index for faster lookups on interviews table
CREATE INDEX IF NOT EXISTS interviews_speaker_idx ON interviews(speaker);
CREATE INDEX IF NOT EXISTS interviews_timestamp_idx ON interviews(timestamp); 
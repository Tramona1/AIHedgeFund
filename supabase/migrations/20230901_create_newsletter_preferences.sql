-- Create newsletter_preferences table
CREATE TABLE IF NOT EXISTS newsletter_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Interest areas
  stocks BOOLEAN NOT NULL DEFAULT TRUE,
  options BOOLEAN NOT NULL DEFAULT FALSE,
  crypto BOOLEAN NOT NULL DEFAULT FALSE,
  forex BOOLEAN NOT NULL DEFAULT FALSE,
  commodities BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Newsletter preferences
  weekly_market_summary BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_watchlist_updates BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_options_flow BOOLEAN NOT NULL DEFAULT FALSE,
  weekly_dark_pool_activity BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Delivery preferences
  frequency TEXT NOT NULL DEFAULT 'weekly',
  preferred_day TEXT NOT NULL DEFAULT 'sunday',
  last_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_newsletter_preferences_user_id ON newsletter_preferences(user_id);
CREATE INDEX idx_newsletter_preferences_email ON newsletter_preferences(email);

-- Add Row Level Security
ALTER TABLE newsletter_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to view their own preferences
CREATE POLICY "Users can view their own newsletter preferences"
  ON newsletter_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own preferences
CREATE POLICY "Users can insert their own newsletter preferences"
  ON newsletter_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own preferences
CREATE POLICY "Users can update their own newsletter preferences"
  ON newsletter_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_newsletter_preferences_updated_at
BEFORE UPDATE ON newsletter_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 
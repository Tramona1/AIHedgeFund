-- Create newsletter preferences table
CREATE TABLE IF NOT EXISTS newsletter_preferences (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Interest areas
  stocks BOOLEAN DEFAULT TRUE,
  options BOOLEAN DEFAULT FALSE,
  crypto BOOLEAN DEFAULT FALSE,
  forex BOOLEAN DEFAULT FALSE,
  commodities BOOLEAN DEFAULT FALSE,
  
  -- Newsletter preferences
  weekly_market_summary BOOLEAN DEFAULT TRUE,
  weekly_watchlist_updates BOOLEAN DEFAULT TRUE,
  weekly_options_flow BOOLEAN DEFAULT FALSE,
  weekly_dark_pool_activity BOOLEAN DEFAULT FALSE,
  
  -- Delivery preferences 
  frequency TEXT NOT NULL DEFAULT 'weekly',
  preferred_day TEXT NOT NULL DEFAULT 'sunday',
  last_delivery TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_preferences_user_id ON newsletter_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_preferences_email ON newsletter_preferences(email);

-- Enable row-level security
ALTER TABLE newsletter_preferences ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own newsletter preferences"
  ON newsletter_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own newsletter preferences"
  ON newsletter_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own newsletter preferences"
  ON newsletter_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_newsletter_preferences_updated_at
BEFORE UPDATE ON newsletter_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 
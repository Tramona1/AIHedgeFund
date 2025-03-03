-- Create options_flow table
CREATE TABLE IF NOT EXISTS options_flow (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  strike NUMERIC NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('call', 'put')),
  expiration TIMESTAMP NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  volume INTEGER NOT NULL,
  open_interest INTEGER NOT NULL,
  premium NUMERIC NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  volatility NUMERIC NOT NULL,
  underlying_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indices for options_flow
CREATE INDEX IF NOT EXISTS options_flow_ticker_idx ON options_flow (ticker);
CREATE INDEX IF NOT EXISTS options_flow_timestamp_idx ON options_flow (timestamp);
CREATE INDEX IF NOT EXISTS options_flow_sentiment_idx ON options_flow (sentiment);
CREATE INDEX IF NOT EXISTS options_flow_expiration_idx ON options_flow (expiration);

-- Create dark_pool_data table
CREATE TABLE IF NOT EXISTS dark_pool_data (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  volume INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  blocks_count INTEGER NOT NULL,
  percent_of_volume NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indices for dark_pool_data
CREATE INDEX IF NOT EXISTS dark_pool_ticker_idx ON dark_pool_data (ticker);
CREATE INDEX IF NOT EXISTS dark_pool_timestamp_idx ON dark_pool_data (timestamp);
CREATE INDEX IF NOT EXISTS dark_pool_volume_idx ON dark_pool_data (volume);

-- Add Row Level Security policies
ALTER TABLE options_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE dark_pool_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view the data
CREATE POLICY options_flow_select_policy ON options_flow
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY dark_pool_data_select_policy ON dark_pool_data
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy for insert/update operations (only for service role)
CREATE POLICY options_flow_insert_policy ON options_flow
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

CREATE POLICY options_flow_update_policy ON options_flow
  FOR UPDATE 
  TO service_role
  USING (true);

CREATE POLICY dark_pool_data_insert_policy ON dark_pool_data
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

CREATE POLICY dark_pool_data_update_policy ON dark_pool_data
  FOR UPDATE 
  TO service_role
  USING (true);

-- Create function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for options_flow
CREATE TRIGGER update_options_flow_timestamp
BEFORE UPDATE ON options_flow
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create trigger for dark_pool_data
CREATE TRIGGER update_dark_pool_data_timestamp
BEFORE UPDATE ON dark_pool_data
FOR EACH ROW
EXECUTE FUNCTION update_timestamp(); 
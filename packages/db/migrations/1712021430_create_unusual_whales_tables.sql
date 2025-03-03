-- Create options flow table
CREATE TABLE IF NOT EXISTS options_flow (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  strike NUMERIC NOT NULL,
  contract_type TEXT NOT NULL,
  expiration TIMESTAMP NOT NULL,
  sentiment TEXT NOT NULL,
  volume INTEGER NOT NULL,
  open_interest INTEGER NOT NULL,
  premium NUMERIC NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  volatility NUMERIC NOT NULL,
  underlying_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT options_flow_contract_type_check CHECK (contract_type IN ('call', 'put')),
  CONSTRAINT options_flow_sentiment_check CHECK (sentiment IN ('bullish', 'bearish', 'neutral'))
);

-- Create indexes for options flow
CREATE INDEX IF NOT EXISTS options_flow_ticker_idx ON options_flow (ticker);
CREATE INDEX IF NOT EXISTS options_flow_timestamp_idx ON options_flow (timestamp);
CREATE INDEX IF NOT EXISTS options_flow_sentiment_idx ON options_flow (sentiment);
CREATE INDEX IF NOT EXISTS options_flow_expiration_idx ON options_flow (expiration);

-- Create dark pool data table
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

-- Create indexes for dark pool data
CREATE INDEX IF NOT EXISTS dark_pool_ticker_idx ON dark_pool_data (ticker);
CREATE INDEX IF NOT EXISTS dark_pool_timestamp_idx ON dark_pool_data (timestamp);
CREATE INDEX IF NOT EXISTS dark_pool_volume_idx ON dark_pool_data (volume);

-- Add RLS policies for the tables
ALTER TABLE options_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE dark_pool_data ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all authenticated users to view the data
CREATE POLICY options_flow_select ON options_flow
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY dark_pool_select ON dark_pool_data
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_options_flow_updated_at
BEFORE UPDATE ON options_flow
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dark_pool_updated_at
BEFORE UPDATE ON dark_pool_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 
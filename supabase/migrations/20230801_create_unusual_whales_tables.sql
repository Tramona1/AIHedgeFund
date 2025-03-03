-- Create options_flow table to store unusual options activity
CREATE TABLE IF NOT EXISTS options_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  contract_type VARCHAR(4) CHECK (contract_type IN ('CALL', 'PUT')),
  strike_price DECIMAL NOT NULL,
  expiration DATE NOT NULL,
  volume INTEGER NOT NULL,
  open_interest INTEGER,
  implied_volatility DECIMAL,
  premium DECIMAL NOT NULL,
  premium_value DECIMAL NOT NULL,
  trade_side VARCHAR(4) CHECK (trade_side IN ('BUY', 'SELL')),
  unusual_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dark_pool table to store institutional/dark pool trades
CREATE TABLE IF NOT EXISTS dark_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  volume INTEGER NOT NULL,
  price DECIMAL NOT NULL,
  total_value DECIMAL NOT NULL,
  exchange VARCHAR(20),
  is_bullish BOOLEAN,
  significance_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_options_flow_symbol ON options_flow(symbol);
CREATE INDEX IF NOT EXISTS idx_options_flow_timestamp ON options_flow(timestamp);
CREATE INDEX IF NOT EXISTS idx_options_flow_premium_value ON options_flow(premium_value);
CREATE INDEX IF NOT EXISTS idx_options_flow_expiration ON options_flow(expiration);

CREATE INDEX IF NOT EXISTS idx_dark_pool_symbol ON dark_pool(symbol);
CREATE INDEX IF NOT EXISTS idx_dark_pool_timestamp ON dark_pool(timestamp);
CREATE INDEX IF NOT EXISTS idx_dark_pool_total_value ON dark_pool(total_value);

-- Add trigger functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_options_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_options_flow_updated_at
BEFORE UPDATE ON options_flow
FOR EACH ROW EXECUTE FUNCTION update_options_flow_updated_at();

CREATE OR REPLACE FUNCTION update_dark_pool_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dark_pool_updated_at
BEFORE UPDATE ON dark_pool
FOR EACH ROW EXECUTE FUNCTION update_dark_pool_updated_at(); 
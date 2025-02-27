-- Create option_flow_data table for storing option flow analysis
CREATE TABLE IF NOT EXISTS option_flow_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL,
    date TEXT NOT NULL,
    total_call_premium DECIMAL,
    total_put_premium DECIMAL,
    call_put_ratio DECIMAL,
    call_sweeps INTEGER,
    put_sweeps INTEGER,
    sentiment TEXT,
    unusual_call_count INTEGER,
    unusual_put_count INTEGER,
    has_unusual_activity BOOLEAN,
    analysis_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Enforce unique constraint on ticker and date
    CONSTRAINT unique_ticker_date UNIQUE (ticker, date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS option_flow_ticker_idx ON option_flow_data (ticker);
CREATE INDEX IF NOT EXISTS option_flow_date_idx ON option_flow_data (date);
CREATE INDEX IF NOT EXISTS option_flow_sentiment_idx ON option_flow_data (sentiment); 
-- Add new tables for additional data sources
-- Run this script in your Supabase SQL Editor

-- Bank Reports (Big Banks Reports)
CREATE TABLE IF NOT EXISTS public.bank_reports (
    id TEXT PRIMARY KEY,
    bank_name TEXT NOT NULL,
    report_date DATE,
    report_type TEXT, -- 'quarterly', 'annual', etc.
    fiscal_period TEXT, -- 'Q1 2023', etc.
    metrics JSONB, -- e.g., {"revenue": 1000000000, "eps": 2.5}
    summary TEXT,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bank_reports_bank_name_idx ON public.bank_reports(bank_name);
CREATE INDEX IF NOT EXISTS bank_reports_report_date_idx ON public.bank_reports(report_date);

-- YouTube Videos (if needed beyond the interviews table)
CREATE TABLE IF NOT EXISTS public.youtube_videos (
    id TEXT PRIMARY KEY,
    video_id TEXT UNIQUE,
    title TEXT,
    channel TEXT,
    publish_date DATE,
    transcript TEXT,
    summary TEXT,
    stock_mentions JSONB, -- e.g., ["AAPL", "MSFT"]
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS youtube_videos_channel_idx ON public.youtube_videos(channel);
CREATE INDEX IF NOT EXISTS youtube_videos_publish_date_idx ON public.youtube_videos(publish_date);

-- Insider Trades (Insider Buys and Sells)
CREATE TABLE IF NOT EXISTS public.insider_trades (
    transaction_id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    company_name TEXT,
    insider_name TEXT,
    insider_position TEXT, -- e.g., 'CEO', 'CFO', 'Director'
    transaction_type TEXT, -- 'buy' or 'sell'
    shares_traded INT,
    price NUMERIC(15,2),
    transaction_value NUMERIC(15,2),
    transaction_date DATE,
    filing_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS insider_trades_symbol_idx ON public.insider_trades(symbol);
CREATE INDEX IF NOT EXISTS insider_trades_transaction_date_idx ON public.insider_trades(transaction_date);
CREATE INDEX IF NOT EXISTS insider_trades_insider_name_idx ON public.insider_trades(insider_name);

-- Political Trades (Politicians' Trades)
CREATE TABLE IF NOT EXISTS public.political_trades (
    transaction_id TEXT PRIMARY KEY,
    politician_name TEXT,
    politician_position TEXT, -- e.g., 'Senator', 'Representative'
    symbol TEXT NOT NULL,
    company_name TEXT,
    transaction_type TEXT, -- 'buy' or 'sell'
    asset_type TEXT, -- 'stock', 'option', etc.
    shares_traded TEXT, -- Sometimes reported as ranges
    transaction_date DATE,
    filing_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS political_trades_symbol_idx ON public.political_trades(symbol);
CREATE INDEX IF NOT EXISTS political_trades_politician_name_idx ON public.political_trades(politician_name);
CREATE INDEX IF NOT EXISTS political_trades_transaction_date_idx ON public.political_trades(transaction_date);

-- Hedge Fund Trades (Hedge Fund Buys and Sells)
CREATE TABLE IF NOT EXISTS public.hedge_fund_trades (
    id TEXT PRIMARY KEY,
    fund_name TEXT,
    fund_manager TEXT,
    symbol TEXT NOT NULL,
    company_name TEXT,
    transaction_type TEXT, -- 'new', 'add', 'reduce', 'exit'
    shares_held BIGINT,
    shares_changed BIGINT,
    percentage_change NUMERIC(8,2),
    portfolio_percentage NUMERIC(8,2),
    filing_date DATE,
    quarter_end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hedge_fund_trades_symbol_idx ON public.hedge_fund_trades(symbol);
CREATE INDEX IF NOT EXISTS hedge_fund_trades_fund_name_idx ON public.hedge_fund_trades(fund_name);
CREATE INDEX IF NOT EXISTS hedge_fund_trades_filing_date_idx ON public.hedge_fund_trades(filing_date);

-- Financial News (News Data)
CREATE TABLE IF NOT EXISTS public.financial_news (
    id TEXT PRIMARY KEY,
    title TEXT,
    summary TEXT,
    content TEXT,
    sentiment TEXT, -- 'positive', 'negative', 'neutral'
    tickers JSONB, -- e.g., ["AAPL", "MSFT"]
    source TEXT,
    url TEXT,
    publish_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS financial_news_publish_date_idx ON public.financial_news(publish_date);
CREATE INDEX IF NOT EXISTS financial_news_source_idx ON public.financial_news(source);

-- Create a storage bucket for bank reports if it doesn't exist already
-- Note: This needs to be done in the Supabase dashboard or using their API 
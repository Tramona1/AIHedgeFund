-- Complete Supabase Schema Setup for AI Hedge Fund
-- This file creates all the required tables for the application

-- ============================================================================
-- OPTIONS FLOW AND DARK POOL (UNUSUAL WHALES DATA)
-- ============================================================================

-- Options Flow data from Unusual Whales API
CREATE TABLE IF NOT EXISTS public.options_flow (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  strike NUMERIC NOT NULL,
  expiration_date DATE NOT NULL,
  volume INTEGER NOT NULL,
  open_interest INTEGER,
  premium NUMERIC,
  contract_type TEXT NOT NULL, -- 'CALL' or 'PUT'
  sentiment TEXT, -- 'BULLISH', 'BEARISH', 'NEUTRAL'
  unusual_score NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for options flow
CREATE INDEX IF NOT EXISTS options_flow_symbol_idx ON public.options_flow(symbol);
CREATE INDEX IF NOT EXISTS options_flow_date_time_idx ON public.options_flow(date_time);

-- Dark Pool data from Unusual Whales API
CREATE TABLE IF NOT EXISTS public.dark_pool_data (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  volume INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  exchange_code TEXT,
  is_block_trade BOOLEAN,
  significance NUMERIC, -- How significant the dark pool activity is
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for dark pool data
CREATE INDEX IF NOT EXISTS dark_pool_symbol_idx ON public.dark_pool_data(symbol);
CREATE INDEX IF NOT EXISTS dark_pool_date_time_idx ON public.dark_pool_data(date_time);

-- ============================================================================
-- MARKET DATA
-- ============================================================================

-- Stock data table for storing latest price and volume information
CREATE TABLE IF NOT EXISTS public.stock_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  price NUMERIC(15, 4),
  open_price NUMERIC(15, 4),
  high_price NUMERIC(15, 4),
  low_price NUMERIC(15, 4),
  previous_close NUMERIC(15, 4),
  volume NUMERIC(20, 0),
  change NUMERIC(15, 4),
  change_percent NUMERIC(10, 4),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_source VARCHAR(50) DEFAULT 'alpha_vantage',
  meta_data JSONB
);

-- Indexes for stock data
CREATE INDEX IF NOT EXISTS stock_data_symbol_idx ON public.stock_data(symbol);
CREATE INDEX IF NOT EXISTS stock_data_timestamp_idx ON public.stock_data(timestamp);

-- Company information
CREATE TABLE IF NOT EXISTS public.company_info (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap NUMERIC(30, 2),
  pe_ratio NUMERIC(15, 4),
  dividend_yield NUMERIC(10, 4),
  eps NUMERIC(15, 4),
  beta NUMERIC(10, 4),
  fifty_two_week_high NUMERIC(15, 4),
  fifty_two_week_low NUMERIC(15, 4),
  shares_outstanding NUMERIC(20, 0),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_source VARCHAR(50) DEFAULT 'alpha_vantage',
  meta_data JSONB
);

-- Indexes for company info
CREATE INDEX IF NOT EXISTS company_info_symbol_idx ON public.company_info(symbol);
CREATE INDEX IF NOT EXISTS company_info_sector_idx ON public.company_info(sector);

-- Balance sheet data
CREATE TABLE IF NOT EXISTS public.balance_sheet (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  fiscal_date_ending VARCHAR(20) NOT NULL,
  reported_currency VARCHAR(10),
  total_assets NUMERIC(30, 2),
  total_current_assets NUMERIC(30, 2),
  cash_and_cash_equivalents NUMERIC(30, 2),
  inventory NUMERIC(30, 2),
  total_liabilities NUMERIC(30, 2),
  total_current_liabilities NUMERIC(30, 2),
  total_shareholder_equity NUMERIC(30, 2),
  retained_earnings NUMERIC(30, 2),
  common_stock NUMERIC(30, 2),
  is_quarterly BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_source VARCHAR(50) DEFAULT 'alpha_vantage',
  full_data JSONB
);

-- Indexes for balance sheet
CREATE INDEX IF NOT EXISTS balance_sheet_symbol_idx ON public.balance_sheet(symbol);
CREATE INDEX IF NOT EXISTS balance_sheet_date_idx ON public.balance_sheet(fiscal_date_ending);

-- Income statement data
CREATE TABLE IF NOT EXISTS public.income_statement (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  fiscal_date_ending VARCHAR(20) NOT NULL,
  reported_currency VARCHAR(10),
  total_revenue NUMERIC(30, 2),
  cost_of_revenue NUMERIC(30, 2),
  gross_profit NUMERIC(30, 2),
  operating_expenses NUMERIC(30, 2),
  operating_income NUMERIC(30, 2),
  income_before_tax NUMERIC(30, 2),
  net_income NUMERIC(30, 2),
  eps NUMERIC(15, 4),
  is_quarterly BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_source VARCHAR(50) DEFAULT 'alpha_vantage',
  full_data JSONB
);

-- Indexes for income statement
CREATE INDEX IF NOT EXISTS income_statement_symbol_idx ON public.income_statement(symbol);
CREATE INDEX IF NOT EXISTS income_statement_date_idx ON public.income_statement(fiscal_date_ending);

-- Technical indicators
CREATE TABLE IF NOT EXISTS public.technical_indicators (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  indicator_type VARCHAR(20) NOT NULL,
  date VARCHAR(20) NOT NULL,
  value NUMERIC(15, 6),
  parameters JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_source VARCHAR(50) DEFAULT 'alpha_vantage',
  meta_data JSONB
);

-- Indexes for technical indicators
CREATE INDEX IF NOT EXISTS technical_indicators_symbol_idx ON public.technical_indicators(symbol);
CREATE INDEX IF NOT EXISTS technical_indicators_type_idx ON public.technical_indicators(indicator_type);
CREATE INDEX IF NOT EXISTS technical_indicators_date_idx ON public.technical_indicators(date);

-- User watchlists
CREATE TABLE IF NOT EXISTS public.user_watchlist (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for user watchlist
CREATE INDEX IF NOT EXISTS user_watchlist_user_id_idx ON public.user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS user_watchlist_symbol_idx ON public.user_watchlist(symbol);
CREATE INDEX IF NOT EXISTS user_watchlist_user_symbol_idx ON public.user_watchlist(user_id, symbol);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  market_alerts BOOLEAN DEFAULT true,
  news_alerts BOOLEAN DEFAULT true,
  watchlist_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for user preferences
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON public.user_preferences(user_id);

-- ============================================================================
-- ECONOMIC REPORTS
-- ============================================================================

-- Create economic_reports table for storing economic report data
CREATE TABLE IF NOT EXISTS public.economic_reports (
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

-- Create indexes for faster lookups on economic reports
CREATE INDEX IF NOT EXISTS economic_reports_source_idx ON public.economic_reports(source);
CREATE INDEX IF NOT EXISTS economic_reports_category_idx ON public.economic_reports(category);
CREATE INDEX IF NOT EXISTS economic_reports_timestamp_idx ON public.economic_reports(timestamp);

-- ============================================================================
-- INTERVIEWS
-- ============================================================================

-- Create interviews table for storing interview transcriptions and summaries
CREATE TABLE IF NOT EXISTS public.interviews (
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

-- Create indexes for faster lookups on interviews table
CREATE INDEX IF NOT EXISTS interviews_speaker_idx ON public.interviews(speaker);
CREATE INDEX IF NOT EXISTS interviews_timestamp_idx ON public.interviews(timestamp);

-- ============================================================================
-- STOCK UPDATES AND NOTIFICATIONS
-- ============================================================================

-- Stock updates table
CREATE TABLE IF NOT EXISTS public.stock_updates (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  details JSONB,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for stock updates
CREATE INDEX IF NOT EXISTS stock_updates_ticker_idx ON public.stock_updates(ticker);
CREATE INDEX IF NOT EXISTS stock_updates_created_at_idx ON public.stock_updates(created_at);

-- ============================================================================
-- AI RELATED TABLES
-- ============================================================================

-- AI Query history
CREATE TABLE IF NOT EXISTS public.ai_query_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for AI query history
CREATE INDEX IF NOT EXISTS ai_query_history_user_id_idx ON public.ai_query_history(user_id);
CREATE INDEX IF NOT EXISTS ai_query_history_created_at_idx ON public.ai_query_history(created_at);

-- AI Triggers
CREATE TABLE IF NOT EXISTS public.ai_triggers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_condition JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for AI triggers
CREATE INDEX IF NOT EXISTS ai_triggers_user_id_idx ON public.ai_triggers(user_id);
CREATE INDEX IF NOT EXISTS ai_triggers_trigger_type_idx ON public.ai_triggers(trigger_type);

-- ============================================================================
-- STORAGE BUCKETS (MUST BE CREATED THROUGH SUPABASE DASHBOARD)
-- ============================================================================
-- 1. Go to Storage > Create a new bucket named 'reports'
-- 2. Go to Storage > Create a new bucket named 'interviews'
-- 3. Set appropriate access policies for each bucket 
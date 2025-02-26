# AI Hedge Fund Data Pipeline

This directory contains the data pipeline components for the AI Hedge Fund project. These Python scripts handle data collection, processing, and analysis for various financial data sources.

## Components

The data pipeline consists of the following components:

- **Scheduler (`scheduler.py`)**: Main coordinator that schedules and runs all data collection jobs at specified intervals.
- **Market Data Fetcher (`market_data_fetcher.py`)**: Fetches market data from Yahoo Finance, including prices, volumes, and technical indicators.
- **SEC EDGAR Fetcher (`sec_edgar_fetcher.py`)**: Retrieves SEC filings from the EDGAR database, focusing on forms like 13F, 13D, and Form 4.
- **Twitter Scraper (`twitter_scraper.py`)**: Monitors Twitter for investor activities and stock mentions.
- **Dark Pool Processor (`dark_pool_processor.py`)**: Processes dark pool trading data to identify significant block trades.
- **Option Flow Processor (`option_flow_processor.py`)**: Analyzes options flow data to identify unusual activities and sentiment.
- **Holdings Change Detector (`holdings_change_detector.py`)**: Detects changes in stock holdings from SEC filings and generates alerts.
- **Dashboard Server (`dashboard_server.py`)**: Flask-based API server that provides endpoints for the Next.js frontend.

## Setup

### Prerequisites

- Python 3.9 or higher
- Supabase account (for database)
- Twitter API credentials (X Bearer Token)

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   Copy the `.env.example` file to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your:
   - Supabase URL and key
   - X (Twitter) Bearer Token
   - Alpha Vantage API key (if used)
   - API URL for local development

3. **Database setup**:
   The scripts expect the following tables to exist in your Supabase database:
   - `market_data`
   - `sec_filings`
   - `twitter_data`
   - `dark_pool_data`
   - `option_flow_data`
   - `holdings_alerts`
   - `tracked_investors`
   - `investor_holdings`
   - `tracked_twitter_accounts`

## Running the Pipeline

### Run the Main Scheduler

The scheduler will start all the data pipeline components at scheduled intervals:

```bash
python scheduler.py
```

### Run Individual Components

You can also run individual components directly:

```bash
# Market data
python market_data_fetcher.py

# SEC EDGAR data
python sec_edgar_fetcher.py

# Twitter data
python twitter_scraper.py

# Dark pool data
python dark_pool_processor.py

# Option flow data
python option_flow_processor.py

# Holdings change detection
python holdings_change_detector.py
```

### Dashboard Server

The dashboard server runs on port 5000 by default:

```bash
python dashboard_server.py
```

The server provides various API endpoints for the frontend, including:
- `/api/market/summary` - Market data summary
- `/api/filings/recent` - Recent SEC filings
- `/api/twitter/recent` - Recent Twitter mentions
- `/api/dark-pool/recent` - Recent dark pool activity
- `/api/option-flow/recent` - Recent option flow data
- `/api/alerts/recent` - Recent holdings change alerts
- `/api/dashboard/summary` - Combined dashboard summary

## Configuration

### Tracked Tickers

By default, the pipeline tracks the following tickers:
`AAPL, MSFT, AMZN, GOOG, META, NVDA, TSLA, AMD, JPM, BAC`

To track different tickers, set the `TRACKED_TICKERS` environment variable as a comma-separated list:

```
TRACKED_TICKERS=AAPL,MSFT,TSLA,NVDA,AMC,GME
```

## Development Notes

- This is a data pipeline for collecting and processing financial data - not for making trading decisions.
- Some components use simulated data where real APIs aren't available (e.g., dark pool data).
- The SEC EDGAR fetcher respects SEC rate limits (10 requests per second).
- For production use, you would need to subscribe to professional data providers for some data types.

## Connecting to the Frontend

The dashboard server connects to the Next.js frontend through API endpoints. Make sure the `API_URL` in your frontend's environment points to the dashboard server (default: `http://localhost:5000`). 
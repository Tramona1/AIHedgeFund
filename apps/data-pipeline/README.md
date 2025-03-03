# Financial Data Pipeline

This module contains the data pipeline responsible for collecting financial data from various sources and storing it in the Supabase database. The data is then displayed in the web application's Financial Data dashboard.

## Data Sources

The pipeline collects data from the following sources:

1. **Bank Reports** - Research reports from major investment banks
2. **YouTube Videos** - Financial analysis videos from reputable channels
3. **Insider Trades** - SEC Form 4 filings from company insiders
4. **Political Trades** - Stock transactions by members of Congress
5. **Hedge Fund Trades** - 13F filings from major hedge funds
6. **Financial News** - Market news from various sources
7. **Analyst Ratings** - Price target changes and rating updates

## Setup

1. Clone the repository
2. Install dependencies with `pip install -r requirements.txt` and `pip install -r requirements-additional.txt`
3. Copy `.env.example` to `.env` and fill in the required API keys
4. Run the setup script with `python setup.py`

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL` - URL of your Supabase instance
- `SUPABASE_KEY` - API key for Supabase access
- `YOUTUBE_API_KEY` - Google API key with YouTube Data API access
- `GOOGLE_API_KEY` - Google API key for generating AI summaries
- `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_SERVER`, `EMAIL_PORT` - Email account for bank reports
- `UNUSUAL_WHALES_API_KEY` - API key for insider and political trades
- `WHALEWISDOM_API_KEY` - API key for hedge fund holdings data
- `NEWS_API_KEY`, `FINANCIAL_TIMES_API_KEY`, `BLOOMBERG_API_KEY` - News API keys

## Running the Pipeline

### Manual Execution

You can run the entire pipeline at once:

```bash
python run_all_fetchers.py
```

Or run individual fetchers:

```bash
python bank_reports_fetcher.py
python youtube_videos_fetcher.py
python insider_trades_fetcher.py
python political_trades_fetcher.py
python hedge_fund_trades_fetcher.py
python financial_news_fetcher.py
```

### Scheduled Execution

The main scheduler runs all fetchers according to their optimal schedule:

```bash
python main_scheduler.py
```

## API Integration

### Unusual Whales API

The `unusual_whales_api.py` module provides integration with the Unusual Whales API for insider trading, political trading, and analyst sentiment data. It handles rate limiting, caching, and error handling.

Example usage:

```python
from unusual_whales_api import get_insider_trades, get_political_trades, get_analyst_ratings

# Fetch insider trades from the last 14 days
insider_trades = get_insider_trades(days=14, limit=100)

# Fetch political trades with Democratic party filter
political_trades = get_political_trades(days=30, party="Democratic", limit=100)

# Fetch analyst upgrades only
ratings = get_analyst_ratings(days=7, rating_change="upgrade", limit=100)
```

## Database Schema

The Supabase database contains the following tables:

- `bank_reports`
- `youtube_videos`
- `insider_trades`
- `political_trades`
- `hedge_fund_trades`
- `financial_news`
- `analyst_ratings`

See `supabase-add-tables.sql` for detailed schema information.

## Processing Flow

1. **Fetching**: Data is retrieved from external APIs and sources
2. **Processing**: Data is cleaned, normalized, and enriched
3. **Analysis**: AI-generated summaries and sentiment analysis are added
4. **Storage**: Processed data is stored in Supabase
5. **Display**: Data is served via API endpoints to the web application

## Troubleshooting

If you encounter issues:

1. Check your API keys in the `.env` file
2. Verify network connectivity to external APIs
3. Check Supabase connection settings
4. Look for error logs in the console output
5. Clear the cache with `python -c "from unusual_whales_api import clear_cache; clear_cache()"`

## Contributing

To add a new data source:

1. Create a new fetcher file (e.g., `new_source_fetcher.py`)
2. Implement the fetcher class with `fetch`, `process`, and `store` methods
3. Add the new fetcher to `run_all_fetchers.py`
4. Update the database schema if necessary
5. Add appropriate API endpoints in the web application 
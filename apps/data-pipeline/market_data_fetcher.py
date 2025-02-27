import asyncio
import logging
import json
import os
import time
import io
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv
import requests
import pandas as pd

# Set up logging
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

# Log environment variables (without sensitive data)
logger.info(f"SUPABASE_URL set: {bool(SUPABASE_URL)}")
logger.info(f"SUPABASE_KEY set: {bool(SUPABASE_KEY)}")
logger.info(f"ALPHA_VANTAGE_API_KEY set: {bool(ALPHA_VANTAGE_API_KEY)}")
logger.info(f"DEMO_MODE: {DEMO_MODE}")

# Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
    if supabase:
        logger.info("Supabase client created successfully")
    else:
        logger.warning("Supabase client could not be initialized - missing credentials")
except Exception as e:
    logger.error(f"Error creating Supabase client: {e}")
    supabase = None

# Tables in Supabase
MARKET_TABLE = "market_data"
EARNINGS_TABLE = "earnings_calendar"
TOP_STOCKS_TABLE = "top_stocks"

class MarketDataFetcher:
    def __init__(self):
        self.last_request_time = 0
        self.min_request_interval = 0.5  # seconds between API requests
        self.alpha_vantage_url = "https://www.alphavantage.co/query"
        self.session = None
        logger.info("MarketDataFetcher initialized")

    async def close(self):
        """Close any open resources"""
        if self.session and hasattr(self.session, 'close'):
            await self.session.close()

    def fetch_with_rate_limit(self, url, params=None):
        """Make API requests with rate limiting to respect API provider limits"""
        # If in demo mode, generate mock data instead of real API calls
        if DEMO_MODE:
            logger.info(f"DEMO MODE: Simulating API call to {url} with params: {params}")
            return self._generate_demo_data(params.get("function") if params else None, params)
        
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        # If we've made a request too recently, sleep to respect rate limits
        if time_since_last_request < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last_request
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        # Make the request
        try:
            response = requests.get(url, params=params)
            
            # Update last request time
            self.last_request_time = time.time()
            
            # Check for rate limit error in Alpha Vantage
            if response.status_code == 200 and "Note" in response.text and ("API call frequency" in response.text or "Thank you for using Alpha Vantage" in response.text):
                logger.warning("API rate limit reached. Consider enabling DEMO_MODE for testing.")
                if DEMO_MODE:
                    logger.info("Falling back to demo data due to rate limit")
                    return self._generate_demo_data(params.get("function") if params else None, params)
            
            # Check for other errors
            if response.status_code != 200:
                logger.error(f"API request failed with status code {response.status_code}: {response.text}")
                return None
                
            # Try to parse as JSON
            try:
                return response.json()
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse response as JSON: {e}")
                # Return the text response for endpoints that don't return JSON
                return {"text": response.text} if hasattr(response, 'text') else None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            if DEMO_MODE:
                logger.info("Falling back to demo data due to request error")
                return self._generate_demo_data(params.get("function") if params else None, params)
            return None

    def _generate_demo_data(self, function_name, params=None):
        """Generate demo data for testing when API is unavailable"""
        logger.info(f"Generating demo data for function: {function_name}")
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        
        if not function_name:
            return {"error": "No function specified"}
            
        if function_name == "TIME_SERIES_DAILY":
            symbol = params.get("symbol", "DEMO")
            return {
                "Meta Data": {
                    "1. Information": "Daily Prices (open, high, low, close) and Volumes",
                    "2. Symbol": symbol,
                    "3. Last Refreshed": today,
                    "4. Output Size": "Compact",
                    "5. Time Zone": "US/Eastern"
                },
                "Time Series (Daily)": {
                    today: {
                        "1. open": "150.00",
                        "2. high": "155.00",
                        "3. low": "148.00",
                        "4. close": "153.50",
                        "5. volume": "50000000"
                    },
                    yesterday: {
                        "1. open": "148.50",
                        "2. high": "152.00",
                        "3. low": "147.00",
                        "4. close": "150.00",
                        "5. volume": "45000000"
                    }
                }
            }
        elif function_name == "TOP_GAINERS_LOSERS":
            return {
                "metadata": "Top gainers, losers, and most actively traded US tickers",
                "last_updated": today,
                "top_gainers": [
                    {"ticker": "DEMO1", "price": "25.50", "change_amount": "5.50", "change_percentage": "27.5%", "volume": "1000000"},
                    {"ticker": "DEMO2", "price": "125.75", "change_amount": "20.75", "change_percentage": "19.75%", "volume": "3000000"}
                ],
                "top_losers": [
                    {"ticker": "DEMO3", "price": "45.50", "change_amount": "-9.50", "change_percentage": "-17.25%", "volume": "2000000"},
                    {"ticker": "DEMO4", "price": "78.25", "change_amount": "-12.25", "change_percentage": "-13.5%", "volume": "1500000"}
                ],
                "most_actively_traded": [
                    {"ticker": "DEMO5", "price": "157.50", "change_amount": "3.50", "change_percentage": "2.25%", "volume": "75000000"},
                    {"ticker": "DEMO6", "price": "943.00", "change_amount": "-12.00", "change_percentage": "-1.25%", "volume": "60000000"}
                ]
            }
        elif function_name == "DIGITAL_CURRENCY_DAILY":
            symbol = params.get("symbol", "BTC")
            return {
                "Meta Data": {
                    "1. Information": "Daily Prices and Volumes for Digital Currency",
                    "2. Digital Currency Code": symbol,
                    "3. Digital Currency Name": "Bitcoin" if symbol == "BTC" else symbol,
                    "4. Market Code": "USD",
                    "5. Market Name": "United States Dollar",
                    "6. Last Refreshed": today,
                    "7. Time Zone": "UTC"
                },
                "Time Series (Digital Currency Daily)": {
                    today: {
                        "1a. open (USD)": "44000.00",
                        "1b. open (USD)": "44000.00",
                        "2a. high (USD)": "45000.00",
                        "2b. high (USD)": "45000.00",
                        "3a. low (USD)": "43500.00",
                        "3b. low (USD)": "43500.00",
                        "4a. close (USD)": "44750.00",
                        "4b. close (USD)": "44750.00",
                        "5. volume": "25000",
                        "6. market cap (USD)": "1118750000"
                    },
                    yesterday: {
                        "1a. open (USD)": "43500.00",
                        "1b. open (USD)": "43500.00",
                        "2a. high (USD)": "44200.00",
                        "2b. high (USD)": "44200.00",
                        "3a. low (USD)": "43200.00",
                        "3b. low (USD)": "43200.00",
                        "4a. close (USD)": "44000.00",
                        "4b. close (USD)": "44000.00",
                        "5. volume": "22000",
                        "6. market cap (USD)": "968000000"
                    }
                }
            }
        elif function_name == "EARNINGS_CALENDAR":
            # For the earnings calendar, which returns CSV data
            csv_data = "symbol,name,reportDate,fiscalDateEnding,estimate,currency\n"
            csv_data += "DEMO1,Demo Company 1,2023-04-25,2023-03-31,2.35,USD\n"
            csv_data += "DEMO2,Demo Company 2,2023-04-27,2023-03-31,1.75,USD\n"
            csv_data += "DEMO3,Demo Company 3,2023-05-01,2023-03-31,0.95,USD\n"
            return {"text": csv_data}
        else:
            # Generic response for unknown function
            return {"demo_data": "true", "function": function_name, "message": "Using demo data"}

    def fetch_market_data(self, ticker):
        """Fetch market data from Alpha Vantage API"""
        logger.info(f"Fetching market data for {ticker}")
        
        # Fetch daily time series data
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": ticker,
            "outputsize": "compact",
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not data or "Time Series (Daily)" not in data:
            logger.error(f"Failed to fetch market data for {ticker}", extra={"metadata": {"ticker": ticker}})
            return None
        
        # Get the most recent day's data
        time_series = data["Time Series (Daily)"]
        latest_date = list(time_series.keys())[0]
        latest_data = time_series[latest_date]
        
        # Get previous day for price change calculation
        if len(list(time_series.keys())) > 1:
            prev_date = list(time_series.keys())[1]
            prev_data = time_series[prev_date]
            prev_close = float(prev_data['4. close'])
            current_close = float(latest_data['4. close'])
            price_change = current_close - prev_close
            price_change_pct = (price_change / prev_close) * 100
        else:
            price_change = 0
            price_change_pct = 0
        
        # Format the result
        result = {
            "ticker": ticker,
            "price": float(latest_data['4. close']),
            "open": float(latest_data['1. open']),
            "high": float(latest_data['2. high']),
            "low": float(latest_data['3. low']),
            "volume": int(float(latest_data['5. volume'])),
            "date": latest_date,
            "price_change": price_change,
            "price_change_pct": price_change_pct,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Successfully fetched market data for {ticker}: {result['price']}")
        return result

    def fetch_top_gainers_losers(self):
        """Fetch top gainers and losers from Alpha Vantage"""
        logger.info("Fetching top gainers and losers")
        
        # Fetch top gainers/losers
        params = {
            "function": "TOP_GAINERS_LOSERS",
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not data:
            logger.error("Failed to fetch top gainers and losers", extra={"metadata": {}})
            return None
        
        # Process the data
        top_gainers = data.get("top_gainers", [])
        top_losers = data.get("top_losers", [])
        most_active = data.get("most_actively_traded", [])
        
        # Process each category to extract key information
        processed_gainers = []
        for stock in top_gainers:
            processed_gainers.append({
                "ticker": stock.get("ticker"),
                "price": float(stock.get("price", 0)),
                "change_amount": float(stock.get("change_amount", 0)),
                "change_percentage": float(stock.get("change_percentage", "0").strip('%')),
                "volume": int(stock.get("volume", 0))
            })
        
        processed_losers = []
        for stock in top_losers:
            processed_losers.append({
                "ticker": stock.get("ticker"),
                "price": float(stock.get("price", 0)),
                "change_amount": float(stock.get("change_amount", 0)),
                "change_percentage": float(stock.get("change_percentage", "0").strip('%')),
                "volume": int(stock.get("volume", 0))
            })
        
        processed_active = []
        for stock in most_active:
            processed_active.append({
                "ticker": stock.get("ticker"),
                "price": float(stock.get("price", 0)),
                "change_amount": float(stock.get("change_amount", 0)),
                "change_percentage": float(stock.get("change_percentage", "0").strip('%')),
                "volume": int(stock.get("volume", 0))
            })
        
        # Combine the results
        result = {
            "gainers": processed_gainers,
            "losers": processed_losers,
            "most_active": processed_active,
            "timestamp": datetime.now().isoformat(),
            "last_update": data.get("last_updated", "")
        }
        
        logger.info(f"Successfully fetched top stocks: {len(processed_gainers)} gainers, {len(processed_losers)} losers, {len(processed_active)} most active")
        return result

    def fetch_earnings_calendar(self):
        """Fetch upcoming earnings calendar from Alpha Vantage"""
        logger.info("Fetching earnings calendar")
        
        # Fetch earnings calendar
        params = {
            "function": "EARNINGS_CALENDAR",
            "horizon": "3month",  # Get next 3 months of earnings
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        # This endpoint returns CSV data, not JSON
        response_data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not response_data:
            logger.error("Failed to fetch earnings calendar")
            return None
            
        try:
            # Handle CSV data
            if "text" in response_data:
                csv_text = response_data["text"]
                # Use io.StringIO as a file-like object
                csv_io = io.StringIO(csv_text)
                df = pd.read_csv(csv_io)
            else:
                logger.error("Unexpected response format for earnings calendar")
                return None
                
            # Format the results for insertion
            earnings = []
            for _, row in df.iterrows():
                earnings.append({
                    "ticker": row.get("symbol"),
                    "company_name": row.get("name"),
                    "report_date": row.get("reportDate"),
                    "fiscal_date_ending": row.get("fiscalDateEnding"),
                    "estimate": float(row.get("estimate", 0)) if pd.notna(row.get("estimate")) else None,
                    "currency": "USD",
                    "timestamp": datetime.now().isoformat()
                })
            
            logger.info(f"Successfully fetched earnings calendar: {len(earnings)} entries")
            return earnings
            
        except Exception as e:
            logger.error(f"Failed to parse earnings calendar data: {e}")
            return None

    def fetch_digital_currency(self, symbol="BTC"):
        """Fetch digital currency (crypto) data from Alpha Vantage"""
        logger.info(f"Fetching digital currency data for {symbol}")
        
        # Fetch digital currency data
        params = {
            "function": "DIGITAL_CURRENCY_DAILY",
            "symbol": symbol,
            "market": "USD",
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not data or "Time Series (Digital Currency Daily)" not in data:
            logger.error(f"Failed to fetch digital currency data for {symbol}", extra={"metadata": {"symbol": symbol}})
            return None
        
        # Get the most recent day's data
        time_series = data["Time Series (Digital Currency Daily)"]
        latest_date = list(time_series.keys())[0]
        latest_data = time_series[latest_date]
        
        # Get previous day for price change calculation
        if len(list(time_series.keys())) > 1:
            prev_date = list(time_series.keys())[1]
            prev_data = time_series[prev_date]
            prev_close = float(prev_data['4a. close (USD)'])
            current_close = float(latest_data['4a. close (USD)'])
            price_change = current_close - prev_close
            price_change_pct = (price_change / prev_close) * 100
        else:
            price_change = 0
            price_change_pct = 0
        
        # Format the result
        result = {
            "ticker": f"{symbol}-USD",
            "name": data.get("Meta Data", {}).get("3. Digital Currency Name", symbol),
            "price": float(latest_data['4a. close (USD)']),
            "open": float(latest_data['1a. open (USD)']),
            "high": float(latest_data['2a. high (USD)']),
            "low": float(latest_data['3a. low (USD)']),
            "volume": float(latest_data['5. volume']),
            "market_cap": float(latest_data['6. market cap (USD)']),
            "date": latest_date,
            "price_change": price_change,
            "price_change_pct": price_change_pct,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Successfully fetched cryptocurrency data for {symbol}: {result['price']}")
        return result

    def insert_data(self, table, data, id_fields=None):
        """Insert data into Supabase table"""
        if not supabase:
            logger.error("Cannot insert data: Supabase client not initialized")
            return False
            
        try:
            # For batch inserts
            if isinstance(data, list):
                # If the list is empty, don't insert anything
                if not data:
                    return True
                
                # Add timestamp if not present in each item
                for item in data:
                    if "timestamp" not in item:
                        item["timestamp"] = datetime.now().isoformat()
                
                # Insert the data
                result = supabase.table(table).upsert(data, on_conflict=id_fields).execute()
                logger.info(f"Inserted {len(data)} records into {table}")
                return True
            else:
                # For single record insert
                if "timestamp" not in data:
                    data["timestamp"] = datetime.now().isoformat()
                
                # Insert the data
                result = supabase.table(table).upsert(data, on_conflict=id_fields).execute()
                logger.info(f"Inserted record into {table}: {data.get('ticker', 'unknown')}")
                return True
        except Exception as e:
            logger.error(f"Error inserting data into {table}: {e}")
            return False

    async def run_trader(self, tickers):
        """Run trader-frequency data collection (more frequent)"""
        logger.info(f"Running trader-frequency data collection for tickers: {tickers}")
        
        try:
            # Process each ticker
            for ticker in tickers:
                # Fetch and insert market data
                market_data = self.fetch_market_data(ticker)
                if market_data:
                    self.insert_data(MARKET_TABLE, market_data, id_fields=["ticker"])
            
            # Fetch and insert top gainers/losers (only once for all tickers)
            top_stocks = self.fetch_top_gainers_losers()
            if top_stocks:
                self.insert_data(TOP_STOCKS_TABLE, top_stocks)
            
            logger.info("Trader-frequency data collection completed")
            return True
        except Exception as e:
            logger.error(f"Error in trader-frequency data collection: {e}")
            return False

    async def run_investor(self, tickers):
        """Run investor-frequency data collection (less frequent)"""
        logger.info(f"Running investor-frequency data collection")
        
        try:
            # Fetch and insert earnings calendar (only once for all tickers)
            earnings = self.fetch_earnings_calendar()
            if earnings:
                self.insert_data(EARNINGS_TABLE, earnings, id_fields=["ticker", "report_date"])
            
            # Also fetch digital currency data for Bitcoin
            crypto_data = self.fetch_digital_currency("BTC")
            if crypto_data:
                self.insert_data(MARKET_TABLE, crypto_data, id_fields=["ticker"])
            
            logger.info("Investor-frequency data collection completed")
            return True
        except Exception as e:
            logger.error(f"Error in investor-frequency data collection: {e}")
            return False
            
    def fetch_data_only(self, symbol):
        """Fetch data for a symbol without inserting into database (for testing)"""
        logger.info(f"Testing market data fetch for {symbol}")
        
        result = {
            "market_data": self.fetch_market_data(symbol),
            "top_stocks": self.fetch_top_gainers_losers(),
        }
        
        if symbol.upper() == "BTC":
            result["crypto"] = self.fetch_digital_currency("BTC")
            
        return result

async def main():
    """Run the market data fetcher as a standalone script"""
    # Default tickers to track
    default_tickers = ["AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "TSLA"]
    
    # Get tickers from environment variable or use defaults
    tickers_env = os.getenv("TRACKED_TICKERS")
    tickers = tickers_env.split(",") if tickers_env else default_tickers
    
    # Check if in test mode (just fetch, don't insert)
    test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
    
    # Set logging level to INFO or DEBUG based on test mode
    if test_mode:
        logger.setLevel(logging.INFO)
    
    # If DEMO_MODE is enabled, log it
    if DEMO_MODE:
        logger.info("DEMO MODE is enabled - using simulated market data instead of live API calls")
    
    # Create the fetcher
    fetcher = MarketDataFetcher()
    
    if test_mode:
        logger.info("Running in TEST MODE - no data will be inserted into the database")
        # Just fetch data for AAPL and BTC as a test
        logger.info("Testing market data fetch for AAPL")
        fetcher.fetch_data_only("AAPL")
        logger.info("Testing market data fetch for BTC")
        fetcher.fetch_data_only("BTC")
        logger.info("Test mode data fetch completed")
    else:
        # Run both trader and investor frequency collections
        await fetcher.run_trader(tickers)
        await fetcher.run_investor(tickers)
    
    # Close the fetcher
    await fetcher.close()

if __name__ == "__main__":
    asyncio.run(main()) 
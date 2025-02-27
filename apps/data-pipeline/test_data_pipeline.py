import os
import sys
import json
from dotenv import load_dotenv
import requests
import time

def print_separator(title):
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

class MarketDataTester:
    def __init__(self):
        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        if not self.api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY environment variable not set")
        
        self.base_url = "https://www.alphavantage.co/query"
        self.last_call_time = 0
        
    def _rate_limit(self):
        """Simple rate limiting to avoid hitting API limits."""
        current_time = time.time()
        time_since_last_call = current_time - self.last_call_time
        
        if time_since_last_call < 1.0:  # Ensure at least 1 second between calls
            time.sleep(1.0 - time_since_last_call)
            
        self.last_call_time = time.time()
    
    def fetch_global_quote(self, symbol):
        """Fetch current price data for a symbol."""
        self._rate_limit()
        
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        print(f"Fetching global quote for {symbol}...")
        response = requests.get(self.base_url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if "Global Quote" in data and data["Global Quote"]:
                return {
                    "symbol": symbol,
                    "price": data["Global Quote"].get("05. price"),
                    "change_percent": data["Global Quote"].get("10. change percent"),
                    "volume": data["Global Quote"].get("06. volume"),
                    "latest_trading_day": data["Global Quote"].get("07. latest trading day")
                }
            else:
                print(f"Error or empty response: {data}")
                return None
        else:
            print(f"Failed to fetch data: Status code {response.status_code}")
            return None
            
    def fetch_time_series(self, symbol):
        """Fetch time series data for a symbol."""
        self._rate_limit()
        
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": "compact",
            "apikey": self.api_key
        }
        
        print(f"Fetching time series for {symbol}...")
        response = requests.get(self.base_url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if "Time Series (Daily)" in data:
                time_series = data["Time Series (Daily)"]
                # Get the first (most recent) data point
                latest_date = list(time_series.keys())[0]
                return {
                    "symbol": symbol,
                    "date": latest_date,
                    "open": time_series[latest_date].get("1. open"),
                    "high": time_series[latest_date].get("2. high"),
                    "low": time_series[latest_date].get("3. low"),
                    "close": time_series[latest_date].get("4. close"),
                    "volume": time_series[latest_date].get("5. volume")
                }
            else:
                print(f"Error or empty response: {data}")
                return None
        else:
            print(f"Failed to fetch data: Status code {response.status_code}")
            return None

def test_market_data():
    print_separator("TESTING DIRECT MARKET DATA FETCHING")
    
    try:
        tester = MarketDataTester()
        
        # Test global quote
        symbols = ["AAPL", "MSFT", "GOOGL"]
        quotes = []
        
        for symbol in symbols:
            quote = tester.fetch_global_quote(symbol)
            if quote:
                quotes.append(quote)
                print(f"✅ {symbol}: ${quote['price']} ({quote['change_percent']})")
            else:
                print(f"❌ Failed to fetch data for {symbol}")
        
        if quotes:
            print(f"\n✅ Successfully fetched current price data for {len(quotes)}/{len(symbols)} symbols")
        else:
            print("❌ Failed to fetch any price data")
        
        # Test time series data
        symbol = "AAPL"
        time_series = tester.fetch_time_series(symbol)
        
        if time_series:
            print(f"\n✅ Successfully fetched time series data for {symbol}")
            print(f"  Date: {time_series['date']}")
            print(f"  Open: ${time_series['open']}")
            print(f"  Close: ${time_series['close']}")
            print(f"  Volume: {time_series['volume']}")
        else:
            print(f"\n❌ Failed to fetch time series data for {symbol}")
        
        # Return true if we got at least the quotes and time series
        return len(quotes) > 0 and time_series is not None
        
    except Exception as e:
        print(f"❌ Error testing market data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    load_dotenv()  # Load environment variables
    
    print("\n📊 TESTING AI HEDGE FUND DATA FETCHING 📊\n")
    print("This script will test direct data fetching from financial APIs")
    print("to verify we can get real market data.\n")
    
    # Run the test
    result = test_market_data()
    
    # Print summary
    print_separator("TEST SUMMARY")
    
    if result:
        print("✅ Market data fetching test: PASSED")
        print("\n✅ The data pipeline can successfully fetch real market data from Alpha Vantage.")
        print("   This confirms that your API key is working and data is being returned.")
        print("   Your backend should be able to fetch and process market data.")
    else:
        print("❌ Market data fetching test: FAILED")
        print("\n❌ The test was unable to fetch market data. Check your API key and internet connection.")

if __name__ == "__main__":
    main() 
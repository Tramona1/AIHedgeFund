import os
import json
import logging
import requests
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def test_alpha_vantage_global_quote():
    """Test fetching global quote data from Alpha Vantage"""
    logger.info("Testing Alpha Vantage Global Quote API for AAPL")
    
    # Get API key
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        logger.error("Alpha Vantage API key not found in environment variables")
        return None
    
    # Make API request
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey={api_key}"
    logger.info(f"Making request to: {url}")
    
    try:
        response = requests.get(url)
        data = response.json()
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Global Quote Response: {json.dumps(data, indent=2)}")
        
        if "Global Quote" in data and data["Global Quote"]:
            return data
        else:
            logger.error(f"Unexpected response format: {data}")
            return None
    except Exception as e:
        logger.error(f"Error fetching data: {e}")
        return None

def test_alpha_vantage_time_series():
    """Test fetching time series data from Alpha Vantage"""
    logger.info("Testing Alpha Vantage Time Series API for AAPL")
    
    # Get API key
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        logger.error("Alpha Vantage API key not found in environment variables")
        return None
    
    # Make API request
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey={api_key}&outputsize=compact"
    logger.info(f"Making request to: {url}")
    
    try:
        response = requests.get(url)
        data = response.json()
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"First few time series entries: ")
        
        if "Time Series (Daily)" in data:
            # Print only the first 2 entries to avoid excessive output
            time_series = data["Time Series (Daily)"]
            dates = list(time_series.keys())[:2]
            
            for date in dates:
                print(f"{date}: {json.dumps(time_series[date], indent=2)}")
            
            return data
        else:
            logger.error(f"Unexpected response format: {data}")
            return None
    except Exception as e:
        logger.error(f"Error fetching data: {e}")
        return None

def test_alpha_vantage_crypto():
    """Test fetching cryptocurrency data from Alpha Vantage"""
    logger.info("Testing Alpha Vantage Digital Currency API for BTC")
    
    # Get API key
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        logger.error("Alpha Vantage API key not found in environment variables")
        return None
    
    # Make API request
    url = f"https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=BTC&market=USD&apikey={api_key}"
    logger.info(f"Making request to: {url}")
    
    try:
        response = requests.get(url)
        data = response.json()
        
        print(f"\nResponse Status: {response.status_code}")
        
        if "Meta Data" in data and "Digital Currency Daily" in data:
            print(f"Meta Data: {json.dumps(data['Meta Data'], indent=2)}")
            
            # Print only the first entry to avoid excessive output
            time_series = data["Digital Currency Daily"]
            first_date = list(time_series.keys())[0]
            
            print(f"First entry ({first_date}): {json.dumps(time_series[first_date], indent=2)}")
            
            return data
        else:
            logger.error(f"Unexpected response format: {data}")
            return None
    except Exception as e:
        logger.error(f"Error fetching data: {e}")
        return None

def main():
    """Run all test functions"""
    print("\n=== Testing Alpha Vantage Market Data APIs ===\n")
    
    # Test global quote
    global_quote = test_alpha_vantage_global_quote()
    if global_quote:
        print("✅ Successfully fetched global quote data")
    else:
        print("❌ Failed to fetch global quote data")
    
    # Test time series
    time_series = test_alpha_vantage_time_series()
    if time_series:
        print("✅ Successfully fetched time series data")
    else:
        print("❌ Failed to fetch time series data")
    
    # Test cryptocurrency data
    crypto_data = test_alpha_vantage_crypto()
    if crypto_data:
        print("✅ Successfully fetched cryptocurrency data")
    else:
        print("❌ Failed to fetch cryptocurrency data")
    
    print("\n=== Alpha Vantage Market Data Testing Complete ===\n")

if __name__ == "__main__":
    main() 
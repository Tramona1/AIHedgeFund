import asyncio
import json
import logging
from dotenv import load_dotenv
import sys
import os

# Set DEMO_MODE to True for testing
os.environ["DEMO_MODE"] = "true"

# Add the data-pipeline directory to the Python path
sys.path.append('./apps/data-pipeline')

# Set up logging with a filter to add metadata if not present
class MetadataFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'metadata'):
            record.metadata = '{}'
        return True

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Add our filter to the root logger
logging.getLogger().addFilter(MetadataFilter())

from market_data_fetcher import MarketDataFetcher

# Load environment variables
load_dotenv()

async def test_fetch_market_data():
    """Test fetching market data for a single ticker"""
    logger.info("Testing fetch_market_data for AAPL")
    fetcher = MarketDataFetcher()
    try:
        # Note: fetch_market_data is not async, so don't use await
        data = fetcher.fetch_market_data('AAPL')
        if data:
            print(f"\nFetched market data for AAPL: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        return None
    finally:
        # Only close() is async, so we use await here
        await fetcher.close()

async def test_fetch_top_gainers_losers():
    """Test fetching top gainers and losers"""
    logger.info("Testing fetch_top_gainers_losers")
    fetcher = MarketDataFetcher()
    try:
        # Note: fetch_top_gainers_losers is not async, so don't use await
        data = fetcher.fetch_top_gainers_losers()
        if data:
            print(f"\nFetched top gainers and losers: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        logger.error(f"Error fetching top gainers and losers: {e}")
        return None
    finally:
        # Only close() is async, so we use await here
        await fetcher.close()

async def test_fetch_digital_currency():
    """Test fetching digital currency data"""
    logger.info("Testing fetch_digital_currency for BTC")
    fetcher = MarketDataFetcher()
    try:
        # Note: fetch_digital_currency is not async, so don't use await
        data = fetcher.fetch_digital_currency('BTC')
        if data:
            print(f"\nFetched digital currency data for BTC: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        logger.error(f"Error fetching digital currency data: {e}")
        return None
    finally:
        # Only close() is async, so we use await here
        await fetcher.close()

async def main():
    """Run all test functions"""
    print("\n=== Testing Market Data Fetcher ===\n")
    
    # Test fetch_market_data
    market_data = await test_fetch_market_data()
    if market_data:
        print("✅ Successfully fetched market data")
    else:
        print("❌ Failed to fetch market data")
        
    # Test fetch_top_gainers_losers
    gainers_losers = await test_fetch_top_gainers_losers()
    if gainers_losers:
        print("✅ Successfully fetched top gainers and losers")
    else:
        print("❌ Failed to fetch top gainers and losers")
        
    # Test fetch_digital_currency
    crypto_data = await test_fetch_digital_currency()
    if crypto_data:
        print("✅ Successfully fetched digital currency data")
    else:
        print("❌ Failed to fetch digital currency data")
    
    print("\n=== Market Data Fetcher Testing Complete ===\n")

if __name__ == "__main__":
    asyncio.run(main()) 
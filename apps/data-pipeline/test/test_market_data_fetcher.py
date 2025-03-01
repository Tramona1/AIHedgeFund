import asyncio
import json
import logging
from dotenv import load_dotenv
from market_data_fetcher import MarketDataFetcher

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def test_fetch_market_data():
    """Test fetching market data for a single ticker"""
    logger.info("Testing fetch_market_data for AAPL")
    fetcher = MarketDataFetcher()
    try:
        data = await fetcher.fetch_market_data('AAPL')
        print(f"\nFetched market data for AAPL: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        return None
    finally:
        await fetcher.close()

async def test_fetch_top_gainers_losers():
    """Test fetching top gainers and losers"""
    logger.info("Testing fetch_top_gainers_losers")
    fetcher = MarketDataFetcher()
    try:
        data = await fetcher.fetch_top_gainers_losers()
        print(f"\nFetched top gainers and losers: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        logger.error(f"Error fetching top gainers and losers: {e}")
        return None
    finally:
        await fetcher.close()

async def test_fetch_digital_currency():
    """Test fetching digital currency data"""
    logger.info("Testing fetch_digital_currency for BTC")
    fetcher = MarketDataFetcher()
    try:
        data = await fetcher.fetch_digital_currency('BTC')
        print(f"\nFetched digital currency data for BTC: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        logger.error(f"Error fetching digital currency data: {e}")
        return None
    finally:
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
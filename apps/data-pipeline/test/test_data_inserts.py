import os
import sys
import json
import asyncio
import logging
from datetime import datetime
import time
from dotenv import load_dotenv
import requests
from supabase import create_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("data-insert-tester")

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
FRED_API_KEY = os.getenv("FRED_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Define the tables we'll be testing
MARKET_TABLE = "market_data"
FUNDAMENTALS_TABLE = "fundamental_data"
ECONOMIC_INDICATORS_TABLE = "economic_indicators"
ECONOMIC_NEWS_TABLE = "economic_news"
ECONOMIC_REPORTS_TABLE = "economic_reports"
INTERVIEWS_TABLE = "interviews"
INVESTOR_HOLDINGS_TABLE = "investor_holdings"
HOLDINGS_ALERTS_TABLE = "holdings_alerts"

def print_separator(title):
    """Print a separator with title for better readability"""
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    try:
        # Try to query the table - if it doesn't exist, this will fail
        response = supabase.table(table_name).select("*").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Error checking table {table_name}: {str(e)}")
        return False

async def test_market_data_inserts():
    """Test the market data fetcher's ability to insert data"""
    print_separator("TESTING MARKET DATA INSERTS")
    
    try:
        # Import here to avoid module-level import issues
        from market_data_fetcher import MarketDataFetcher
        
        # Verify the table exists
        if not check_table_exists(MARKET_TABLE):
            print(f"❌ Table {MARKET_TABLE} does not exist or is not accessible")
            return False
        
        # Initialize the fetcher
        fetcher = MarketDataFetcher()
        print("✅ Successfully initialized MarketDataFetcher")
        
        # Test data for a single ticker
        ticker = "AAPL"
        print(f"\nFetching and inserting market data for {ticker}...")
        
        # Fetch the data
        market_data = fetcher.fetch_market_data(ticker)
        
        if not market_data:
            print(f"❌ Failed to fetch market data for {ticker}")
            return False
        
        print(f"✅ Successfully fetched market data for {ticker}")
        print(f"  Price: ${market_data.get('price', 'N/A')}")
        print(f"  Change: {market_data.get('price_change_percent', 'N/A')}%")
        
        # Insert the data
        insert_result = fetcher.insert_data(
            MARKET_TABLE, 
            {
                "ticker": ticker,
                "data": market_data,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        if insert_result:
            print(f"✅ Successfully inserted market data for {ticker} into {MARKET_TABLE}")
            
            # Verify the insertion by checking if the data is retrievable
            response = supabase.table(MARKET_TABLE).select("*").eq("ticker", ticker).order("timestamp", {"ascending": False}).limit(1).execute()
            
            if response.data:
                print(f"✅ Verified data insertion by retrieving the record")
                return True
            else:
                print(f"❌ Could not verify data insertion - no records found")
                return False
        else:
            print(f"❌ Failed to insert market data for {ticker}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing market data inserts: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_fundamental_data_inserts():
    """Test the fundamental analyzer's ability to insert data"""
    print_separator("TESTING FUNDAMENTAL DATA INSERTS")
    
    try:
        # Import here to avoid module-level import issues
        from fundamental_analyzer import FundamentalAnalyzer
        
        # Verify the table exists
        if not check_table_exists(FUNDAMENTALS_TABLE):
            print(f"❌ Table {FUNDAMENTALS_TABLE} does not exist or is not accessible")
            return False
        
        # Initialize the analyzer
        analyzer = FundamentalAnalyzer()
        print("✅ Successfully initialized FundamentalAnalyzer")
        
        # Test data for a single ticker
        ticker = "MSFT"
        print(f"\nFetching and inserting fundamental data for {ticker}...")
        
        # Get company overview
        overview = analyzer.fetch_company_overview(ticker)
        
        if not overview:
            print(f"❌ Failed to fetch company overview for {ticker}")
            return False
        
        print(f"✅ Successfully fetched company overview for {ticker}")
        print(f"  Name: {overview.get('Name', 'N/A')}")
        print(f"  Sector: {overview.get('Sector', 'N/A')}")
        
        # Get income statement (this helps generate more complete insights)
        income_statement = analyzer.fetch_income_statement(ticker)
        
        if not income_statement or "annualReports" not in income_statement:
            print(f"❌ Failed to fetch income statement for {ticker}")
        else:
            print(f"✅ Successfully fetched income statement for {ticker}")
        
        # Prepare data for insertion
        fundamental_data = analyzer.fetch_all_fundamental_data(ticker)
        
        # Generate insights (if possible)
        insights = None
        if GEMINI_API_KEY and fundamental_data:
            try:
                insights = analyzer.generate_insights_with_llm(ticker, fundamental_data)
                if insights:
                    print(f"✅ Generated AI insights for {ticker}")
            except Exception as e:
                print(f"⚠️ Could not generate insights: {str(e)}")
        
        # Insert data
        if fundamental_data:
            insert_data = {
                "ticker": ticker,
                "data": fundamental_data,
                "insights": insights,
                "timestamp": datetime.now().isoformat()
            }
            
            insert_result = analyzer.insert_data(insert_data)
            
            if insert_result:
                print(f"✅ Successfully inserted fundamental data for {ticker} into {FUNDAMENTALS_TABLE}")
                
                # Verify the insertion
                response = supabase.table(FUNDAMENTALS_TABLE).select("*").eq("ticker", ticker).order("timestamp", {"ascending": False}).limit(1).execute()
                
                if response.data:
                    print(f"✅ Verified data insertion by retrieving the record")
                    return True
                else:
                    print(f"❌ Could not verify data insertion - no records found")
                    return False
            else:
                print(f"❌ Failed to insert fundamental data for {ticker}")
                return False
        else:
            print(f"❌ Could not prepare fundamental data for insertion")
            return False
            
    except Exception as e:
        print(f"❌ Error testing fundamental data inserts: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_economic_indicator_inserts():
    """Test the economic indicator fetcher's ability to insert data"""
    print_separator("TESTING ECONOMIC INDICATOR INSERTS")
    
    try:
        # Import here to avoid module-level import issues
        from economic_indicator_fetcher import EconomicIndicatorFetcher
        
        # Verify the tables exist
        if not check_table_exists(ECONOMIC_INDICATORS_TABLE):
            print(f"❌ Table {ECONOMIC_INDICATORS_TABLE} does not exist or is not accessible")
            return False
        
        if not check_table_exists(ECONOMIC_NEWS_TABLE):
            print(f"⚠️ Table {ECONOMIC_NEWS_TABLE} does not exist or is not accessible (news test will be skipped)")
        
        # Initialize the fetcher
        fetcher = EconomicIndicatorFetcher()
        print("✅ Successfully initialized EconomicIndicatorFetcher")
        
        # Test fetching GDP data
        print("\nFetching GDP data...")
        gdp_data = fetcher.fetch_gdp()
        
        if not gdp_data:
            print("❌ Failed to fetch GDP data")
        else:
            print("✅ Successfully fetched GDP data")
            print(f"  Value: {gdp_data.get('value', 'N/A')}")
            print(f"  Date: {gdp_data.get('date', 'N/A')}")
        
        # Test fetching inflation data
        print("\nFetching inflation data...")
        inflation_data = fetcher.fetch_inflation()
        
        if not inflation_data:
            print("❌ Failed to fetch inflation data")
        else:
            print("✅ Successfully fetched inflation data")
            print(f"  Value: {inflation_data.get('value', 'N/A')}%")
            print(f"  Date: {inflation_data.get('date', 'N/A')}")
        
        # Test fetching unemployment data
        print("\nFetching unemployment data...")
        unemployment_data = fetcher.fetch_unemployment()
        
        if not unemployment_data:
            print("❌ Failed to fetch unemployment data")
        else:
            print("✅ Successfully fetched unemployment data")
            print(f"  Value: {unemployment_data.get('value', 'N/A')}%")
            print(f"  Date: {unemployment_data.get('date', 'N/A')}")
        
        # Collect all indicators
        indicators = fetcher.fetch_fred_indicators()
        
        if not indicators or len(indicators) == 0:
            print("❌ Failed to fetch economic indicators")
            return False
        
        print(f"✅ Successfully fetched {len(indicators)} economic indicators")
        
        # Insert the indicators
        insert_result = fetcher.insert_indicators(indicators)
        
        if insert_result:
            print(f"✅ Successfully inserted economic indicators into {ECONOMIC_INDICATORS_TABLE}")
            
            # Verify the insertion
            response = supabase.table(ECONOMIC_INDICATORS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
            
            if response.data:
                print(f"✅ Verified indicator data insertion by retrieving records")
            else:
                print(f"❌ Could not verify indicator data insertion - no records found")
                return False
        else:
            print(f"❌ Failed to insert economic indicators")
            return False
        
        # Test fetching and inserting economic news (if the table exists)
        if check_table_exists(ECONOMIC_NEWS_TABLE):
            print("\nFetching economic news...")
            news = fetcher.fetch_economic_news()
            
            if not news or len(news) == 0:
                print("❌ Failed to fetch economic news")
            else:
                print(f"✅ Successfully fetched {len(news)} economic news items")
                
                # Insert the news
                insert_result = fetcher.insert_news(news)
                
                if insert_result:
                    print(f"✅ Successfully inserted economic news into {ECONOMIC_NEWS_TABLE}")
                    
                    # Verify the insertion
                    response = supabase.table(ECONOMIC_NEWS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
                    
                    if response.data:
                        print(f"✅ Verified news data insertion by retrieving records")
                    else:
                        print(f"❌ Could not verify news data insertion - no records found")
                else:
                    print(f"❌ Failed to insert economic news")
        
        return True
            
    except Exception as e:
        print(f"❌ Error testing economic indicator inserts: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_existing_data():
    """Test for existing data in various tables"""
    print_separator("CHECKING EXISTING DATA IN TABLES")
    
    tables = [
        (MARKET_TABLE, "Market Data"),
        (FUNDAMENTALS_TABLE, "Fundamental Data"),
        (ECONOMIC_INDICATORS_TABLE, "Economic Indicators"),
        (ECONOMIC_NEWS_TABLE, "Economic News"),
        (ECONOMIC_REPORTS_TABLE, "Economic Reports"),
        (INTERVIEWS_TABLE, "Interviews"),
        (INVESTOR_HOLDINGS_TABLE, "Investor Holdings"),
        (HOLDINGS_ALERTS_TABLE, "Holdings Alerts")
    ]
    
    for table_name, description in tables:
        try:
            # Check if table exists and has data
            if check_table_exists(table_name):
                response = supabase.table(table_name).select("*").limit(5).execute()
                
                if response.data and len(response.data) > 0:
                    print(f"✅ {description}: Found {len(response.data)} records")
                    
                    # Print sample data for the first record
                    first_record = response.data[0]
                    print(f"  Sample record:")
                    
                    # Print key fields based on the table type
                    if table_name == MARKET_TABLE:
                        print(f"  Ticker: {first_record.get('ticker', 'N/A')}")
                        print(f"  Timestamp: {first_record.get('timestamp', 'N/A')}")
                        if "data" in first_record and "price" in first_record["data"]:
                            print(f"  Price: ${first_record['data']['price']}")
                    
                    elif table_name == FUNDAMENTALS_TABLE:
                        print(f"  Ticker: {first_record.get('ticker', 'N/A')}")
                        print(f"  Timestamp: {first_record.get('timestamp', 'N/A')}")
                        if "data" in first_record and "overview" in first_record["data"]:
                            print(f"  Company: {first_record['data']['overview'].get('Name', 'N/A')}")
                    
                    elif table_name == ECONOMIC_INDICATORS_TABLE:
                        print(f"  Indicator: {first_record.get('indicator', 'N/A')}")
                        print(f"  Value: {first_record.get('value', 'N/A')}")
                        print(f"  Date: {first_record.get('date', 'N/A')}")
                    
                    elif table_name == ECONOMIC_REPORTS_TABLE:
                        print(f"  Source: {first_record.get('source', 'N/A')}")
                        print(f"  Timestamp: {first_record.get('timestamp', 'N/A')}")
                        print(f"  Subject: {first_record.get('subject', 'N/A')}")
                    
                    elif table_name == INTERVIEWS_TABLE:
                        print(f"  Video ID: {first_record.get('video_id', 'N/A')}")
                        print(f"  Title: {first_record.get('title', 'N/A')}")
                        print(f"  Speaker: {first_record.get('speaker', 'N/A')}")
                    
                    elif table_name == INVESTOR_HOLDINGS_TABLE:
                        print(f"  Investor ID: {first_record.get('investor_id', 'N/A')}")
                        print(f"  Ticker: {first_record.get('ticker', 'N/A')}")
                        print(f"  Shares: {first_record.get('shares', 'N/A')}")
                    
                    elif table_name == HOLDINGS_ALERTS_TABLE:
                        print(f"  Investor: {first_record.get('investor_name', 'N/A')}")
                        print(f"  Ticker: {first_record.get('ticker', 'N/A')}")
                        print(f"  Change Type: {first_record.get('change_type', 'N/A')}")
                else:
                    print(f"⚠️ {description}: No records found")
            else:
                print(f"❌ {description}: Table does not exist or is not accessible")
        except Exception as e:
            print(f"❌ Error checking {description}: {str(e)}")

async def main():
    """Run all the tests"""
    load_dotenv()  # Load environment variables
    
    print("\n🔍 TESTING AI HEDGE FUND DATA INSERTS 🔍\n")
    print("This script will test the data pipeline components' ability")
    print("to fetch real data and correctly insert it into the database.\n")
    
    # First check existing data to understand current state
    test_existing_data()
    
    # Run the individual component tests
    results = {
        "Market Data": await test_market_data_inserts(),
        "Fundamental Data": await test_fundamental_data_inserts(),
        "Economic Indicators": await test_economic_indicator_inserts()
    }
    
    # Print summary
    print_separator("TEST SUMMARY")
    
    all_passed = True
    for component, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        if not result:
            all_passed = False
        print(f"{component}: {status}")
    
    # Overall result
    if all_passed:
        print("\n✅ All data insertion tests passed!")
        print("   The data pipeline components are successfully fetching and storing data.")
    else:
        print("\n❌ Some data insertion tests failed.")
        print("   Review the output above for details on specific components.")

if __name__ == "__main__":
    asyncio.run(main()) 
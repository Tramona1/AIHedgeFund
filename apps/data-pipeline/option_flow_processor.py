import asyncio
import logging
import json
import os
from datetime import datetime, timedelta
import requests
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Set up logger
logger = logging.getLogger(__name__)

# Fix the logging format to avoid the metadata error
logging.basicConfig(
    level=logging.INFO, 
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s"}'
)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

OPTION_FLOW_TABLE = "option_flow_data"

class OptionFlowProcessor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })
        # Note: In a production environment, you would use an actual API or data provider
        # for options data. This is a simplified example.
        self.api_base_url = "https://example.com/options-flow-data"  # Placeholder URL
    
    async def fetch_option_flow(self, ticker):
        """
        Fetch options flow data for a specific ticker.
        
        Note: This is a placeholder implementation. In a real-world scenario,
        you would subscribe to a financial data provider that offers options flow data.
        """
        try:
            # Simulated data for demonstration purposes
            # In reality, you would make API calls to a data provider
            
            # Sample data structure for options flow
            current_date = datetime.now()
            expiry_date = current_date + timedelta(days=30)  # Example: 30 days from now
            
            # Generate some sample options flow data
            flow_data = []
            
            # Example: Call options (bullish)
            flow_data.append({
                "ticker": ticker,
                "contract_type": "call",
                "strike_price": round(100.0 + 5.0, 2),  # Example: strike price above current
                "expiry_date": expiry_date.strftime("%Y-%m-%d"),
                "premium": round(250000.0, 2),  # Example: premium paid
                "contract_size": 500,  # Number of contracts
                "implied_volatility": 0.35,  # Example IV
                "timestamp": (current_date - timedelta(hours=3)).isoformat(),
                "is_sweep": True,  # Example: sweep order (aggressive)
                "is_opening_position": True  # Example: opening new position
            })
            
            # Example: Put options (bearish)
            flow_data.append({
                "ticker": ticker,
                "contract_type": "put",
                "strike_price": round(100.0 - 10.0, 2),  # Example: strike price below current
                "expiry_date": expiry_date.strftime("%Y-%m-%d"),
                "premium": round(180000.0, 2),  # Example: premium paid
                "contract_size": 300,  # Number of contracts
                "implied_volatility": 0.40,  # Example IV
                "timestamp": (current_date - timedelta(hours=1)).isoformat(),
                "is_sweep": False,  # Example: not a sweep order
                "is_opening_position": True  # Example: opening new position
            })
            
            return {
                "ticker": ticker,
                "flow_data": flow_data,
                "date": current_date.strftime("%Y-%m-%d"),
                "current_price": 100.0,  # Example current price
                "timestamp": current_date.isoformat()
            }
        except Exception as e:
            logger.error(f"Error fetching option flow data for {ticker}: {e}")
            return None
    
    def analyze_option_flow(self, data):
        """
        Analyze options flow data for unusual activity or sentiment.
        """
        if not data or not data.get("flow_data"):
            return None
        
        try:
            ticker = data["ticker"]
            flow_data = data["flow_data"]
            current_price = data["current_price"]
            date = data["date"]
            
            # Calculate aggregate metrics
            total_call_premium = sum([item["premium"] for item in flow_data if item["contract_type"] == "call"])
            total_put_premium = sum([item["premium"] for item in flow_data if item["contract_type"] == "put"])
            
            # Calculate call/put ratio based on premium
            call_put_ratio = total_call_premium / total_put_premium if total_put_premium > 0 else float('inf')
            
            # Count sweeps (aggressive orders)
            call_sweeps = sum(1 for item in flow_data if item["contract_type"] == "call" and item["is_sweep"])
            put_sweeps = sum(1 for item in flow_data if item["contract_type"] == "put" and item["is_sweep"])
            
            # Determine sentiment based on call/put ratio
            if call_put_ratio > 2.0:
                sentiment = "bullish"
            elif call_put_ratio < 0.5:
                sentiment = "bearish"
            else:
                sentiment = "neutral"
            
            # Check for unusual activity
            large_premium_threshold = 200000  # Example threshold: $200K
            high_iv_threshold = 0.5  # Example threshold: 50% implied volatility
            
            unusual_calls = [item for item in flow_data if item["contract_type"] == "call" 
                            and (item["premium"] > large_premium_threshold 
                                or item["implied_volatility"] > high_iv_threshold)]
            
            unusual_puts = [item for item in flow_data if item["contract_type"] == "put" 
                           and (item["premium"] > large_premium_threshold 
                               or item["implied_volatility"] > high_iv_threshold)]
            
            # Analysis results
            analysis = {
                "ticker": ticker,
                "date": date,
                "total_call_premium": total_call_premium,
                "total_put_premium": total_put_premium,
                "call_put_ratio": call_put_ratio,
                "call_sweeps": call_sweeps,
                "put_sweeps": put_sweeps,
                "sentiment": sentiment,
                "unusual_call_count": len(unusual_calls),
                "unusual_put_count": len(unusual_puts),
                "has_unusual_activity": len(unusual_calls) > 0 or len(unusual_puts) > 0,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            return analysis
        except Exception as e:
            logger.error(f"Error analyzing option flow data: {e}")
            return None
    
    def store_option_flow_analysis(self, analysis):
        """
        Store options flow analysis in Supabase database.
        """
        if not analysis:
            return False
        
        try:
            # Check if entry for this ticker and date already exists
            existing = supabase.table(OPTION_FLOW_TABLE) \
                .select("id") \
                .eq("ticker", analysis["ticker"]) \
                .eq("date", analysis["date"]) \
                .execute()
            
            if not existing.data or len(existing.data) == 0:
                # Insert new analysis
                supabase.table(OPTION_FLOW_TABLE).insert(analysis).execute()
                logger.info(f"Inserted new option flow analysis for {analysis['ticker']}")
                return True
            else:
                # Update existing analysis
                supabase.table(OPTION_FLOW_TABLE) \
                    .update(analysis) \
                    .eq("ticker", analysis["ticker"]) \
                    .eq("date", analysis["date"]) \
                    .execute()
                logger.info(f"Updated option flow analysis for {analysis['ticker']}")
                return True
            
        except Exception as e:
            logger.error(f"Error storing option flow analysis: {e}")
            return False
    
    async def run(self, tickers):
        """
        Process options flow data for a list of tickers.
        """
        successful_tickers = 0
        
        for ticker in tickers:
            logger.info(f"Processing option flow data for {ticker}")
            
            data = await self.fetch_option_flow(ticker)
            if data:
                analysis = self.analyze_option_flow(data)
                if analysis:
                    success = self.store_option_flow_analysis(analysis)
                    if success:
                        successful_tickers += 1
            
            # Avoid rate limiting
            await asyncio.sleep(1)
        
        logger.info(f"Completed option flow processing: {successful_tickers}/{len(tickers)} tickers successfully processed")
        return successful_tickers
    
    def close(self):
        """Close the session."""
        if self.session:
            self.session.close()

async def main():
    processor = OptionFlowProcessor()
    try:
        # Example list of tickers to process
        # In practice, you might get this from database or configuration
        tickers = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"]
        successful_count = await processor.run(tickers)
        print(f"\n✅ Successfully processed option flow data for {successful_count}/{len(tickers)} tickers")
        if successful_count == len(tickers):
            print("✅ All tickers were processed successfully!")
        elif successful_count > 0:
            print("⚠️ Some tickers were successfully processed, but there were issues with others.")
        else:
            print("❌ Failed to process any tickers. Check the logs for details.")
    finally:
        processor.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main()) 
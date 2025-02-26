import asyncio
import logging
import json
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import yfinance as yf
from pandas_ta import macd, rsi
import pandas as pd

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}')

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

MARKET_TABLE = "market_data"

class MarketDataFetcher:
    def __init__(self):
        pass  # No session needed for yfinance

    def fetch_market_data(self, ticker):
        """Fetches market data using yfinance and calculates technical indicators."""
        try:
            stock = yf.Ticker(ticker)
            # Fetch 1 day of 5-minute intraday data
            df = stock.history(period="1d", interval="5m")
            if df.empty:
                logger.warning(f"No data available for {ticker}", extra={"metadata": {"ticker": ticker}})
                return None

            macd_values = macd(df["Close"])
            rsi_values = rsi(df["Close"])
            latest = df.iloc[-1]
            return {
                "ticker": ticker,
                "macd": macd_values.iloc[-1].to_dict() if not macd_values.empty else {},
                "rsi": rsi_values.iloc[-1] if not rsi_values.empty else 0,
                "price": latest["Close"],
                "volume": latest["Volume"],
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error fetching {ticker} from Yahoo Finance: {e}", extra={"metadata": {"ticker": ticker}})
            return None

    def insert_into_supabase(self, data):
        try:
            existing = supabase.table(MARKET_TABLE).select("ticker").eq("ticker", data["ticker"]).execute()
            if not existing.data or len(existing.data) == 0:
                supabase.table(MARKET_TABLE).insert(data).execute()
                logger.info(f"Inserted market data for {data['ticker']}", extra={"metadata": {"ticker": data["ticker"]}})
            else:
                # Update existing data
                supabase.table(MARKET_TABLE).update(data).eq("ticker", data["ticker"]).execute()
                logger.info(f"Updated market data for {data['ticker']}", extra={"metadata": {"ticker": data["ticker"]}})
        except Exception as e:
            logger.error(f"Error inserting market data: {e}", extra={"metadata": {}})

    async def run(self, tickers):
        loop = asyncio.get_event_loop()
        tasks = []
        for ticker in tickers:
            tasks.append(loop.run_in_executor(None, self.fetch_market_data, ticker))
        
        results = await asyncio.gather(*tasks)
        for result in results:
            if result:
                self.insert_into_supabase(result)
        logger.info(f"Completed market data fetch for {len(tickers)} tickers", extra={"metadata": {"count": len(tickers)}})

    async def close(self):
        pass  # No session to close

async def main():
    fetcher = MarketDataFetcher()
    try:
        # Fetch tickers from Supabase or config (e.g., from SEC filings)
        tickers = ["AAPL", "NVDA", "MSFT"]  # Replace with dynamic fetch from database
        await fetcher.run(tickers)
    finally:
        await fetcher.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main()) 
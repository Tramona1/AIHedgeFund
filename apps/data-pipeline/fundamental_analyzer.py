import logging
import json
import os
from datetime import datetime
import time
from supabase import create_client
from dotenv import load_dotenv
import requests
import pandas as pd
import google.generativeai as genai

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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Google Gemini API
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Table in Supabase
FUNDAMENTALS_TABLE = "fundamental_data"

class FundamentalAnalyzer:
    def __init__(self):
        self.last_request_time = 0
        self.min_request_interval = 12  # Alpha Vantage free tier is 5 calls per minute
        self.alpha_vantage_url = "https://www.alphavantage.co/query"
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("FundamentalAnalyzer initialized")
        
    def fetch_with_rate_limit(self, url, params=None):
        """Make API requests with rate limiting to respect API provider limits"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        # If we've made a request too recently, sleep to respect rate limits
        if time_since_last_request < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last_request
            logger.info(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        # Make the request
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()  # Raise exception for 4XX/5XX responses
            
            # Update last request time
            self.last_request_time = time.time()
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}", extra={"metadata": {}})
            return None

    def fetch_income_statement(self, ticker):
        """Fetch income statement data from Alpha Vantage"""
        logger.info(f"Fetching income statement for {ticker}")
        
        # Fetch income statement
        params = {
            "function": "INCOME_STATEMENT",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not data or "annualReports" not in data:
            logger.error(f"Failed to fetch income statement for {ticker}", extra={"metadata": {"ticker": ticker}})
            return None
        
        # Get the most recent annual report
        annual_reports = data.get("annualReports", [])
        if not annual_reports:
            return None
        
        # Return both quarterly and annual reports for more context
        return {
            "annual": annual_reports,
            "quarterly": data.get("quarterlyReports", [])
        }

    def fetch_balance_sheet(self, ticker):
        """Fetch balance sheet data from Alpha Vantage"""
        logger.info(f"Fetching balance sheet for {ticker}")
        
        # Fetch balance sheet
        params = {
            "function": "BALANCE_SHEET",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not data or "annualReports" not in data:
            logger.error(f"Failed to fetch balance sheet for {ticker}", extra={"metadata": {"ticker": ticker}})
            return None
        
        # Get the most recent annual report
        annual_reports = data.get("annualReports", [])
        if not annual_reports:
            return None
        
        # Return both quarterly and annual reports for more context
        return {
            "annual": annual_reports,
            "quarterly": data.get("quarterlyReports", [])
        }

    def fetch_cash_flow(self, ticker):
        """Fetch cash flow data from Alpha Vantage"""
        logger.info(f"Fetching cash flow for {ticker}")
        
        # Fetch cash flow
        params = {
            "function": "CASH_FLOW",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not data or "annualReports" not in data:
            logger.error(f"Failed to fetch cash flow for {ticker}", extra={"metadata": {"ticker": ticker}})
            return None
        
        # Get the most recent annual report
        annual_reports = data.get("annualReports", [])
        if not annual_reports:
            return None
        
        # Return both quarterly and annual reports for more context
        return {
            "annual": annual_reports,
            "quarterly": data.get("quarterlyReports", [])
        }

    def fetch_company_overview(self, ticker):
        """Fetch company overview from Alpha Vantage"""
        logger.info(f"Fetching company overview for {ticker}")
        
        # Fetch company overview
        params = {
            "function": "OVERVIEW",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        
        data = self.fetch_with_rate_limit(self.alpha_vantage_url, params)
        
        if not data or "Symbol" not in data:
            logger.error(f"Failed to fetch company overview for {ticker}", extra={"metadata": {"ticker": ticker}})
            return None
        
        return data

    def fetch_all_fundamental_data(self, ticker):
        """Fetch all fundamental data for a ticker from Alpha Vantage"""
        logger.info(f"Fetching all fundamental data for {ticker}")
        
        # Fetch all data types
        overview = self.fetch_company_overview(ticker)
        income_statement = self.fetch_income_statement(ticker)
        balance_sheet = self.fetch_balance_sheet(ticker)
        cash_flow = self.fetch_cash_flow(ticker)
        
        # Check if we got any data
        if not overview and not income_statement and not balance_sheet and not cash_flow:
            logger.error(f"No fundamental data retrieved for {ticker}", extra={"metadata": {"ticker": ticker}})
            return None
        
        # Combine the data
        result = {
            "ticker": ticker,
            "overview": overview,
            "income_statement": income_statement,
            "balance_sheet": balance_sheet,
            "cash_flow": cash_flow,
            "timestamp": datetime.now().isoformat()
        }
        
        return result
        
    def get_previous_fundamentals(self, ticker):
        """Get previously stored fundamental data for comparison"""
        try:
            response = self.supabase.table(FUNDAMENTALS_TABLE).select("*").eq("ticker", ticker).order("timestamp", {"ascending": False}).limit(1).execute()
            
            if not response.data or len(response.data) == 0:
                return None
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error fetching previous fundamentals: {e}", extra={"metadata": {"ticker": ticker}})
            return None

    def generate_insights_with_llm(self, ticker, current_data, previous_data=None):
        """Generate insights from fundamental data using Google's Gemini API"""
        if not GEMINI_API_KEY:
            logger.warning("No GEMINI_API_KEY provided. Skipping insights generation.")
            return "No API key provided for analysis."
        
        try:
            # Extract key metrics for the prompt
            overview = current_data.get("overview", {})
            latest_income = current_data.get("income_statement", {}).get("annual", [])[0] if current_data.get("income_statement", {}) and current_data.get("income_statement", {}).get("annual", []) else {}
            latest_balance = current_data.get("balance_sheet", {}).get("annual", [])[0] if current_data.get("balance_sheet", {}) and current_data.get("balance_sheet", {}).get("annual", []) else {}
            latest_cash_flow = current_data.get("cash_flow", {}).get("annual", [])[0] if current_data.get("cash_flow", {}) and current_data.get("cash_flow", {}).get("annual", []) else {}
            
            # Create a summary of key metrics
            metrics_summary = {
                "Company": ticker,
                "Sector": overview.get("Sector", "Unknown"),
                "Industry": overview.get("Industry", "Unknown"),
                "Market Cap": overview.get("MarketCapitalization", "Unknown"),
                "PE Ratio": overview.get("PERatio", "Unknown"),
                "EPS": overview.get("EPS", "Unknown"),
                "Revenue": latest_income.get("totalRevenue", "Unknown"),
                "Net Income": latest_income.get("netIncome", "Unknown"),
                "Profit Margin": overview.get("ProfitMargin", "Unknown"),
                "Total Assets": latest_balance.get("totalAssets", "Unknown"),
                "Total Liabilities": latest_balance.get("totalLiabilities", "Unknown"),
                "Operating Cash Flow": latest_cash_flow.get("operatingCashflow", "Unknown"),
                "Dividend Yield": overview.get("DividendYield", "Unknown"),
                "52 Week High": overview.get("52WeekHigh", "Unknown"),
                "52 Week Low": overview.get("52WeekLow", "Unknown"),
                "50 Day Moving Average": overview.get("50DayMovingAverage", "Unknown"),
                "200 Day Moving Average": overview.get("200DayMovingAverage", "Unknown"),
                "Beta": overview.get("Beta", "Unknown")
            }
            
            # Format the metrics into a string for the prompt
            metrics_str = "\n".join([f"{k}: {v}" for k, v in metrics_summary.items()])
            
            # Get models available
            model = "gemini-2.0"
            
            prompt = f"""
            Analyze the following fundamental data for {ticker} ({overview.get('Name', 'Unknown')}) and provide investment insights.
            
            KEY METRICS:
            {metrics_str}
            
            ANALYSIS TASKS:
            1. Summarize the company's current financial health based on these metrics
            2. Identify key strengths and weaknesses
            3. Analyze growth potential and risks
            4. Evaluate profitability trends
            5. Evaluate the company's debt and liquidity position
            6. Provide a short-term (3-6 months) and long-term (1-3 years) outlook
            7. Compare to industry benchmarks if possible
            8. Suggest a reasonable investment strategy (buy, hold, sell) with brief justification
            
            Format your response as a concise investment analysis report with clear sections. Keep it under 800 words.
            """
            
            # Generate response with Gemini
            generation_config = {
                "temperature": 0.2,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
            
            model = genai.GenerativeModel(
                model_name=model,
                generation_config=generation_config
            )
            
            response = model.generate_content(prompt)
            insights = response.text
            
            return insights
        
        except Exception as e:
            logger.error(f"Error generating insights: {e}", extra={"metadata": {"ticker": ticker}})
            return f"Error generating insights: {str(e)}"

    def insert_data(self, data):
        """Insert fundamental data into Supabase"""
        try:
            if not data:
                logger.warning("No data to insert")
                return False
            
            # Check if there's already data for this ticker
            response = self.supabase.table(FUNDAMENTALS_TABLE).select("ticker").eq("ticker", data["ticker"]).execute()
            
            if response.data and len(response.data) > 0:
                # Update existing record
                result = self.supabase.table(FUNDAMENTALS_TABLE).update(data).eq("ticker", data["ticker"]).execute()
                logger.info(f"Updated fundamental data for {data['ticker']}")
            else:
                # Insert new record
                result = self.supabase.table(FUNDAMENTALS_TABLE).insert(data).execute()
                logger.info(f"Inserted fundamental data for {data['ticker']}")
            
            return True
        except Exception as e:
            logger.error(f"Error inserting fundamental data: {e}", extra={"metadata": {}})
            return False

    def run(self, tickers):
        """Run the fundamental analyzer for multiple tickers"""
        logger.info(f"Running fundamental analysis for {len(tickers)} tickers")
        
        results = []
        success_count = 0
        
        for ticker in tickers:
            try:
                # Fetch fundamental data
                fundamental_data = self.fetch_all_fundamental_data(ticker)
                
                if not fundamental_data:
                    logger.warning(f"No fundamental data to analyze for {ticker}")
                    continue
                
                # Get previous data for comparison
                previous_data = self.get_previous_fundamentals(ticker)
                
                # Generate insights
                insights = self.generate_insights_with_llm(ticker, fundamental_data, previous_data)
                
                # Add insights to the data
                fundamental_data["insights"] = insights
                
                # Insert data into Supabase
                if self.insert_data(fundamental_data):
                    success_count += 1
                    results.append({
                        "ticker": ticker,
                        "status": "success",
                        "insights_generated": bool(insights)
                    })
                else:
                    results.append({
                        "ticker": ticker,
                        "status": "failed",
                        "error": "Failed to insert data"
                    })
            except Exception as e:
                logger.error(f"Error analyzing {ticker}: {e}", extra={"metadata": {"ticker": ticker}})
                results.append({
                    "ticker": ticker,
                    "status": "failed",
                    "error": str(e)
                })
            
            # Sleep between tickers to avoid hitting API rate limits
            time.sleep(self.min_request_interval)
        
        logger.info(f"Fundamental analysis completed. Processed {len(tickers)} tickers with {success_count} successes.")
        return results

def main():
    """Run the fundamental analyzer as a standalone script"""
    # Default tickers to track (keep small for testing)
    default_tickers = ["AAPL", "MSFT", "GOOGL"]
    
    # Get tickers from environment variable or use defaults
    tickers_env = os.getenv("TRACKED_TICKERS")
    tickers = tickers_env.split(",") if tickers_env else default_tickers
    
    # Create the analyzer
    analyzer = FundamentalAnalyzer()
    
    # Run the analyzer
    results = analyzer.run(tickers)
    
    # Print results
    for result in results:
        status_display = "✅" if result["status"] == "success" else "❌"
        print(f"{status_display} {result['ticker']}: {result['status']}")

if __name__ == "__main__":
    main() 
import logging
import json
import os
from datetime import datetime, timedelta
import time
from supabase import create_client
from dotenv import load_dotenv
import requests
import pandas as pd
import pandas_datareader.data as web
from textblob import TextBlob

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
FRED_API_KEY = os.getenv("FRED_API_KEY")

# Table in Supabase
ECONOMIC_INDICATORS_TABLE = "economic_indicators"
ECONOMIC_NEWS_TABLE = "economic_news"

class EconomicIndicatorFetcher:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        
    def fetch_with_rate_limit(self, url, params=None):
        """Make API request with rate limiting and retries"""
        max_retries = 3
        retry_delay = 60  # Alpha Vantage has a limit of 5 requests per minute on free tier
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, params=params, timeout=10)
                response.raise_for_status()
                
                # Check if we've hit the API rate limit
                if "Thank you for using Alpha Vantage" in response.text and "Our standard API rate limit" in response.text:
                    logger.warning(f"Rate limit hit. Waiting {retry_delay} seconds before retry.")
                    time.sleep(retry_delay)
                    continue
                    
                return response.json()
            except requests.RequestException as e:
                logger.error(f"Request failed (attempt {attempt+1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    raise

    def fetch_gdp(self):
        """Fetch GDP data from Alpha Vantage"""
        logger.info("Fetching GDP data")
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "REAL_GDP",
                "interval": "quarterly",
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            
            data = self.fetch_with_rate_limit(url, params)
            
            if "data" not in data or not data["data"]:
                logger.warning("No GDP data available")
                return None
                
            return {
                "name": "GDP",
                "description": "Gross Domestic Product (GDP)",
                "unit": data.get("unit", ""),
                "data": data.get("data", [])[:12]  # Last 3 years quarterly
            }
        except Exception as e:
            logger.error(f"Error fetching GDP data: {str(e)}")
            return None

    def fetch_inflation(self):
        """Fetch inflation (CPI) data from Alpha Vantage"""
        logger.info("Fetching inflation data")
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "CPI",
                "interval": "monthly",
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            
            data = self.fetch_with_rate_limit(url, params)
            
            if "data" not in data or not data["data"]:
                logger.warning("No inflation (CPI) data available")
                return None
                
            return {
                "name": "CPI",
                "description": "Consumer Price Index (Inflation)",
                "unit": data.get("unit", ""),
                "data": data.get("data", [])[:12]  # Last 12 months
            }
        except Exception as e:
            logger.error(f"Error fetching inflation data: {str(e)}")
            return None

    def fetch_unemployment(self):
        """Fetch unemployment data from Alpha Vantage"""
        logger.info("Fetching unemployment data")
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "UNEMPLOYMENT",
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            
            data = self.fetch_with_rate_limit(url, params)
            
            if "data" not in data or not data["data"]:
                logger.warning("No unemployment data available")
                return None
                
            return {
                "name": "UNEMPLOYMENT",
                "description": "Unemployment Rate",
                "unit": data.get("unit", ""),
                "data": data.get("data", [])[:12]  # Last 12 months
            }
        except Exception as e:
            logger.error(f"Error fetching unemployment data: {str(e)}")
            return None

    def fetch_interest_rates(self):
        """Fetch interest rate data from Alpha Vantage"""
        logger.info("Fetching interest rate data")
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "FEDERAL_FUNDS_RATE",
                "interval": "monthly",
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            
            data = self.fetch_with_rate_limit(url, params)
            
            if "data" not in data or not data["data"]:
                logger.warning("No interest rate data available")
                return None
                
            return {
                "name": "FEDERAL_FUNDS_RATE",
                "description": "Federal Funds Rate",
                "unit": data.get("unit", ""),
                "data": data.get("data", [])[:12]  # Last 12 months
            }
        except Exception as e:
            logger.error(f"Error fetching interest rate data: {str(e)}")
            return None

    def fetch_retail_sales(self):
        """Fetch retail sales data from Alpha Vantage"""
        logger.info("Fetching retail sales data")
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "RETAIL_SALES",
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            
            data = self.fetch_with_rate_limit(url, params)
            
            if "data" not in data or not data["data"]:
                logger.warning("No retail sales data available")
                return None
                
            return {
                "name": "RETAIL_SALES",
                "description": "Retail Sales",
                "unit": data.get("unit", ""),
                "data": data.get("data", [])[:12]  # Last 12 months
            }
        except Exception as e:
            logger.error(f"Error fetching retail sales data: {str(e)}")
            return None

    def fetch_fred_indicators(self):
        """Fetch additional indicators from FRED if API key is available"""
        if not FRED_API_KEY:
            logger.warning("No FRED API key provided, skipping FRED indicators")
            return {}
            
        logger.info("Fetching indicators from FRED")
        indicators = {}
        
        try:
            # Define indicators to fetch
            fred_indicators = {
                'INDPRO': 'Industrial Production Index',
                'HOUST': 'Housing Starts',
                'DCOILWTICO': 'Crude Oil Prices',
                'DGS10': '10-Year Treasury Constant Maturity Rate',
                'VIXCLS': 'CBOE Volatility Index (VIX)'
            }
            
            # Set date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=365)  # 1 year of data
            
            for code, description in fred_indicators.items():
                try:
                    # Fetch data from FRED
                    df = web.DataReader(code, 'fred', start_date, end_date, api_key=FRED_API_KEY)
                    
                    if df.empty:
                        logger.warning(f"No data available for {code}")
                        continue
                        
                    # Convert data to list of dictionaries
                    data_points = []
                    for date, value in df.itertuples():
                        if pd.notnull(value):  # Skip NaN values
                            data_points.append({
                                "date": date.strftime("%Y-%m-%d"),
                                "value": str(value)
                            })
                    
                    indicators[code] = {
                        "name": code,
                        "description": description,
                        "unit": "",  # FRED doesn't provide units consistently
                        "data": data_points
                    }
                    
                    logger.info(f"Successfully fetched {code} data from FRED")
                    
                except Exception as e:
                    logger.error(f"Error fetching {code} from FRED: {str(e)}")
                    continue
                    
                # Wait to avoid hitting API rate limit
                time.sleep(1)
                
            return indicators
            
        except Exception as e:
            logger.error(f"Error fetching FRED indicators: {str(e)}")
            return {}

    def fetch_economic_news(self):
        """Fetch economic news from Alpha Vantage"""
        logger.info("Fetching economic news")
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "NEWS_SENTIMENT",
                "topics": "economy,economic,inflation,fed,interest_rates,gdp",
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            
            data = self.fetch_with_rate_limit(url, params)
            
            if "feed" not in data or not data["feed"]:
                logger.warning("No economic news available")
                return None
                
            # Process news and add sentiment analysis
            processed_news = []
            for item in data.get("feed", [])[:20]:  # Process top 20 news items
                title = item.get("title", "")
                
                # Perform simple sentiment analysis using TextBlob
                sentiment = TextBlob(title).sentiment.polarity
                sentiment_label = "positive" if sentiment > 0.1 else "negative" if sentiment < -0.1 else "neutral"
                
                processed_news.append({
                    "title": title,
                    "url": item.get("url", ""),
                    "time_published": item.get("time_published", ""),
                    "authors": item.get("authors", []),
                    "summary": item.get("summary", ""),
                    "source": item.get("source", ""),
                    "sentiment_score": sentiment,
                    "sentiment_label": sentiment_label
                })
            
            return processed_news
        except Exception as e:
            logger.error(f"Error fetching economic news: {str(e)}")
            return None

    def insert_indicators(self, indicators):
        """Insert indicators into Supabase table"""
        if not indicators:
            logger.warning("No indicators to insert")
            return
            
        timestamp = datetime.now().isoformat()
        
        try:
            data_to_insert = {
                "indicators": indicators,
                "timestamp": timestamp
            }
            
            # Check if we should update or insert
            result = self.supabase.table(ECONOMIC_INDICATORS_TABLE).select("id").limit(1).execute()
            
            if result.data:
                # Update the existing record
                record_id = result.data[0]["id"]
                result = self.supabase.table(ECONOMIC_INDICATORS_TABLE).update(data_to_insert).eq("id", record_id).execute()
                logger.info(f"Updated economic indicators record (id: {record_id})")
            else:
                # Insert new record
                result = self.supabase.table(ECONOMIC_INDICATORS_TABLE).insert(data_to_insert).execute()
                logger.info("Inserted new economic indicators record")
                
            return result
        except Exception as e:
            logger.error(f"Error inserting indicators: {str(e)}")
            return None

    def insert_news(self, news):
        """Insert news into Supabase table"""
        if not news:
            logger.warning("No news to insert")
            return
            
        timestamp = datetime.now().isoformat()
        
        try:
            data_to_insert = {
                "news": news,
                "timestamp": timestamp
            }
            
            # We'll always create a new record for news since it's time-dependent
            result = self.supabase.table(ECONOMIC_NEWS_TABLE).insert(data_to_insert).execute()
            logger.info("Inserted new economic news record")
                
            return result
        except Exception as e:
            logger.error(f"Error inserting news: {str(e)}")
            return None

    def run(self):
        """Run the economic indicator fetcher to collect all data"""
        logger.info("Running economic indicator fetcher")
        
        try:
            # Collect indicators from Alpha Vantage
            indicators = {}
            
            # GDP
            gdp_data = self.fetch_gdp()
            if gdp_data:
                indicators["gdp"] = gdp_data
            time.sleep(15)  # Wait to avoid hitting API rate limit
            
            # Inflation
            inflation_data = self.fetch_inflation()
            if inflation_data:
                indicators["inflation"] = inflation_data
            time.sleep(15)
            
            # Unemployment
            unemployment_data = self.fetch_unemployment()
            if unemployment_data:
                indicators["unemployment"] = unemployment_data
            time.sleep(15)
            
            # Interest rates
            interest_rate_data = self.fetch_interest_rates()
            if interest_rate_data:
                indicators["interest_rates"] = interest_rate_data
            time.sleep(15)
            
            # Retail sales
            retail_sales_data = self.fetch_retail_sales()
            if retail_sales_data:
                indicators["retail_sales"] = retail_sales_data
            time.sleep(15)
            
            # FRED indicators
            fred_indicators = self.fetch_fred_indicators()
            if fred_indicators:
                indicators.update(fred_indicators)
            
            # Insert all indicators
            self.insert_indicators(indicators)
            
            # Economic news
            economic_news = self.fetch_economic_news()
            if economic_news:
                self.insert_news(economic_news)
            
            logger.info("Economic indicator fetcher completed successfully")
            
        except Exception as e:
            logger.error(f"Error running economic indicator fetcher: {str(e)}")

def main():
    fetcher = EconomicIndicatorFetcher()
    fetcher.run()

if __name__ == "__main__":
    main() 
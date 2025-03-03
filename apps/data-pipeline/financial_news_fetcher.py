#!/usr/bin/env python3
"""
Financial News Fetcher

This module fetches financial news from various sources including:
1. Financial news APIs (Alpha Vantage, Finnhub)
2. RSS feeds from major financial news sites
3. Web scraping for specialized financial content

It processes the news articles to:
- Extract relevant content
- Determine sentiment
- Identify mentioned stock symbols
- Categorize by topics
- Store in the Supabase database
"""

import asyncio
import logging
import json
import os
import time
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

import aiohttp
import feedparser
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
import google.generativeai as genai
from dateutil import parser as date_parser

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("financial_news_fetcher")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
FINANCIAL_NEWS_TABLE = "financial_news"

# API Keys
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Set up AI for content analysis
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Create data directory if it doesn't exist
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
STOCK_TICKERS_FILE = os.path.join(DATA_DIR, "stock_tickers.json")
os.makedirs(DATA_DIR, exist_ok=True)

# RSS Feeds of major financial news sources
FINANCIAL_RSS_FEEDS = [
    {"name": "CNBC", "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html", "category": "general"},
    {"name": "MarketWatch", "url": "http://feeds.marketwatch.com/marketwatch/topstories/", "category": "general"},
    {"name": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex", "category": "general"},
    {"name": "WSJ Markets", "url": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", "category": "markets"},
    {"name": "Seeking Alpha", "url": "https://seekingalpha.com/feed.xml", "category": "analysis"},
    {"name": "Barron's", "url": "https://www.barrons.com/articles/rssfeed", "category": "analysis"},
    {"name": "Bloomberg", "url": "https://feeds.bloomberg.com/markets/news.rss", "category": "markets"},
]

class FinancialNewsFetcher:
    def __init__(self):
        # Initialize Supabase client
        if SUPABASE_URL and SUPABASE_KEY:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        else:
            logger.error("Supabase credentials are missing.")
            self.supabase = None
        
        # Stock tickers for identifying mentioned symbols
        self.stock_tickers = self._load_stock_tickers()
        
        # Initialize AI model for content analysis if API key is available
        self.model = None
        if GEMINI_API_KEY:
            try:
                self.model = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini AI model initialized for content analysis")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini AI model: {e}")
    
    async def run(self):
        """Main method to run the financial news fetcher"""
        logger.info("Starting financial news fetching process")
        
        try:
            # Fetch news from all available sources
            await self.fetch_from_rss_feeds()
            
            if ALPHA_VANTAGE_API_KEY:
                await self.fetch_from_alpha_vantage()
            
            if FINNHUB_API_KEY:
                await self.fetch_from_finnhub()
            
            if NEWS_API_KEY:
                await self.fetch_from_news_api()
            
            # Additional web scraping for specialized content
            await self.scrape_specialized_content()
            
            logger.info("Financial news fetching process completed")
            return True
        except Exception as e:
            logger.error(f"Error in financial news fetching process: {e}")
            return False
    
    async def fetch_from_rss_feeds(self):
        """Fetch news from RSS feeds of major financial news sources"""
        logger.info("Fetching news from RSS feeds")
        
        news_items = []
        for feed_info in FINANCIAL_RSS_FEEDS:
            try:
                feed = feedparser.parse(feed_info["url"])
                logger.info(f"Found {len(feed.entries)} articles from {feed_info['name']}")
                
                for entry in feed.entries[:20]:  # Limit to 20 most recent entries per feed
                    # Parse publication date
                    try:
                        if hasattr(entry, 'published'):
                            publish_date = date_parser.parse(entry.published)
                        elif hasattr(entry, 'pubDate'):
                            publish_date = date_parser.parse(entry.pubDate)
                        else:
                            publish_date = datetime.now()
                    except:
                        publish_date = datetime.now()
                    
                    # Skip articles older than 2 days
                    if publish_date < datetime.now() - timedelta(days=2):
                        continue
                    
                    # Create news item
                    news_item = {
                        "title": entry.title,
                        "url": entry.link,
                        "source": feed_info["name"],
                        "publish_date": publish_date.isoformat(),
                        "content": entry.summary if hasattr(entry, 'summary') else "",
                        "topics": [feed_info["category"]]
                    }
                    
                    # Check if article already exists in database
                    if await self._news_exists(news_item["url"]):
                        logger.debug(f"Article already exists: {news_item['title']}")
                        continue
                    
                    # Process full content if summary is too short
                    if len(news_item["content"]) < 200:
                        full_content = await self._fetch_article_content(news_item["url"])
                        if full_content:
                            news_item["content"] = full_content
                    
                    news_items.append(news_item)
            except Exception as e:
                logger.error(f"Error processing feed {feed_info['name']}: {e}")
        
        # Process all collected news items
        for news_item in news_items:
            await self.process_news_item(news_item)
    
    async def fetch_from_alpha_vantage(self):
        """Fetch news from Alpha Vantage News API"""
        logger.info("Fetching news from Alpha Vantage")
        
        try:
            # Alpha Vantage News Sentiment API
            url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey={ALPHA_VANTAGE_API_KEY}&tickers=MARKET&sort=LATEST"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'feed' in data:
                    articles = data['feed']
                    logger.info(f"Found {len(articles)} articles from Alpha Vantage")
                    
                    for article in articles:
                        # Check if article already exists
                        if await self._news_exists(article.get('url')):
                            continue
                        
                        # Create news item
                        news_item = {
                            "title": article.get('title'),
                            "url": article.get('url'),
                            "source": article.get('source'),
                            "publish_date": article.get('time_published', datetime.now().isoformat()),
                            "content": article.get('summary', ''),
                            "sentiment": article.get('overall_sentiment_score'),
                            "symbols": [ticker.get('ticker') for ticker in article.get('ticker_sentiment', [])],
                            "topics": article.get('topics', [])
                        }
                        
                        await self.process_news_item(news_item)
                else:
                    logger.warning("No articles found in Alpha Vantage response")
            else:
                logger.error(f"Alpha Vantage API error: {response.status_code}, {response.text}")
                
        except Exception as e:
            logger.error(f"Error fetching news from Alpha Vantage: {e}")
    
    async def fetch_from_finnhub(self):
        """Fetch news from Finnhub"""
        logger.info("Fetching news from Finnhub")
        
        try:
            # Calculate date range (last 2 days)
            to_date = datetime.now().strftime('%Y-%m-%d')
            from_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
            
            url = f"https://finnhub.io/api/v1/news?category=general&from={from_date}&to={to_date}&token={FINNHUB_API_KEY}"
            response = requests.get(url)
            
            if response.status_code == 200:
                articles = response.json()
                logger.info(f"Found {len(articles)} articles from Finnhub")
                
                for article in articles:
                    # Check if article already exists
                    if await self._news_exists(article.get('url')):
                        continue
                    
                    # Create news item
                    news_item = {
                        "title": article.get('headline'),
                        "url": article.get('url'),
                        "source": article.get('source'),
                        "publish_date": datetime.fromtimestamp(article.get('datetime', 0)).isoformat(),
                        "content": article.get('summary', ''),
                        "symbols": article.get('related', '').split(',') if article.get('related') else [],
                        "topics": ["general"]
                    }
                    
                    await self.process_news_item(news_item)
            else:
                logger.error(f"Finnhub API error: {response.status_code}, {response.text}")
                
        except Exception as e:
            logger.error(f"Error fetching news from Finnhub: {e}")
    
    async def fetch_from_news_api(self):
        """Fetch news from News API"""
        logger.info("Fetching news from News API")
        
        try:
            # Calculate date (last 2 days)
            from_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
            
            # Business news with financial keywords
            url = (
                f"https://newsapi.org/v2/everything?q=finance OR stocks OR investing OR economy OR market&"
                f"domains=wsj.com,bloomberg.com,cnbc.com,reuters.com,ft.com,investors.com,marketwatch.com,barrons.com&"
                f"from={from_date}&language=en&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
            )
            
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'ok' and 'articles' in data:
                    articles = data['articles']
                    logger.info(f"Found {len(articles)} articles from News API")
                    
                    for article in articles:
                        # Check if article already exists
                        if await self._news_exists(article.get('url')):
                            continue
                        
                        # Create news item
                        news_item = {
                            "title": article.get('title'),
                            "url": article.get('url'),
                            "source": article.get('source', {}).get('name'),
                            "publish_date": article.get('publishedAt'),
                            "content": article.get('description', '') + "\n\n" + article.get('content', ''),
                            "topics": ["general"]
                        }
                        
                        # Process full content if available content is too short
                        if len(news_item["content"]) < 200:
                            full_content = await self._fetch_article_content(news_item["url"])
                            if full_content:
                                news_item["content"] = full_content
                        
                        await self.process_news_item(news_item)
                else:
                    logger.warning(f"News API returned non-ok status: {data.get('status')}")
            else:
                logger.error(f"News API error: {response.status_code}, {response.text}")
                
        except Exception as e:
            logger.error(f"Error fetching news from News API: {e}")
    
    async def scrape_specialized_content(self):
        """Scrape specialized financial content from specific websites"""
        logger.info("Scraping specialized financial content")
        
        # List of specialized financial websites to scrape
        specialized_sites = [
            {
                "url": "https://www.sec.gov/news/pressreleases",
                "name": "SEC",
                "selector": "div.article-list li",
                "title_selector": "a",
                "url_selector": "a",
                "url_prefix": "https://www.sec.gov",
                "category": "regulatory"
            },
            {
                "url": "https://www.federalreserve.gov/newsevents/pressreleases.htm",
                "name": "Federal Reserve",
                "selector": "div.row.preslist",
                "title_selector": "a.preslist__heading",
                "url_selector": "a.preslist__heading",
                "url_prefix": "https://www.federalreserve.gov",
                "category": "central_bank"
            }
        ]
        
        for site in specialized_sites:
            try:
                response = requests.get(site["url"])
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, "html.parser")
                    articles = soup.select(site["selector"])
                    
                    logger.info(f"Found {len(articles)} items from {site['name']}")
                    
                    for article in articles[:10]:  # Limit to most recent 10
                        try:
                            title_element = article.select_one(site["title_selector"])
                            url_element = article.select_one(site["url_selector"])
                            
                            if title_element and url_element:
                                title = title_element.text.strip()
                                url = url_element.get("href")
                                
                                # Handle relative URLs
                                if url and not url.startswith(("http://", "https://")):
                                    url = site["url_prefix"] + url
                                
                                # Skip if we can't get a valid URL
                                if not url:
                                    continue
                                    
                                # Check if article already exists
                                if await self._news_exists(url):
                                    continue
                                
                                # Create news item
                                news_item = {
                                    "title": title,
                                    "url": url,
                                    "source": site["name"],
                                    "publish_date": datetime.now().isoformat(),  # Use current date as fallback
                                    "content": "",
                                    "topics": [site["category"]]
                                }
                                
                                # Fetch content
                                full_content = await self._fetch_article_content(url)
                                if full_content:
                                    news_item["content"] = full_content
                                
                                await self.process_news_item(news_item)
                        except Exception as e:
                            logger.error(f"Error processing article from {site['name']}: {e}")
                else:
                    logger.error(f"Error scraping {site['name']}: Status code {response.status_code}")
            except Exception as e:
                logger.error(f"Error scraping {site['name']}: {e}")
    
    async def process_news_item(self, news_item: Dict[str, Any]):
        """Process a news item by analyzing content and saving to database"""
        logger.info(f"Processing news item: {news_item['title']}")
        
        try:
            # Ensure we have minimum required fields
            if not news_item.get("title") or not news_item.get("url"):
                logger.warning("News item missing required fields, skipping")
                return
            
            # Find mentioned stock symbols if not already extracted
            if "symbols" not in news_item or not news_item["symbols"]:
                symbols = await self._find_mentioned_stocks(news_item["title"] + " " + news_item["content"])
                news_item["symbols"] = symbols
            
            # Generate summary if content is long enough
            if len(news_item.get("content", "")) > 300 and "summary" not in news_item:
                summary = await self._generate_summary(news_item["title"], news_item["content"])
                news_item["summary"] = summary
            else:
                # Use first paragraph as summary
                content = news_item.get("content", "")
                first_para = content.split("\n\n")[0] if content else ""
                news_item["summary"] = first_para[:200] + ("..." if len(first_para) > 200 else "")
            
            # Determine sentiment if not already extracted
            if "sentiment" not in news_item:
                sentiment = await self._analyze_sentiment(news_item["title"], news_item.get("content", ""))
                news_item["sentiment"] = sentiment
            
            # Format dates properly
            if "publish_date" in news_item and isinstance(news_item["publish_date"], str):
                try:
                    parsed_date = date_parser.parse(news_item["publish_date"])
                    news_item["publish_date"] = parsed_date.isoformat()
                except:
                    news_item["publish_date"] = datetime.now().isoformat()
            
            # Add timestamps
            now = datetime.now().isoformat()
            news_item["created_at"] = now
            news_item["updated_at"] = now
            
            # Save to database
            await self._save_to_database(news_item)
            
        except Exception as e:
            logger.error(f"Error processing news item {news_item.get('title')}: {e}")
    
    async def _find_mentioned_stocks(self, text: str) -> List[str]:
        """Find mentioned stock symbols in the text"""
        mentioned_stocks = []
        
        # First try pattern matching for stock symbols
        # Looking for common patterns like ticker symbols in parentheses
        # Example: "Apple Inc. (AAPL) announced..." or "TSLA stock price..."
        ticker_pattern = r'\b([A-Z]{1,5})\b'  # Basic pattern for stock tickers
        potential_tickers = re.findall(ticker_pattern, text)
        
        # Filter out common words that match the pattern
        common_words = {"A", "I", "AM", "PM", "THE", "FOR", "IN", "ON", "BY", "TO", "US", "IT", "CEO", "CFO", "COO"}
        potential_tickers = [ticker for ticker in potential_tickers if ticker not in common_words]
        
        # Check against known tickers
        for ticker in potential_tickers:
            for stock in self.stock_tickers:
                if ticker == stock["symbol"]:
                    mentioned_stocks.append(ticker)
                    break
        
        # If we have AI capabilities, try that as well
        if self.model and not mentioned_stocks and len(text) > 100:
            ai_stocks = await self._detect_stocks_with_ai(text[:5000])  # Limit text length
            mentioned_stocks.extend([s["symbol"] for s in ai_stocks])
        
        # Remove duplicates and return
        return list(set(mentioned_stocks))
    
    async def _detect_stocks_with_ai(self, text: str) -> List[Dict[str, str]]:
        """Use AI to detect mentioned stocks in text"""
        if not self.model:
            return []
        
        try:
            prompt = f"""
            Please analyze the following financial news text and identify any stock ticker symbols that are mentioned.
            Return ONLY a JSON array with the stock symbols. If no stocks are mentioned, return an empty array.
            Format: [{"symbol": "AAPL"}, {"symbol": "MSFT"}, ...]
            
            TEXT:
            {text[:5000]}
            
            ONLY JSON OUTPUT:
            """
            
            response = self.model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            matches = re.search(r'\[\s*\{.*\}\s*\]', response_text, re.DOTALL)
            if matches:
                json_str = matches.group(0)
                stocks = json.loads(json_str)
                return stocks
            else:
                return []
                
        except Exception as e:
            logger.error(f"Error detecting stocks with AI: {e}")
            return []
    
    async def _analyze_sentiment(self, title: str, content: str) -> float:
        """Analyze sentiment of the news article"""
        # Default to neutral sentiment
        sentiment = 0.0
        
        # Use AI if available
        if self.model:
            try:
                # Prepare text for analysis (limit length)
                analysis_text = title + "\n" + content[:3000]
                
                prompt = f"""
                Please analyze the sentiment of the following financial news article.
                Return ONLY a single float value between -1.0 (very negative) and 1.0 (very positive),
                where 0.0 is neutral. Focus on the financial sentiment - is this positive or negative for investors?
                
                TEXT:
                {analysis_text}
                
                ONLY NUMERIC OUTPUT (-1.0 to 1.0):
                """
                
                response = self.model.generate_content(prompt)
                response_text = response.text.strip()
                
                # Extract a float from the response
                sentiment_match = re.search(r'(-?\d+\.\d+)', response_text)
                if sentiment_match:
                    sentiment = float(sentiment_match.group(1))
                    # Ensure the value is within bounds
                    sentiment = max(-1.0, min(1.0, sentiment))
                
            except Exception as e:
                logger.error(f"Error analyzing sentiment with AI: {e}")
        
        # Fallback basic sentiment analysis if AI fails
        if sentiment == 0.0:
            # Simple keyword-based sentiment
            positive_words = ["gain", "rise", "grow", "profit", "surge", "positive", "up", "higher", "bullish", "beat"]
            negative_words = ["loss", "fall", "drop", "decline", "negative", "down", "lower", "bearish", "miss", "risk"]
            
            text = (title + " " + content).lower()
            positive_count = sum(1 for word in positive_words if word in text)
            negative_count = sum(1 for word in negative_words if word in text)
            
            if positive_count > negative_count:
                sentiment = min(0.5, 0.1 * (positive_count - negative_count))
            elif negative_count > positive_count:
                sentiment = max(-0.5, -0.1 * (negative_count - positive_count))
        
        return sentiment
    
    async def _generate_summary(self, title: str, content: str) -> str:
        """Generate a summary of the news article"""
        # Default to first paragraph
        default_summary = content.split("\n\n")[0][:200] + "..."
        
        # Use AI if available
        if self.model:
            try:
                # Prepare text for summarization (limit length)
                text_to_summarize = title + "\n" + content[:5000]
                
                prompt = f"""
                Please summarize the following financial news article in 2-3 sentences, focusing on the key financial implications.
                Keep it brief, clear and focused on what investors would need to know.
                
                ARTICLE:
                {text_to_summarize}
                
                SUMMARY:
                """
                
                response = self.model.generate_content(prompt)
                summary = response.text.strip()
                
                if len(summary) > 30:  # Ensure we got a meaningful summary
                    return summary
                    
            except Exception as e:
                logger.error(f"Error generating summary with AI: {e}")
        
        return default_summary
    
    async def _fetch_article_content(self, url: str) -> Optional[str]:
        """Fetch the content of an article from its URL"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, "html.parser")
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Try to find article content
                article = None
                
                # Look for common article containers
                for selector in ["article", ".article-content", ".article-body", ".story-body", "main", ".content"]:
                    article = soup.select_one(selector)
                    if article:
                        break
                
                # If we found a good container, extract the text
                if article:
                    # Extract paragraphs
                    paragraphs = [p.get_text().strip() for p in article.find_all('p')]
                    return "\n\n".join(paragraphs)
                
                # Fallback to main text
                text = soup.get_text()
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = '\n'.join(chunk for chunk in chunks if chunk)
                
                return text[:5000]  # Limit to 5000 chars
            else:
                logger.warning(f"Failed to fetch content from {url}: Status code {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching article content from {url}: {e}")
            return None
    
    async def _save_to_database(self, news_item: Dict[str, Any]):
        """Save a processed news item to the database"""
        if not self.supabase:
            logger.error("No Supabase client available, cannot save to database")
            return
        
        try:
            # Format data for storage
            news_data = {
                "title": news_item.get("title", ""),
                "url": news_item.get("url", ""),
                "source": news_item.get("source", ""),
                "content": news_item.get("content", "")[:10000],  # Limit content length
                "summary": news_item.get("summary", "")[:500],  # Limit summary length
                "publish_date": news_item.get("publish_date", datetime.now().isoformat()),
                "sentiment": news_item.get("sentiment", 0),
                "symbols": news_item.get("symbols", []),
                "topics": news_item.get("topics", []),
                "created_at": news_item.get("created_at", datetime.now().isoformat()),
                "updated_at": news_item.get("updated_at", datetime.now().isoformat())
            }
            
            # Convert lists to properly formatted PostgreSQL arrays
            if isinstance(news_data["symbols"], list):
                news_data["symbols"] = json.dumps(news_data["symbols"])
            
            if isinstance(news_data["topics"], list):
                news_data["topics"] = json.dumps(news_data["topics"])
            
            # Insert into database
            result = self.supabase.table(FINANCIAL_NEWS_TABLE).insert(news_data).execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Saved news item to database: {news_item.get('title')}")
            else:
                logger.warning(f"Failed to save news item: {news_item.get('title')}")
                
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
    
    async def _news_exists(self, url: str) -> bool:
        """Check if a news article already exists in the database"""
        if not self.supabase or not url:
            return False
        
        try:
            result = self.supabase.table(FINANCIAL_NEWS_TABLE).select("id").eq("url", url).execute()
            
            if hasattr(result, 'data') and result.data:
                return len(result.data) > 0
            return False
            
        except Exception as e:
            logger.error(f"Error checking if news exists: {e}")
            return False
    
    def _load_stock_tickers(self) -> List[Dict[str, str]]:
        """Load stock tickers from a JSON file or create a dummy list"""
        try:
            if os.path.exists(STOCK_TICKERS_FILE):
                with open(STOCK_TICKERS_FILE, 'r') as f:
                    return json.load(f)
            else:
                # Create a basic list of major stock tickers
                tickers = [
                    {"symbol": "AAPL", "name": "Apple Inc."},
                    {"symbol": "MSFT", "name": "Microsoft Corporation"},
                    {"symbol": "AMZN", "name": "Amazon.com Inc."},
                    {"symbol": "GOOGL", "name": "Alphabet Inc."},
                    {"symbol": "META", "name": "Meta Platforms Inc."},
                    {"symbol": "TSLA", "name": "Tesla Inc."},
                    {"symbol": "NVDA", "name": "NVIDIA Corporation"},
                    {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
                    {"symbol": "V", "name": "Visa Inc."},
                    {"symbol": "JNJ", "name": "Johnson & Johnson"},
                    {"symbol": "WMT", "name": "Walmart Inc."},
                    {"symbol": "PG", "name": "Procter & Gamble Co."},
                    {"symbol": "MA", "name": "Mastercard Inc."},
                    {"symbol": "UNH", "name": "UnitedHealth Group Inc."},
                    {"symbol": "HD", "name": "Home Depot Inc."},
                    {"symbol": "BAC", "name": "Bank of America Corp."},
                    {"symbol": "XOM", "name": "Exxon Mobil Corporation"},
                    {"symbol": "PFE", "name": "Pfizer Inc."},
                    {"symbol": "CSCO", "name": "Cisco Systems Inc."},
                    {"symbol": "DIS", "name": "The Walt Disney Company"}
                ]
                
                # Save for future use
                with open(STOCK_TICKERS_FILE, 'w') as f:
                    json.dump(tickers, f, indent=2)
                
                return tickers
                
        except Exception as e:
            logger.error(f"Error loading stock tickers: {e}")
            return []

async def main():
    """Main entry point for the financial news fetcher"""
    fetcher = FinancialNewsFetcher()
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main()) 
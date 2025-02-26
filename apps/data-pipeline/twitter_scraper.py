import asyncio
import logging
import json
import os
import re
from datetime import datetime
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}')

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
X_BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TWITTER_TABLE = "twitter_data"
TRACKED_ACCOUNTS_TABLE = "tracked_twitter_accounts"

class TwitterScraper:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {X_BEARER_TOKEN}",
            "Content-Type": "application/json"
        }
        self.base_url = "https://api.twitter.com/2"
    
    async def get_tracked_accounts(self):
        """Retrieve list of tracked Twitter accounts from database."""
        try:
            response = supabase.table(TRACKED_ACCOUNTS_TABLE).select("username,twitter_id").execute()
            if response.data:
                return response.data
            logger.warning("No tracked Twitter accounts found", extra={"metadata": {}})
            return []
        except Exception as e:
            logger.error(f"Error fetching tracked accounts: {e}", extra={"metadata": {}})
            return []
    
    async def get_user_tweets(self, twitter_id):
        """Get recent tweets for a specific user ID."""
        try:
            # Get user's tweets with expansions for media and metrics
            url = f"{self.base_url}/users/{twitter_id}/tweets"
            params = {
                "max_results": 10,
                "tweet.fields": "created_at,public_metrics,entities,context_annotations",
                "expansions": "attachments.media_keys",
                "media.fields": "url,preview_image_url"
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code != 200:
                logger.error(f"Twitter API error: {response.status_code} - {response.text}", 
                            extra={"metadata": {"user_id": twitter_id, "status": response.status_code}})
                return []
            
            data = response.json()
            if not data.get("data"):
                logger.warning(f"No tweets found for user {twitter_id}", 
                              extra={"metadata": {"user_id": twitter_id}})
                return []
            
            return data["data"]
        except Exception as e:
            logger.error(f"Error fetching tweets for {twitter_id}: {e}", 
                        extra={"metadata": {"user_id": twitter_id}})
            return []
    
    def extract_stock_mentions(self, tweet_text):
        """Extract stock ticker mentions from a tweet."""
        # Look for $TICKER patterns
        cashtag_pattern = r'\$([A-Z]{1,5})'
        cashtags = re.findall(cashtag_pattern, tweet_text)
        
        # Look for "bought X shares of TICKER"
        bought_pattern = r'(?:bought|purchased).*?(?:shares|stock).*?(?:of\s+)([A-Z]{1,5})'
        bought_matches = re.findall(bought_pattern, tweet_text, re.IGNORECASE)
        
        # Look for "sold X shares of TICKER"
        sold_pattern = r'(?:sold|dumped).*?(?:shares|stock).*?(?:of\s+)([A-Z]{1,5})'
        sold_matches = re.findall(sold_pattern, tweet_text, re.IGNORECASE)
        
        return {
            "cashtags": cashtags,
            "bought": bought_matches,
            "sold": sold_matches
        }
    
    def process_tweet(self, tweet, username):
        """Process a tweet for stock mentions and sentiment."""
        tweet_text = tweet.get("text", "")
        created_at = tweet.get("created_at")
        tweet_id = tweet.get("id")
        
        stock_mentions = self.extract_stock_mentions(tweet_text)
        
        # Simple sentiment analysis (replace with more sophisticated analysis)
        sentiment = "neutral"
        if "buying" in tweet_text.lower() or "bullish" in tweet_text.lower():
            sentiment = "bullish"
        elif "selling" in tweet_text.lower() or "bearish" in tweet_text.lower():
            sentiment = "bearish"
        
        # Combine all mentioned tickers
        all_tickers = set(stock_mentions["cashtags"] + stock_mentions["bought"] + stock_mentions["sold"])
        
        if not all_tickers:
            return None  # No stock mentions found
        
        return {
            "tweet_id": tweet_id,
            "username": username,
            "text": tweet_text,
            "created_at": created_at,
            "tickers": list(all_tickers),
            "sentiment": sentiment,
            "processed_at": datetime.now().isoformat(),
            "action": "buy" if stock_mentions["bought"] else ("sell" if stock_mentions["sold"] else "mention")
        }
    
    def store_tweet_data(self, processed_data):
        """Store processed tweet data in Supabase."""
        if not processed_data:
            return
        
        try:
            # Check if tweet already exists
            existing = supabase.table(TWITTER_TABLE) \
                .select("id") \
                .eq("tweet_id", processed_data["tweet_id"]) \
                .execute()
            
            if not existing.data or len(existing.data) == 0:
                # Insert new tweet data
                supabase.table(TWITTER_TABLE).insert(processed_data).execute()
                logger.info(f"Inserted new tweet data for {processed_data['username']}", 
                          extra={"metadata": {"tweet_id": processed_data["tweet_id"]}})
            else:
                # Update existing tweet data
                supabase.table(TWITTER_TABLE) \
                    .update(processed_data) \
                    .eq("tweet_id", processed_data["tweet_id"]) \
                    .execute()
                logger.info(f"Updated tweet data for {processed_data['username']}", 
                          extra={"metadata": {"tweet_id": processed_data["tweet_id"]}})
        except Exception as e:
            logger.error(f"Error storing tweet data: {e}", 
                        extra={"metadata": {"tweet_id": processed_data.get("tweet_id", "unknown")}})
    
    async def run(self):
        """Run the Twitter scraper."""
        accounts = await self.get_tracked_accounts()
        if not accounts:
            logger.warning("No accounts to track", extra={"metadata": {}})
            return
        
        for account in accounts:
            username = account.get("username")
            twitter_id = account.get("twitter_id")
            
            if not twitter_id:
                logger.warning(f"No Twitter ID for {username}", extra={"metadata": {"username": username}})
                continue
            
            logger.info(f"Fetching tweets for {username}", extra={"metadata": {"username": username}})
            tweets = await self.get_user_tweets(twitter_id)
            
            for tweet in tweets:
                processed_data = self.process_tweet(tweet, username)
                if processed_data:
                    self.store_tweet_data(processed_data)
            
            # Rate limiting - wait between API calls
            await asyncio.sleep(1)
        
        logger.info("Completed Twitter scraping cycle", extra={"metadata": {"accounts": len(accounts)}})

async def main():
    scraper = TwitterScraper()
    await scraper.run()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main()) 
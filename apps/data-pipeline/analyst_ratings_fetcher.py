import os
import sys
import json
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from unusual_whales_api import get_analyst_ratings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/analyst_ratings_fetcher.log")
    ]
)
logger = logging.getLogger("analyst_ratings_fetcher")

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class AnalystRatingsFetcher:
    def __init__(self):
        self.table_name = "analyst_ratings"
    
    def fetch(self, days=14, limit=500):
        """Fetch analyst ratings from the Unusual Whales API."""
        logger.info(f"Fetching analyst ratings for the past {days} days (limit: {limit})...")
        
        try:
            ratings = get_analyst_ratings(days=days, limit=limit)
            logger.info(f"Successfully fetched {len(ratings)} analyst ratings")
            return ratings
        
        except Exception as e:
            logger.error(f"Error fetching analyst ratings: {e}")
            return []
    
    def process(self, ratings):
        """Process the fetched analyst ratings data."""
        logger.info("Processing analyst ratings data...")
        
        processed_ratings = []
        for rating in ratings:
            # Convert date string to proper format
            try:
                date_obj = datetime.strptime(rating["rating_date"], "%Y-%m-%d")
                rating_date = date_obj.strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                # If date parsing fails, use current date
                rating_date = datetime.now().strftime("%Y-%m-%d")
            
            processed_ratings.append({
                "symbol": rating["symbol"],
                "company_name": rating["company_name"],
                "firm": rating["firm"],
                "analyst": rating["analyst"],
                "rating_date": rating_date,
                "old_rating": rating["old_rating"],
                "new_rating": rating["new_rating"],
                "rating_change": rating["rating_change"],
                "old_price_target": rating["old_price_target"],
                "new_price_target": rating["new_price_target"],
                "price_target_change_percent": rating["price_target_change_percent"],
                "current_price": rating["current_price"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            })
        
        logger.info(f"Processed {len(processed_ratings)} analyst ratings")
        return processed_ratings
    
    def store(self, processed_ratings):
        """Store the processed analyst ratings in Supabase."""
        if not processed_ratings:
            logger.warning("No ratings to store")
            return
        
        logger.info(f"Storing {len(processed_ratings)} analyst ratings in Supabase...")
        
        try:
            # Get existing ratings from the last 14 days to avoid duplicates
            fourteen_days_ago = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
            
            existing_ratings = supabase.table(self.table_name) \
                .select("symbol, firm, rating_date, rating_change") \
                .gte("rating_date", fourteen_days_ago) \
                .execute()
            
            # Create a set of existing ratings (symbol, firm, date, change) for efficient lookup
            existing_set = set()
            for item in existing_ratings.data:
                key = (
                    item["symbol"],
                    item["firm"],
                    item["rating_date"],
                    item["rating_change"]
                )
                existing_set.add(key)
            
            # Filter out duplicates
            new_ratings = []
            for rating in processed_ratings:
                key = (
                    rating["symbol"],
                    rating["firm"],
                    rating["rating_date"],
                    rating["rating_change"]
                )
                if key not in existing_set:
                    new_ratings.append(rating)
            
            logger.info(f"Found {len(processed_ratings) - len(new_ratings)} duplicate ratings")
            
            if not new_ratings:
                logger.info("No new ratings to insert")
                return
            
            # Insert data in batches to avoid hitting API limits
            batch_size = 50
            for i in range(0, len(new_ratings), batch_size):
                batch = new_ratings[i:i+batch_size]
                response = supabase.table(self.table_name).insert(batch).execute()
                
                if hasattr(response, 'error') and response.error:
                    logger.error(f"Error inserting batch {i//batch_size + 1}: {response.error}")
                else:
                    logger.info(f"Successfully inserted batch {i//batch_size + 1} ({len(batch)} ratings)")
            
            logger.info(f"Successfully stored {len(new_ratings)} new analyst ratings")
        
        except Exception as e:
            logger.error(f"Error storing analyst ratings: {e}")
    
    def run(self, days=14, limit=500):
        """Run the full fetcher process."""
        logger.info("Starting Analyst Ratings Fetcher...")
        
        try:
            ratings = self.fetch(days, limit)
            processed_ratings = self.process(ratings)
            self.store(processed_ratings)
            logger.info("Analyst Ratings Fetcher completed successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error running Analyst Ratings Fetcher: {e}")
            return False


if __name__ == "__main__":
    # Parse command line arguments
    days = 14
    limit = 500
    
    if len(sys.argv) > 1:
        try:
            days = int(sys.argv[1])
        except ValueError:
            logger.warning(f"Invalid days value: {sys.argv[1]}. Using default: {days}")
    
    if len(sys.argv) > 2:
        try:
            limit = int(sys.argv[2])
        except ValueError:
            logger.warning(f"Invalid limit value: {sys.argv[2]}. Using default: {limit}")
    
    # Run the fetcher
    fetcher = AnalystRatingsFetcher()
    success = fetcher.run(days, limit)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1) 
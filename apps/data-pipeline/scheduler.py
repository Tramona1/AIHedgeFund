import os
import time
import logging
import asyncio
import schedule
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Import all the data processors
import market_data_fetcher
import sec_edgar_fetcher
import twitter_scraper
import dark_pool_processor
import option_flow_processor
import holdings_change_detector

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}')

# Standard tickers to track
DEFAULT_TICKERS = ["AAPL", "MSFT", "AMZN", "GOOG", "META", "NVDA", "TSLA", "AMD", "JPM", "BAC"]

class Scheduler:
    def __init__(self):
        """Initialize the scheduler with all data processors."""
        load_dotenv()
        self.is_running = False
        
        # Get tickers from environment or use defaults
        tickers_env = os.getenv("TRACKED_TICKERS")
        self.tickers = tickers_env.split(",") if tickers_env else DEFAULT_TICKERS
        
        logger.info(f"Scheduler initialized with {len(self.tickers)} tickers", 
                   extra={"metadata": {"tickers": self.tickers}})
    
    async def run_market_data(self):
        """Run the market data fetcher."""
        try:
            logger.info("Starting market data fetcher job", extra={"metadata": {}})
            fetcher = market_data_fetcher.MarketDataFetcher()
            await fetcher.run(self.tickers)
            await fetcher.close()
            logger.info("Completed market data fetcher job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in market data fetcher job: {e}", extra={"metadata": {}})
    
    async def run_sec_edgar(self):
        """Run the SEC EDGAR fetcher."""
        try:
            logger.info("Starting SEC EDGAR fetcher job", extra={"metadata": {}})
            fetcher = sec_edgar_fetcher.SecEdgarFetcher()
            await fetcher.run()
            fetcher.close()
            logger.info("Completed SEC EDGAR fetcher job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in SEC EDGAR fetcher job: {e}", extra={"metadata": {}})
    
    async def run_twitter_scraper(self):
        """Run the Twitter scraper."""
        try:
            logger.info("Starting Twitter scraper job", extra={"metadata": {}})
            scraper = twitter_scraper.TwitterScraper()
            await scraper.run()
            logger.info("Completed Twitter scraper job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in Twitter scraper job: {e}", extra={"metadata": {}})
    
    async def run_dark_pool_processor(self):
        """Run the dark pool data processor."""
        try:
            logger.info("Starting dark pool processor job", extra={"metadata": {}})
            processor = dark_pool_processor.DarkPoolProcessor()
            await processor.run(self.tickers)
            processor.close()
            logger.info("Completed dark pool processor job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in dark pool processor job: {e}", extra={"metadata": {}})
    
    async def run_option_flow_processor(self):
        """Run the option flow processor."""
        try:
            logger.info("Starting option flow processor job", extra={"metadata": {}})
            processor = option_flow_processor.OptionFlowProcessor()
            await processor.run(self.tickers)
            processor.close()
            logger.info("Completed option flow processor job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in option flow processor job: {e}", extra={"metadata": {}})
    
    async def run_holdings_change_detector(self):
        """Run the holdings change detector."""
        try:
            logger.info("Starting holdings change detector job", extra={"metadata": {}})
            detector = holdings_change_detector.HoldingsChangeDetector()
            await detector.run()
            detector.close()
            logger.info("Completed holdings change detector job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in holdings change detector job: {e}", extra={"metadata": {}})
    
    def schedule_jobs(self):
        """Schedule all data pipeline jobs."""
        # Market data every 15 minutes during trading hours
        schedule.every(15).minutes.do(self._run_async_job, self.run_market_data)
        
        # SEC EDGAR fetcher once per hour
        schedule.every(1).hour.do(self._run_async_job, self.run_sec_edgar)
        
        # Twitter scraper every 30 minutes
        schedule.every(30).minutes.do(self._run_async_job, self.run_twitter_scraper)
        
        # Dark pool processor every 2 hours
        schedule.every(2).hours.do(self._run_async_job, self.run_dark_pool_processor)
        
        # Option flow processor every 2 hours
        schedule.every(2).hours.do(self._run_async_job, self.run_option_flow_processor)
        
        # Holdings change detector every 4 hours
        schedule.every(4).hours.do(self._run_async_job, self.run_holdings_change_detector)
        
        logger.info("All jobs scheduled", extra={"metadata": {}})
    
    def _run_async_job(self, job_func):
        """
        Helper function to run async jobs with schedule.
        schedule library doesn't natively support async, so we wrap it.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(job_func())
        finally:
            loop.close()
    
    async def run_all_now(self):
        """Run all data pipeline jobs immediately."""
        logger.info("Running all jobs immediately", extra={"metadata": {}})
        
        tasks = [
            self.run_market_data(),
            self.run_sec_edgar(),
            self.run_twitter_scraper(),
            self.run_dark_pool_processor(),
            self.run_option_flow_processor(),
            self.run_holdings_change_detector()
        ]
        
        await asyncio.gather(*tasks)
        logger.info("Completed running all jobs", extra={"metadata": {}})
    
    def start(self):
        """Start the scheduler."""
        if self.is_running:
            logger.warning("Scheduler is already running", extra={"metadata": {}})
            return
        
        self.is_running = True
        self.schedule_jobs()
        
        # Run all jobs immediately on startup
        asyncio.run(self.run_all_now())
        
        # Run the scheduler loop
        logger.info("Starting scheduler loop", extra={"metadata": {}})
        while self.is_running:
            schedule.run_pending()
            time.sleep(1)
    
    def stop(self):
        """Stop the scheduler."""
        logger.info("Stopping scheduler", extra={"metadata": {}})
        self.is_running = False

if __name__ == "__main__":
    scheduler = Scheduler()
    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received", extra={"metadata": {}})
    except Exception as e:
        logger.error(f"Error in scheduler: {e}", extra={"metadata": {}})
    finally:
        scheduler.stop() 
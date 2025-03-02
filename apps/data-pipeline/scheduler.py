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
import fundamental_analyzer
import economic_indicator_fetcher
import economic_report_fetcher
import interview_processor

# Add a filter to ensure all log records have a metadata field
class MetadataFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'metadata'):
            record.metadata = '{}'
        return True

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}')

# Add our filter to the root logger to ensure all records have metadata
logging.getLogger().addFilter(MetadataFilter())

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
        
        # Get user type (trader or investor) or default to both
        self.user_type = os.getenv("USER_TYPE", "both").lower()
        
        logger.info(f"Scheduler initialized with {len(self.tickers)} tickers and user type: {self.user_type}", 
                   extra={"metadata": {"tickers": self.tickers, "user_type": self.user_type}})
    
    async def run_market_data_trader(self):
        """Run the market data fetcher for traders (frequent updates)."""
        try:
            logger.info("Starting market data fetcher job for traders", extra={"metadata": {}})
            fetcher = market_data_fetcher.MarketDataFetcher()
            await fetcher.run_trader(self.tickers)
            await fetcher.close()
            logger.info("Completed market data fetcher job for traders", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in market data fetcher job for traders: {e}", extra={"metadata": {}})
    
    async def run_market_data_investor(self):
        """Run the market data fetcher for investors (less frequent updates)."""
        try:
            logger.info("Starting market data fetcher job for investors", extra={"metadata": {}})
            fetcher = market_data_fetcher.MarketDataFetcher()
            await fetcher.run_investor(self.tickers)
            await fetcher.close()
            logger.info("Completed market data fetcher job for investors", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in market data fetcher job for investors: {e}", extra={"metadata": {}})
    
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
    
    # Commented out Twitter scraper function
    # async def run_twitter_scraper(self):
    #     """Run the Twitter scraper."""
    #     try:
    #         logger.info("Starting Twitter scraper job", extra={"metadata": {}})
    #         scraper = twitter_scraper.TwitterScraper()
    #         await scraper.run()
    #         logger.info("Completed Twitter scraper job", extra={"metadata": {}})
    #     except Exception as e:
    #         logger.error(f"Error in Twitter scraper job: {e}", extra={"metadata": {}})
    
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
    
    def run_fundamental_analyzer(self):
        """Run the fundamental analyzer (synchronous)."""
        try:
            logger.info("Starting fundamental analyzer job", extra={"metadata": {}})
            analyzer = fundamental_analyzer.FundamentalAnalyzer()
            analyzer.run(self.tickers)
            logger.info("Completed fundamental analyzer job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in fundamental analyzer job: {e}", extra={"metadata": {}})
    
    def run_economic_indicator_fetcher(self):
        """Run the economic indicator fetcher (synchronous)."""
        try:
            logger.info("Starting economic indicator fetcher job", extra={"metadata": {}})
            fetcher = economic_indicator_fetcher.EconomicIndicatorFetcher()
            fetcher.run()
            logger.info("Completed economic indicator fetcher job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in economic indicator fetcher job: {e}", extra={"metadata": {}})
    
    def run_economic_report_fetcher(self):
        """Run the economic report fetcher (synchronous)."""
        try:
            logger.info("Starting economic report fetcher job", extra={"metadata": {}})
            fetcher = economic_report_fetcher.EconomicReportFetcher()
            fetcher.run()
            logger.info("Completed economic report fetcher job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in economic report fetcher job: {e}", extra={"metadata": {}})
    
    def run_interview_processor(self):
        """Run the interview processor (synchronous)."""
        try:
            # List of interview URLs to process
            # These could be stored in a config file or database in the future
            interview_urls = os.getenv("INTERVIEW_URLS", "").split(",")
            if not interview_urls or (len(interview_urls) == 1 and not interview_urls[0]):
                logger.info("No interview URLs configured", extra={"metadata": {}})
                return
                
            logger.info("Starting interview processor job", extra={"metadata": {}})
            processor = interview_processor.InterviewProcessor()
            processor.run(interview_urls)
            logger.info("Completed interview processor job", extra={"metadata": {}})
        except Exception as e:
            logger.error(f"Error in interview processor job: {e}", extra={"metadata": {}})
    
    def schedule_jobs(self):
        """Schedule all data pipeline jobs based on user type."""
        if self.user_type == "trader" or self.user_type == "both":
            # Trader data - more frequent updates
            schedule.every(15).minutes.do(self._run_async_job, self.run_market_data_trader)
            # Commented out Twitter scraper schedule
            # schedule.every(30).minutes.do(self._run_async_job, self.run_twitter_scraper)
            schedule.every(1).hour.do(self._run_async_job, self.run_option_flow_processor)
            schedule.every(2).hours.do(self._run_async_job, self.run_dark_pool_processor)
            schedule.every(15).minutes.do(self.run_economic_report_fetcher)
            logger.info("Trader data jobs scheduled", extra={"metadata": {}})
        
        if self.user_type == "investor" or self.user_type == "both":
            # Investor data - less frequent updates
            schedule.every(4).hours.do(self._run_async_job, self.run_market_data_investor)
            schedule.every(4).hours.do(self._run_async_job, self.run_sec_edgar)
            schedule.every(4).hours.do(self._run_async_job, self.run_holdings_change_detector)
            schedule.every(12).hours.do(self.run_fundamental_analyzer)
            schedule.every(6).hours.do(self.run_economic_indicator_fetcher)
            schedule.every(4).hours.do(self.run_economic_report_fetcher)
            schedule.every(12).hours.do(self.run_interview_processor)
            logger.info("Investor data jobs scheduled", extra={"metadata": {}})
    
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
        """Run all data pipeline jobs immediately based on user type."""
        logger.info("Running all jobs immediately", extra={"metadata": {}})
        
        tasks = []
        
        if self.user_type == "trader" or self.user_type == "both":
            # Trader data tasks
            tasks.extend([
                self.run_market_data_trader(),
                # self.run_twitter_scraper(),
                self.run_option_flow_processor(),
                self.run_dark_pool_processor()
            ])
        
        if self.user_type == "investor" or self.user_type == "both":
            # Investor data tasks
            tasks.extend([
                self.run_market_data_investor(),
                self.run_sec_edgar(),
                self.run_holdings_change_detector()
            ])
        
        await asyncio.gather(*tasks)
        
        # Run synchronous tasks
        if self.user_type == "investor" or self.user_type == "both":
            self.run_fundamental_analyzer()
            self.run_economic_indicator_fetcher()
            self.run_economic_report_fetcher()
            self.run_interview_processor()
        elif self.user_type == "trader":
            self.run_economic_report_fetcher()
        
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
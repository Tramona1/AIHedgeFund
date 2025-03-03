#!/usr/bin/env python3
"""
Data Pipeline - Run All Fetchers

This script provides a way to run all data fetcher modules either:
1. On-demand as a one-time execution
2. Scheduled at specified intervals

It manages the execution of all data collection modules and provides
centralized logging and error handling.
"""

import asyncio
import logging
import argparse
import os
import sys
import time
import schedule
from datetime import datetime, timedelta
from typing import List, Dict, Any, Callable, Coroutine

# Import all data fetcher modules
try:
    # New data fetchers
    from bank_reports_fetcher import BankReportsFetcher
    from youtube_videos_fetcher import YouTubeVideosFetcher
    from insider_trades_fetcher import InsiderTradesFetcher
    from political_trades_fetcher import PoliticalTradesFetcher
    from hedge_fund_trades_fetcher import HedgeFundTradesFetcher
    from financial_news_fetcher import FinancialNewsFetcher
    
    # Existing data fetchers (uncomment as needed)
    # from market_data_fetcher import MarketDataFetcher
    # from sec_edgar_fetcher import SECEdgarFetcher
    # from twitter_scraper import TwitterScraper
    # from dark_pool_processor import DarkPoolProcessor
    # from option_flow_processor import OptionFlowProcessor
    # from holdings_change_detector import HoldingsChangeDetector
    # from economic_indicator_fetcher import EconomicIndicatorFetcher
    # from interview_processor import InterviewProcessor
except ImportError as e:
    print(f"Error importing fetcher modules: {e}")
    sys.exit(1)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs', 'data_pipeline.log'))
    ]
)
logger = logging.getLogger("data_pipeline")

# Make sure logs directory exists
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs'), exist_ok=True)

# Define fetcher classes with their schedule (in hours)
FETCHERS = [
    {"name": "Bank Reports", "class": BankReportsFetcher, "schedule_hours": 12},
    {"name": "YouTube Videos", "class": YouTubeVideosFetcher, "schedule_hours": 6},
    {"name": "Insider Trades", "class": InsiderTradesFetcher, "schedule_hours": 24},
    {"name": "Political Trades", "class": PoliticalTradesFetcher, "schedule_hours": 24},
    {"name": "Hedge Fund Trades", "class": HedgeFundTradesFetcher, "schedule_hours": 24 * 7},  # Weekly
    {"name": "Financial News", "class": FinancialNewsFetcher, "schedule_hours": 3},
    
    # Uncomment as needed for existing fetchers
    # {"name": "Market Data", "class": MarketDataFetcher, "schedule_hours": 1},
    # {"name": "SEC Edgar", "class": SECEdgarFetcher, "schedule_hours": 24},
    # {"name": "Twitter", "class": TwitterScraper, "schedule_hours": 2},
    # {"name": "Dark Pool", "class": DarkPoolProcessor, "schedule_hours": 4},
    # {"name": "Options Flow", "class": OptionFlowProcessor, "schedule_hours": 4},
    # {"name": "Holdings Change", "class": HoldingsChangeDetector, "schedule_hours": 24},
    # {"name": "Economic Indicators", "class": EconomicIndicatorFetcher, "schedule_hours": 24},
    # {"name": "Interview Processor", "class": InterviewProcessor, "schedule_hours": 6},
]

class DataPipelineRunner:
    def __init__(self):
        """Initialize the data pipeline runner"""
        self.fetcher_instances = {}
        self.is_running = False
        self.scheduler = schedule
    
    async def initialize_fetchers(self) -> None:
        """Initialize all fetcher classes"""
        for fetcher_info in FETCHERS:
            try:
                fetcher_name = fetcher_info["name"]
                fetcher_class = fetcher_info["class"]
                self.fetcher_instances[fetcher_name] = fetcher_class()
                logger.info(f"Initialized {fetcher_name} fetcher")
            except Exception as e:
                logger.error(f"Failed to initialize {fetcher_info['name']} fetcher: {e}")
    
    async def run_fetcher(self, fetcher_name: str) -> bool:
        """Run a specific fetcher"""
        if fetcher_name not in self.fetcher_instances:
            logger.error(f"Fetcher {fetcher_name} not initialized")
            return False
        
        fetcher = self.fetcher_instances[fetcher_name]
        logger.info(f"Running {fetcher_name} fetcher...")
        
        try:
            start_time = time.time()
            result = await fetcher.run()
            elapsed_time = time.time() - start_time
            
            if result:
                logger.info(f"{fetcher_name} fetcher completed successfully in {elapsed_time:.2f} seconds")
            else:
                logger.warning(f"{fetcher_name} fetcher completed with errors in {elapsed_time:.2f} seconds")
            
            return result
        except Exception as e:
            logger.error(f"Error running {fetcher_name} fetcher: {e}")
            return False
    
    async def run_all_fetchers(self) -> Dict[str, bool]:
        """Run all fetchers and return their results"""
        await self.initialize_fetchers()
        
        results = {}
        for fetcher_info in FETCHERS:
            fetcher_name = fetcher_info["name"]
            result = await self.run_fetcher(fetcher_name)
            results[fetcher_name] = result
        
        return results
    
    def run_fetcher_sync(self, fetcher_name: str) -> None:
        """Synchronous wrapper for running a fetcher (for scheduling)"""
        asyncio.run(self.run_fetcher(fetcher_name))
    
    def schedule_fetchers(self) -> None:
        """Set up the schedule for all fetchers"""
        for fetcher_info in FETCHERS:
            fetcher_name = fetcher_info["name"]
            hours = fetcher_info["schedule_hours"]
            
            # Create a schedule for each fetcher
            schedule_time = f"*/{hours}" if hours < 24 else "00"  # Every X hours or at midnight for daily+
            self.scheduler.every().hour.at(f":{schedule_time}").do(self.run_fetcher_sync, fetcher_name)
            
            logger.info(f"Scheduled {fetcher_name} fetcher to run every {hours} hours")
            
            # Also schedule each fetcher to run immediately after startup
            self.scheduler.every().day.at(datetime.now().strftime("%H:%M")).do(
                self.run_fetcher_sync, fetcher_name
            ).tag("startup_run")
    
    def start_scheduler(self) -> None:
        """Start the scheduler"""
        self.is_running = True
        logger.info("Starting data pipeline scheduler")
        
        self.schedule_fetchers()
        
        while self.is_running:
            self.scheduler.run_pending()
            time.sleep(1)
            
            # Remove startup tasks after they've run
            for job in self.scheduler.get_jobs("startup_run"):
                self.scheduler.cancel_job(job)
    
    def stop_scheduler(self) -> None:
        """Stop the scheduler"""
        self.is_running = False
        logger.info("Stopping data pipeline scheduler")

async def run_one_time() -> None:
    """Run all fetchers once"""
    runner = DataPipelineRunner()
    results = await runner.run_all_fetchers()
    
    # Print summary of results
    logger.info("All fetchers completed execution")
    logger.info("--- SUMMARY ---")
    for fetcher_name, success in results.items():
        status = "SUCCESS" if success else "FAILED"
        logger.info(f"{fetcher_name}: {status}")

def run_scheduled() -> None:
    """Run fetchers on a schedule"""
    runner = DataPipelineRunner()
    
    # Initialize fetcher instances
    asyncio.run(runner.initialize_fetchers())
    
    try:
        # Start the scheduler
        runner.start_scheduler()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
        runner.stop_scheduler()
        logger.info("Scheduler stopped")

def main() -> None:
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run data pipeline fetchers")
    parser.add_argument("--mode", choices=["once", "scheduled"], default="once",
                        help="Run fetchers once or on a schedule")
    parser.add_argument("--fetcher", type=str, 
                        help="Run a specific fetcher (by name)")
    
    args = parser.parse_args()
    
    if args.mode == "once":
        if args.fetcher:
            # Run a specific fetcher once
            runner = DataPipelineRunner()
            asyncio.run(runner.initialize_fetchers())
            
            # Find the matching fetcher
            fetcher_found = False
            for fetcher_info in FETCHERS:
                if fetcher_info["name"].lower() == args.fetcher.lower():
                    result = asyncio.run(runner.run_fetcher(fetcher_info["name"]))
                    status = "SUCCESS" if result else "FAILED"
                    logger.info(f"{fetcher_info['name']}: {status}")
                    fetcher_found = True
                    break
            
            if not fetcher_found:
                logger.error(f"Fetcher '{args.fetcher}' not found. Available fetchers:")
                for fetcher_info in FETCHERS:
                    logger.error(f"- {fetcher_info['name']}")
        else:
            # Run all fetchers once
            asyncio.run(run_one_time())
    else:
        # Run on a schedule
        run_scheduled()

if __name__ == "__main__":
    main() 
#!/usr/bin/env python

import os
import sys
import argparse
import asyncio
import logging
from dotenv import load_dotenv

# Set up logging
logger = logging.getLogger("scheduler")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def setup_argparse():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='AI Hedge Fund Data Pipeline Scheduler (Lite Version)')
    parser.add_argument('--dev', action='store_true', help='Run in development mode')
    parser.add_argument('--once', action='store_true', help='Run all jobs once and exit')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    return parser.parse_args()

class SimplifiedScheduler:
    def __init__(self):
        """Initialize a simplified scheduler."""
        load_dotenv()
        self.is_running = False

    async def run_market_data(self):
        """Run market data fetcher."""
        logger.info("Would fetch market data here")
        return True

    async def run_all_now(self):
        """Run all jobs immediately."""
        logger.info("Running all jobs once")
        await self.run_market_data()
        logger.info("All jobs completed")

    def start(self):
        """Start the scheduler."""
        self.is_running = True
        logger.info("Scheduler started")
        
        # Just run once as a demonstration
        asyncio.run(self.run_all_now())
        
        logger.info("Scheduler demonstration complete")

    def stop(self):
        """Stop the scheduler."""
        self.is_running = False
        logger.info("Scheduler stopped")

def main():
    """Main entry point for the scheduler."""
    # Load environment variables
    load_dotenv()
    
    # Parse arguments
    args = setup_argparse()
    
    # Configure logging
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.info("Debug logging enabled")
    
    # Show dev mode status
    if args.dev:
        logger.info("Running in DEVELOPMENT mode")
        os.environ["DEMO_MODE"] = "true"  # Use demo data in dev mode
    
    # Create the scheduler
    scheduler = SimplifiedScheduler()
    
    # Run once if specified
    if args.once:
        logger.info("Running all jobs once and exiting")
        asyncio.run(scheduler.run_all_now())
        return
    
    # Start the scheduler
    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt detected, shutting down...")
        scheduler.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        scheduler.stop()
        sys.exit(1)

if __name__ == "__main__":
    main() 
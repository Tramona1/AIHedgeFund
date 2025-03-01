#!/usr/bin/env python
import os
import sys
import argparse
import asyncio
import logging
from dotenv import load_dotenv
from scheduler import Scheduler, logger

def setup_argparse():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='AI Hedge Fund Data Pipeline Scheduler')
    parser.add_argument('--dev', action='store_true', help='Run in development mode')
    parser.add_argument('--test', action='store_true', help='Run tests only')
    parser.add_argument('--once', action='store_true', help='Run all jobs once and exit')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    return parser.parse_args()

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
    scheduler = Scheduler()
    
    # Run test mode if specified
    if args.test:
        logger.info("Running tests and exiting")
        asyncio.run(scheduler.run_all_now())
        return
        
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
#!/usr/bin/env python3
"""
Unusual Whales API Integration Module
Provides functions for fetching data from the Unusual Whales API
for insider trades, political trades, and analyst sentiment.
"""

import os
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any
from pathlib import Path

import requests
from tenacity import retry, stop_after_attempt, wait_exponential
from requests_ratelimiter import LimiterSession
from dotenv import load_dotenv
from diskcache import Cache

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("unusual_whales_api.log")
    ]
)
logger = logging.getLogger("unusual_whales_api")

# API Configuration
API_BASE_URL = "https://api.unusualwhales.com/api/v1"
API_KEY = os.getenv("UNUSUAL_WHALES_API_KEY")

# Setup cache
cache = Cache(".cache")
CACHE_EXPIRY = 3600  # Cache for 1 hour

# Cache directory
# Create rate-limited session (8 requests per minute)
session = LimiterSession(per_second=0.13)

class UnusualWhalesError(Exception):
    """Custom exception for Unusual Whales API errors"""
    pass

def get_headers() -> Dict[str, str]:
    """Return headers for API requests"""
    if not API_KEY:
        raise UnusualWhalesError("UNUSUAL_WHALES_API_KEY environment variable not set")
    
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
def make_request(endpoint: str, params: Dict[str, Any] = None) -> Dict:
    """
    Make a request to the Unusual Whales API with retry logic
    
    Args:
        endpoint: API endpoint to query
        params: Query parameters
        
    Returns:
        Dict: API response
    """
    url = f"{API_BASE_URL}/{endpoint}"
    
    # Generate cache key based on endpoint and params
    cache_key = f"{endpoint}-{json.dumps(params or {})}"
    
    # Check cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        logger.info(f"Using cached data for {endpoint}")
        return cached_data
    
    try:
        logger.info(f"Making request to {url} with params {params}")
        response = session.get(url, headers=get_headers(), params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Cache successful response
        cache.set(cache_key, data, expire=CACHE_EXPIRY)
        
        return data
    except requests.RequestException as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        if hasattr(e.response, 'text'):
            logger.error(f"Response content: {e.response.text}")
        raise UnusualWhalesError(f"API request failed: {str(e)}")

def get_insider_trades(
    days: int = 7,
    symbols: Optional[List[str]] = None,
    transaction_type: Optional[str] = None,
    min_value: Optional[int] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Fetch insider trading data from Unusual Whales
    
    Args:
        days: Number of days to look back
        symbols: List of ticker symbols to filter by
        transaction_type: Filter by transaction type (Purchase, Sale)
        min_value: Minimum transaction value in dollars
        limit: Maximum number of records to return
        
    Returns:
        List[Dict]: List of insider trades
    """
    params = {"days": days, "limit": limit}
    
    if symbols:
        params["symbols"] = ",".join(symbols)
    if transaction_type:
        params["type"] = transaction_type
    if min_value:
        params["min_value"] = min_value
        
    try:
        response = make_request("insider/trades", params)
        return response.get("data", [])
    except Exception as e:
        logger.error(f"Failed to fetch insider trades: {str(e)}")
        raise

def get_political_trades(
    days: int = 30,
    symbols: Optional[List[str]] = None,
    politician: Optional[str] = None,
    party: Optional[str] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Fetch congressional trading data from Unusual Whales
    
    Args:
        days: Number of days to look back
        symbols: List of ticker symbols to filter by
        politician: Filter by politician name
        party: Filter by political party (Democratic, Republican, Independent)
        limit: Maximum number of records to return
        
    Returns:
        List[Dict]: List of political trades
    """
    params = {"days": days, "limit": limit}
    
    if symbols:
        params["symbols"] = ",".join(symbols)
    if politician:
        params["politician"] = politician
    if party:
        params["party"] = party
        
    try:
        response = make_request("congress/trades", params)
        return response.get("data", [])
    except Exception as e:
        logger.error(f"Failed to fetch political trades: {str(e)}")
        raise

def get_analyst_ratings(
    days: int = 30,
    symbols: Optional[List[str]] = None,
    firm: Optional[str] = None,
    rating_change: Optional[str] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Fetch analyst ratings and price targets from Unusual Whales
    
    Args:
        days: Number of days to look back
        symbols: List of ticker symbols to filter by
        firm: Filter by analyst firm
        rating_change: Filter by rating change (upgrade, downgrade, initiate, maintain)
        limit: Maximum number of records to return
        
    Returns:
        List[Dict]: List of analyst ratings
    """
    params = {"days": days, "limit": limit}
    
    if symbols:
        params["symbols"] = ",".join(symbols)
    if firm:
        params["firm"] = firm
    if rating_change:
        params["rating_change"] = rating_change
        
    try:
        response = make_request("analysts/ratings", params)
        return response.get("data", [])
    except Exception as e:
        logger.error(f"Failed to fetch analyst ratings: {str(e)}")
        raise

def get_unusual_options(
    days: int = 1,
    symbols: Optional[List[str]] = None,
    sentiment: Optional[str] = None,
    min_premium: Optional[int] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Fetch unusual options activity from Unusual Whales
    
    Args:
        days: Number of days to look back
        symbols: List of ticker symbols to filter by
        sentiment: Filter by sentiment (bullish, bearish)
        min_premium: Minimum premium paid in dollars
        limit: Maximum number of records to return
        
    Returns:
        List[Dict]: List of unusual options activity
    """
    params = {"days": days, "limit": limit}
    
    if symbols:
        params["symbols"] = ",".join(symbols)
    if sentiment:
        params["sentiment"] = sentiment
    if min_premium:
        params["min_premium"] = min_premium
        
    try:
        response = make_request("options/unusual", params)
        return response.get("data", [])
    except Exception as e:
        logger.error(f"Failed to fetch unusual options: {str(e)}")
        raise

def get_earnings_data(
    days_forward: int = 7,
    days_backward: int = 7,
    symbols: Optional[List[str]] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Fetch earnings announcements data
    
    Args:
        days_forward: Number of days to look forward for upcoming earnings
        days_backward: Number of days to look back for past earnings
        symbols: List of ticker symbols to filter by
        limit: Maximum number of records to return
        
    Returns:
        List[Dict]: List of earnings announcements
    """
    params = {
        "days_forward": days_forward,
        "days_backward": days_backward,
        "limit": limit
    }
    
    if symbols:
        params["symbols"] = ",".join(symbols)
        
    try:
        response = make_request("earnings/calendar", params)
        return response.get("data", [])
    except Exception as e:
        logger.error(f"Failed to fetch earnings data: {str(e)}")
        raise

def get_market_sentiment() -> Dict:
    """
    Fetch overall market sentiment and indicators
    
    Returns:
        Dict: Market sentiment data
    """
    try:
        response = make_request("market/sentiment")
        return response.get("data", {})
    except Exception as e:
        logger.error(f"Failed to fetch market sentiment: {str(e)}")
        raise

def format_insider_trade_for_db(trade: Dict) -> Dict:
    """Format insider trade data for database insertion"""
    return {
        "filing_id": trade.get("filing_id", ""),
        "symbol": trade.get("symbol", ""),
        "company_name": trade.get("company_name", ""),
        "insider_name": trade.get("insider_name", ""),
        "insider_title": trade.get("insider_title", ""),
        "transaction_type": trade.get("transaction_type", ""),
        "transaction_date": trade.get("transaction_date", ""),
        "shares": trade.get("shares", 0),
        "price": trade.get("price", 0.0),
        "total_value": trade.get("total_value", 0.0),
        "shares_owned_after": trade.get("shares_owned_after", 0),
        "filing_date": trade.get("filing_date", ""),
        "source": "Unusual Whales"
    }

def format_political_trade_for_db(trade: Dict) -> Dict:
    """Format political trade data for database insertion"""
    return {
        "politician_name": trade.get("politician_name", ""),
        "politician_office": trade.get("politician_office", ""),
        "party": trade.get("party", ""),
        "symbol": trade.get("symbol", ""),
        "asset_description": trade.get("asset_description", ""),
        "transaction_type": trade.get("transaction_type", ""),
        "transaction_date": trade.get("transaction_date", ""),
        "amount_range": trade.get("amount_range", ""),
        "filing_date": trade.get("filing_date", ""),
        "source": "Unusual Whales"
    }

def format_analyst_rating_for_db(rating: Dict) -> Dict:
    """Format analyst rating data for database insertion"""
    return {
        "symbol": rating.get("symbol", ""),
        "company_name": rating.get("company_name", ""),
        "analyst_firm": rating.get("firm", ""),
        "analyst_name": rating.get("analyst", ""),
        "rating": rating.get("rating", ""),
        "previous_rating": rating.get("previous_rating", ""),
        "rating_change": rating.get("rating_change", ""),
        "price_target": rating.get("price_target", 0.0),
        "previous_price_target": rating.get("previous_price_target", 0.0),
        "date": rating.get("date", ""),
        "notes": rating.get("notes", ""),
        "source": "Unusual Whales"
    }

def clear_cache() -> None:
    """Clear the API response cache"""
    cache.clear()
    logger.info("Cache cleared")

if __name__ == "__main__":
    # Example usage
    try:
        print("Fetching insider trades...")
        insider_trades = get_insider_trades(days=14, limit=5)
        for trade in insider_trades:
            print(f"{trade['insider_name']} - {trade['symbol']} - {trade['transaction_type']} - ${trade['total_value']:,.2f}")
        
        print("\nFetching political trades...")
        political_trades = get_political_trades(days=30, limit=5)
        for trade in political_trades:
            print(f"{trade['politician_name']} ({trade['party']}) - {trade['symbol']} - {trade['transaction_type']} - {trade['amount_range']}")
        
        print("\nFetching analyst ratings...")
        ratings = get_analyst_ratings(days=7, limit=5)
        for rating in ratings:
            print(f"{rating['firm']} - {rating['symbol']} - {rating['rating_change']} - PT: ${rating['price_target']}")
            
        print("\nFetching market sentiment...")
        sentiment = get_market_sentiment()
        print(f"Overall: {sentiment.get('overall_sentiment', 'N/A')}")
        print(f"VIX: {sentiment.get('vix', 'N/A')}")
        print(f"SPY: {sentiment.get('spy_change', 'N/A')}")
        
    except UnusualWhalesError as e:
        print(f"API Error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}") 
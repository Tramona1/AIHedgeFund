import asyncio
import logging
import json
import os
import time
from datetime import datetime, timedelta, date
import requests
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger("political-trades-fetcher")
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}',
    handlers=[logging.StreamHandler()]
)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Constants
POLITICAL_TRADES_TABLE = "political_trades"
DATA_DIR = os.path.join("data", "political_trades")
os.makedirs(DATA_DIR, exist_ok=True)

# House Stock Watcher API URL
HOUSE_STOCK_WATCHER_URL = "https://housestockwatcher.com/api"
SENATE_STOCK_WATCHER_URL = "https://senate-stock-watcher-data.s3-us-west-2.amazonaws.com"

# Companies & Symbols mapping file
STOCK_SYMBOLS_FILE = os.path.join("data", "stock_tickers.json")

class PoliticalTradesFetcher:
    def __init__(self, days_to_fetch: int = 30):
        """Initialize the political trades fetcher.
        
        Args:
            days_to_fetch: Number of days of data to fetch
        """
        self.days_to_fetch = days_to_fetch
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        self.stock_symbols = self._load_stock_symbols()
        
    async def run(self):
        """Run the complete political trades fetching process."""
        try:
            logger.info("Starting political trades fetching process", 
                       extra={"metadata": {"days_to_fetch": self.days_to_fetch}})
            
            # Fetch data from House Stock Watcher
            await self.fetch_house_trades()
            
            # Fetch data from Senate Stock Watcher
            await self.fetch_senate_trades()
            
            # Alternative source: Quiver Quant
            await self.fetch_from_quiver_quant()
            
            logger.info("Completed political trades fetching process", extra={"metadata": {}})
            return True
        except Exception as e:
            logger.error(f"Error in political trades fetching process: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return False

    async def fetch_house_trades(self):
        """Fetch trading data for House members."""
        try:
            logger.info("Fetching House trades", extra={"metadata": {}})
            
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=self.days_to_fetch)
            
            # Convert to ISO format for API
            start_date_str = start_date.strftime("%Y-%m-%d")
            
            # Pagination parameters
            page = 0
            per_page = 100
            has_more = True
            
            while has_more:
                try:
                    # Fetch data from House Stock Watcher API
                    url = f"{HOUSE_STOCK_WATCHER_URL}/transactions?page={page}&limit={per_page}"
                    logger.info(f"Fetching House trades page {page}", extra={"metadata": {"url": url}})
                    
                    response = self.session.get(url, timeout=30)
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    if not data or len(data) == 0:
                        has_more = False
                        continue
                    
                    # Process transactions
                    for transaction in data:
                        try:
                            # Check if the transaction is within our date range
                            transaction_date_str = transaction.get("transaction_date")
                            if not transaction_date_str:
                                continue
                                
                            try:
                                transaction_date = datetime.strptime(transaction_date_str, "%Y-%m-%d").date()
                            except ValueError:
                                # Try different formats
                                try:
                                    transaction_date = datetime.strptime(transaction_date_str, "%m/%d/%Y").date()
                                except ValueError:
                                    logger.warning(f"Invalid transaction date format: {transaction_date_str}", 
                                                 extra={"metadata": {"date": transaction_date_str}})
                                    continue
                            
                            # Skip if transaction is outside our date range
                            if transaction_date < start_date.date():
                                continue
                            
                            # Process the transaction
                            await self.process_house_transaction(transaction)
                            
                        except Exception as e:
                            logger.error(f"Error processing House transaction: {str(e)}", 
                                       extra={"metadata": {"error": str(e)}})
                    
                    # Move to next page
                    page += 1
                    
                    # Stop if we have fewer results than the page size
                    if len(data) < per_page:
                        has_more = False
                    
                    # Avoid overwhelming the API
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    logger.error(f"Error fetching House trades page {page}: {str(e)}", 
                               extra={"metadata": {"page": page, "error": str(e)}})
                    has_more = False
            
        except Exception as e:
            logger.error(f"Error fetching House trades: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})

    async def process_house_transaction(self, transaction: Dict[str, Any]):
        """Process a single House transaction."""
        try:
            # Extract transaction details
            transaction_id = transaction.get("disclosure_ptr_id") or transaction.get("id")
            if not transaction_id:
                transaction_id = f"house_{int(time.time())}_{transaction.get('representative')}"
            
            # Check if we've already processed this transaction
            if await self._transaction_exists(transaction_id):
                return
            
            politician_name = transaction.get("representative", "")
            ticker = transaction.get("ticker", "")
            asset_name = transaction.get("asset_description", "")
            transaction_date = transaction.get("transaction_date", "")
            filing_date = transaction.get("disclosure_date", transaction_date)
            transaction_type = transaction.get("type", "")
            amount = transaction.get("amount", "")
            
            # Handle missing ticker by trying to match with company name
            if not ticker and asset_name:
                ticker = self._find_ticker_by_company_name(asset_name)
            
            # Parse amount range to get an average value
            min_value, max_value = 0, 0
            
            if amount and isinstance(amount, str):
                try:
                    # Parse amount ranges like "$1,001 - $15,000"
                    amount = amount.replace("$", "").replace(",", "")
                    
                    if "-" in amount:
                        parts = amount.split("-")
                        min_value = float(parts[0].strip())
                        max_value = float(parts[1].strip())
                        value = (min_value + max_value) / 2  # Average value
                    else:
                        min_value = max_value = float(amount.strip())
                        value = min_value
                except ValueError:
                    value = 0
            else:
                value = 0
            
            # Create a normalized transaction type
            # Typical values from House: "purchase", "sale", "exchange"
            transaction_type = transaction_type.lower()
            if "purchase" in transaction_type:
                normalized_type = "BUY"
            elif "sale" in transaction_type:
                normalized_type = "SELL"
            else:
                normalized_type = transaction_type.upper()
            
            # Create the trade record
            trade_data = {
                "id": str(transaction_id),
                "politician_name": politician_name,
                "symbol": ticker,
                "asset_description": asset_name,
                "transaction_date": transaction_date,
                "filing_date": filing_date,
                "transaction_type": normalized_type,
                "amount_min": min_value,
                "amount_max": max_value,
                "amount": value,
                "comment": transaction.get("comment", ""),
                "party": transaction.get("party", ""),
                "state": transaction.get("state", ""),
                "district": transaction.get("district", ""),
                "chamber": "House",
                "source": "House Stock Watcher",
                "source_url": f"https://housestockwatcher.com/transaction/{transaction_id}",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Store in Supabase
            result = supabase.table(POLITICAL_TRADES_TABLE).upsert(trade_data).execute()
            
            if result.data:
                logger.info(f"Successfully stored House trade: {transaction_id}", 
                           extra={"metadata": {"id": transaction_id}})
            else:
                logger.warning(f"Failed to store House trade: {transaction_id}", 
                             extra={"metadata": {"id": transaction_id}})
            
        except Exception as e:
            logger.error(f"Error processing House transaction: {str(e)}", 
                       extra={"metadata": {"transaction": transaction, "error": str(e)}})

    async def fetch_senate_trades(self):
        """Fetch trading data for Senate members."""
        try:
            logger.info("Fetching Senate trades", extra={"metadata": {}})
            
            # Senate data is typically stored in a quarterly CSV file
            current_year = datetime.now().year
            current_quarter = (datetime.now().month - 1) // 3 + 1
            
            # Check current and previous quarter
            quarters_to_check = [
                (current_year, current_quarter),
                (current_year, current_quarter - 1) if current_quarter > 1 else (current_year - 1, 4)
            ]
            
            for year, quarter in quarters_to_check:
                try:
                    # Fetch the quarterly CSV file
                    url = f"{SENATE_STOCK_WATCHER_URL}/senator-transactions/transactions_{year}q{quarter}.csv"
                    logger.info(f"Fetching Senate trades for {year}Q{quarter}", 
                               extra={"metadata": {"url": url}})
                    
                    response = self.session.get(url, timeout=30)
                    
                    # Skip if file not found
                    if response.status_code == 404:
                        logger.info(f"Senate data for {year}Q{quarter} not available yet", 
                                   extra={"metadata": {"year": year, "quarter": quarter}})
                        continue
                    
                    response.raise_for_status()
                    
                    # Save the CSV file
                    csv_file = os.path.join(DATA_DIR, f"senate_transactions_{year}q{quarter}.csv")
                    with open(csv_file, "wb") as f:
                        f.write(response.content)
                    
                    # Process the CSV file
                    await self.process_senate_csv(csv_file, year, quarter)
                    
                except requests.exceptions.RequestException as e:
                    if "404" in str(e):
                        logger.info(f"Senate data for {year}Q{quarter} not available yet", 
                                   extra={"metadata": {"year": year, "quarter": quarter}})
                    else:
                        logger.error(f"Error fetching Senate trades for {year}Q{quarter}: {str(e)}", 
                                   extra={"metadata": {"year": year, "quarter": quarter, "error": str(e)}})
                except Exception as e:
                    logger.error(f"Error processing Senate trades for {year}Q{quarter}: {str(e)}", 
                               extra={"metadata": {"year": year, "quarter": quarter, "error": str(e)}})
            
            # Try to fetch the latest transactions from a more up-to-date source
            await self.fetch_latest_senate_transactions()
            
        except Exception as e:
            logger.error(f"Error fetching Senate trades: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})

    async def process_senate_csv(self, file_path: str, year: int, quarter: int):
        """Process a Senate transactions CSV file."""
        try:
            logger.info(f"Processing Senate CSV file: {file_path}", 
                       extra={"metadata": {"file": file_path}})
            
            # Calculate date range for filtering
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=self.days_to_fetch)
            
            # Read the CSV file
            df = pd.read_csv(file_path)
            
            # Process each transaction
            for _, row in df.iterrows():
                try:
                    # Parse the transaction date
                    transaction_date_str = row.get("transaction_date")
                    if not transaction_date_str or pd.isna(transaction_date_str):
                        continue
                    
                    try:
                        # Handle various date formats
                        if isinstance(transaction_date_str, str):
                            # Try different common formats
                            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"]:
                                try:
                                    transaction_date = datetime.strptime(transaction_date_str, fmt).date()
                                    break
                                except ValueError:
                                    continue
                            else:
                                # If no format worked
                                logger.warning(f"Unrecognized date format: {transaction_date_str}", 
                                             extra={"metadata": {"date": transaction_date_str}})
                                continue
                        else:
                            # Handle pandas datetime
                            transaction_date = pd.to_datetime(transaction_date_str).date()
                    except Exception:
                        logger.warning(f"Failed to parse date: {transaction_date_str}", 
                                     extra={"metadata": {"date": transaction_date_str}})
                        continue
                    
                    # Skip if transaction is outside our date range
                    if transaction_date < start_date:
                        continue
                    
                    # Create a unique transaction ID
                    senator_name = row.get("senator", "")
                    ticker = row.get("ticker", "")
                    asset_name = row.get("asset_description", "")
                    
                    # Generate a unique ID
                    transaction_id = f"senate_{senator_name.replace(' ', '_')}_{transaction_date_str}_{ticker or 'unknown'}_{int(time.time())}"
                    
                    # Check if we've already processed this transaction
                    if await self._transaction_exists(transaction_id):
                        continue
                    
                    # Handle missing ticker by trying to match with company name
                    if not ticker and asset_name:
                        ticker = self._find_ticker_by_company_name(asset_name)
                    
                    # Parse amount range to get an average value
                    amount = row.get("amount", "")
                    min_value, max_value = 0, 0
                    
                    if amount and not pd.isna(amount) and isinstance(amount, str):
                        try:
                            # Parse amount ranges like "$1,001 - $15,000"
                            amount = amount.replace("$", "").replace(",", "")
                            
                            if "-" in amount:
                                parts = amount.split("-")
                                min_value = float(parts[0].strip())
                                max_value = float(parts[1].strip())
                                value = (min_value + max_value) / 2  # Average value
                            else:
                                min_value = max_value = float(amount.strip())
                                value = min_value
                        except (ValueError, AttributeError):
                            value = 0
                    else:
                        value = 0
                    
                    # Create a normalized transaction type
                    transaction_type = str(row.get("type", "")).lower()
                    if "purchase" in transaction_type:
                        normalized_type = "BUY"
                    elif "sale" in transaction_type:
                        normalized_type = "SELL"
                    else:
                        normalized_type = transaction_type.upper()
                    
                    # Get filing date
                    filing_date = row.get("disclosure_date", transaction_date_str)
                    if pd.isna(filing_date):
                        filing_date = transaction_date_str
                        
                    # Create the trade record
                    trade_data = {
                        "id": transaction_id,
                        "politician_name": senator_name,
                        "symbol": ticker,
                        "asset_description": asset_name,
                        "transaction_date": str(transaction_date),
                        "filing_date": str(filing_date),
                        "transaction_type": normalized_type,
                        "amount_min": min_value,
                        "amount_max": max_value,
                        "amount": value,
                        "comment": str(row.get("comment", "")) if not pd.isna(row.get("comment", "")) else "",
                        "party": str(row.get("party", "")) if not pd.isna(row.get("party", "")) else "",
                        "state": str(row.get("state", "")) if not pd.isna(row.get("state", "")) else "",
                        "district": "",
                        "chamber": "Senate",
                        "source": "Senate Stock Watcher",
                        "source_url": str(row.get("ptr_link", "")) if not pd.isna(row.get("ptr_link", "")) else "",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    # Store in Supabase
                    result = supabase.table(POLITICAL_TRADES_TABLE).upsert(trade_data).execute()
                    
                    if result.data:
                        logger.info(f"Successfully stored Senate trade: {transaction_id}", 
                                   extra={"metadata": {"id": transaction_id}})
                    else:
                        logger.warning(f"Failed to store Senate trade: {transaction_id}", 
                                     extra={"metadata": {"id": transaction_id}})
                    
                except Exception as e:
                    logger.error(f"Error processing Senate transaction: {str(e)}", 
                               extra={"metadata": {"error": str(e)}})
            
        except Exception as e:
            logger.error(f"Error processing Senate CSV file {file_path}: {str(e)}", 
                       extra={"metadata": {"file": file_path, "error": str(e)}})

    async def fetch_latest_senate_transactions(self):
        """Fetch latest Senate transactions from Senate Stock Watcher."""
        try:
            logger.info("Fetching latest Senate transactions", extra={"metadata": {}})
            
            # Try to get the latest transactions from the website
            url = "https://senate-stock-watcher-data.s3-us-west-2.amazonaws.com/aggregate/senate-stock-watcher-extracted.json"
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if not data or "data" not in data:
                logger.warning("No latest Senate transactions found", extra={"metadata": {}})
                return
            
            # Calculate date range for filtering
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=self.days_to_fetch)
            
            # Process each transaction
            for transaction in data.get("data", []):
                try:
                    # Parse the transaction date
                    transaction_date_str = transaction.get("transaction_date")
                    if not transaction_date_str:
                        continue
                    
                    try:
                        # Handle various date formats
                        for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"]:
                            try:
                                transaction_date = datetime.strptime(transaction_date_str, fmt).date()
                                break
                            except ValueError:
                                continue
                        else:
                            # If no format worked
                            logger.warning(f"Unrecognized date format: {transaction_date_str}", 
                                         extra={"metadata": {"date": transaction_date_str}})
                            continue
                    except Exception:
                        logger.warning(f"Failed to parse date: {transaction_date_str}", 
                                     extra={"metadata": {"date": transaction_date_str}})
                        continue
                    
                    # Skip if transaction is outside our date range
                    if transaction_date < start_date:
                        continue
                    
                    # Create a unique transaction ID
                    senator_name = transaction.get("senator", "")
                    ticker = transaction.get("ticker", "")
                    asset_name = transaction.get("asset_description", "")
                    
                    # Generate a unique ID
                    transaction_id = f"senate_latest_{senator_name.replace(' ', '_')}_{transaction_date_str}_{ticker or 'unknown'}_{int(time.time())}"
                    
                    # Check if we've already processed this transaction
                    if await self._transaction_exists(transaction_id):
                        continue
                    
                    # Similar processing as in process_senate_csv
                    # (This is similar to the previous function but processes JSON instead of CSV)
                    # ... (processing code similar to process_senate_csv) ...
                    
                    # Parse amount range to get an average value
                    amount = transaction.get("amount", "")
                    min_value, max_value = 0, 0
                    
                    if amount and isinstance(amount, str):
                        try:
                            # Parse amount ranges like "$1,001 - $15,000"
                            amount = amount.replace("$", "").replace(",", "")
                            
                            if "-" in amount:
                                parts = amount.split("-")
                                min_value = float(parts[0].strip())
                                max_value = float(parts[1].strip())
                                value = (min_value + max_value) / 2  # Average value
                            else:
                                min_value = max_value = float(amount.strip())
                                value = min_value
                        except ValueError:
                            value = 0
                    else:
                        value = 0
                    
                    # Create a normalized transaction type
                    transaction_type = str(transaction.get("type", "")).lower()
                    if "purchase" in transaction_type:
                        normalized_type = "BUY"
                    elif "sale" in transaction_type:
                        normalized_type = "SELL"
                    else:
                        normalized_type = transaction_type.upper()
                    
                    # Create the trade record
                    trade_data = {
                        "id": transaction_id,
                        "politician_name": senator_name,
                        "symbol": ticker,
                        "asset_description": asset_name,
                        "transaction_date": str(transaction_date),
                        "filing_date": transaction.get("disclosure_date", str(transaction_date)),
                        "transaction_type": normalized_type,
                        "amount_min": min_value,
                        "amount_max": max_value,
                        "amount": value,
                        "comment": transaction.get("comment", ""),
                        "party": transaction.get("party", ""),
                        "state": transaction.get("state", ""),
                        "district": "",
                        "chamber": "Senate",
                        "source": "Senate Stock Watcher (Latest)",
                        "source_url": transaction.get("ptr_link", ""),
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    # Store in Supabase
                    result = supabase.table(POLITICAL_TRADES_TABLE).upsert(trade_data).execute()
                    
                    if result.data:
                        logger.info(f"Successfully stored latest Senate trade: {transaction_id}", 
                                   extra={"metadata": {"id": transaction_id}})
                    else:
                        logger.warning(f"Failed to store latest Senate trade: {transaction_id}", 
                                     extra={"metadata": {"id": transaction_id}})
                    
                except Exception as e:
                    logger.error(f"Error processing latest Senate transaction: {str(e)}", 
                               extra={"metadata": {"error": str(e)}})
            
        except Exception as e:
            logger.error(f"Error fetching latest Senate transactions: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})

    async def fetch_from_quiver_quant(self):
        """Fetch political trading data from Quiver Quant API."""
        try:
            logger.info("Fetching political trades from Quiver Quant", extra={"metadata": {}})
            
            # This is a placeholder for a commercial API
            # In a production environment, you would need an API key
            
            # Quiver Quant API URL
            QUIVER_API_KEY = os.getenv("QUIVER_API_KEY")
            
            if not QUIVER_API_KEY:
                logger.warning("No Quiver Quant API key found. Skipping.", extra={"metadata": {}})
                return
            
            # Example API endpoint for congressional trading
            url = "https://api.quiverquant.com/beta/live/congresstrading"
            
            headers = {
                "accept": "application/json",
                "X-CSRFToken": "quiverquant",
                "Authorization": f"Token {QUIVER_API_KEY}"
            }
            
            response = self.session.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Process the data
            for transaction in data:
                try:
                    # Skip if already processed
                    transaction_id = f"quiver_{transaction.get('ReportDate')}_{transaction.get('Ticker')}_{transaction.get('Representative')}"
                    
                    if await self._transaction_exists(transaction_id):
                        continue
                    
                    # Create the trade record
                    trade_data = {
                        "id": transaction_id,
                        "politician_name": transaction.get("Representative", ""),
                        "symbol": transaction.get("Ticker", ""),
                        "asset_description": transaction.get("Asset", ""),
                        "transaction_date": transaction.get("TransactionDate", ""),
                        "filing_date": transaction.get("ReportDate", ""),
                        "transaction_type": "BUY" if transaction.get("Transaction") == "Purchase" else "SELL",
                        "amount_min": 0,  # Quiver might not provide this detail
                        "amount_max": 0,
                        "amount": transaction.get("Amount", 0),
                        "comment": "",
                        "party": transaction.get("Party", ""),
                        "state": transaction.get("State", ""),
                        "district": transaction.get("District", ""),
                        "chamber": transaction.get("Chamber", ""),
                        "source": "Quiver Quant",
                        "source_url": "https://www.quiverquant.com/congresstrading/",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    # Store in Supabase
                    result = supabase.table(POLITICAL_TRADES_TABLE).upsert(trade_data).execute()
                    
                    if result.data:
                        logger.info(f"Successfully stored Quiver Quant trade: {transaction_id}", 
                                   extra={"metadata": {"id": transaction_id}})
                    else:
                        logger.warning(f"Failed to store Quiver Quant trade: {transaction_id}", 
                                     extra={"metadata": {"id": transaction_id}})
                    
                except Exception as e:
                    logger.error(f"Error processing Quiver Quant transaction: {str(e)}", 
                               extra={"metadata": {"error": str(e)}})
            
        except Exception as e:
            logger.error(f"Error fetching from Quiver Quant: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})

    def _load_stock_symbols(self) -> Dict[str, str]:
        """Load stock symbols from a JSON file."""
        try:
            # Check if the file exists
            if os.path.exists(STOCK_SYMBOLS_FILE):
                with open(STOCK_SYMBOLS_FILE, "r") as f:
                    symbols_data = json.load(f)
                    
                # Create a mapping of company names to tickers
                symbols_map = {}
                
                for entry in symbols_data:
                    company_name = entry.get("name", "").lower()
                    ticker = entry.get("symbol", "")
                    
                    if company_name and ticker:
                        symbols_map[company_name] = ticker
                        
                        # Also add shortened versions of the name
                        # E.g., "Apple Inc." -> "Apple"
                        for suffix in [" inc", " inc.", " corporation", " corp", " corp.", " company", " co", " co.", " ltd", " ltd."]:
                            if company_name.endswith(suffix):
                                short_name = company_name[:-len(suffix)].strip()
                                symbols_map[short_name] = ticker
                
                logger.info(f"Loaded {len(symbols_map)} company names to ticker mappings", 
                           extra={"metadata": {"count": len(symbols_map)}})
                
                return symbols_map
            else:
                # Create a dummy map with some well-known companies
                logger.warning(f"Stock symbols file not found: {STOCK_SYMBOLS_FILE}", 
                             extra={"metadata": {"file": STOCK_SYMBOLS_FILE}})
                
                return {
                    "apple": "AAPL",
                    "microsoft": "MSFT",
                    "amazon": "AMZN",
                    "google": "GOOGL",
                    "alphabet": "GOOGL",
                    "facebook": "META",
                    "meta": "META",
                    "meta platforms": "META",
                    "tesla": "TSLA",
                    "nvidia": "NVDA",
                    "jpmorgan": "JPM",
                    "jp morgan": "JPM",
                    "bank of america": "BAC",
                    "visa": "V",
                    "johnson & johnson": "JNJ",
                    "johnson and johnson": "JNJ",
                    "walmart": "WMT",
                    "mastercard": "MA"
                }
                
        except Exception as e:
            logger.error(f"Error loading stock symbols: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return {}

    def _find_ticker_by_company_name(self, company_name: str) -> str:
        """Find a ticker symbol by company name."""
        if not company_name or not isinstance(company_name, str):
            return ""
            
        company_name = company_name.lower()
        
        # Direct match
        if company_name in self.stock_symbols:
            return self.stock_symbols[company_name]
        
        # Check for partial matches
        for name, ticker in self.stock_symbols.items():
            if name in company_name or company_name in name:
                return ticker
                
        # No match found
        return ""

    async def _transaction_exists(self, transaction_id: str) -> bool:
        """Check if a transaction already exists in the database."""
        try:
            result = supabase.table(POLITICAL_TRADES_TABLE).select("id").eq("id", transaction_id).execute()
            return len(result.data) > 0
        except Exception:
            return False

async def main():
    """Main function to run the political trades fetcher."""
    fetcher = PoliticalTradesFetcher(days_to_fetch=30)
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main()) 
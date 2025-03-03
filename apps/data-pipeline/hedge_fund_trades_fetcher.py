#!/usr/bin/env python3
"""
Hedge Fund Trades Fetcher

This module fetches hedge fund trading data from the following sources:
1. SEC EDGAR 13F filings
2. WhaleWisdom API (if credentials available)
3. Fintel data

It processes the filings to:
- Extract hedge fund holdings
- Track changes in positions
- Identify new positions and exits
- Store in the Supabase database
"""

import asyncio
import logging
import json
import os
import re
import time
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional, Set, Tuple

import aiohttp
import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("hedge_fund_trades_fetcher")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
HEDGE_FUND_TRADES_TABLE = "hedge_fund_trades"

# SEC EDGAR configuration
SEC_BASE_URL = "https://www.sec.gov/Archives"
SEC_SEARCH_URL = "https://www.sec.gov/cgi-bin/browse-edgar"
SEC_USER_AGENT = os.getenv("SEC_USER_AGENT", "Financial Data Pipeline (blake@tramona.com)")

# WhaleWisdom API (if available)
WHALEWISDOM_API_KEY = os.getenv("WHALEWISDOM_API_KEY")

# Create data directory if it doesn't exist
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
HEDGE_FUNDS_FILE = os.path.join(DATA_DIR, "hedge_funds.json")
os.makedirs(DATA_DIR, exist_ok=True)

# List of top hedge funds to track
TOP_HEDGE_FUNDS = [
    {"name": "Bridgewater Associates", "manager": "Ray Dalio", "cik": "1350694"},
    {"name": "Renaissance Technologies", "manager": "Jim Simons", "cik": "1037389"},
    {"name": "AQR Capital Management", "manager": "Cliff Asness", "cik": "1167557"},
    {"name": "Two Sigma Investments", "manager": "John Overdeck", "cik": "1448376"},
    {"name": "Millennium Management", "manager": "Israel Englander", "cik": "1273087"},
    {"name": "Citadel Advisors", "manager": "Ken Griffin", "cik": "1423053"},
    {"name": "Elliott Management", "manager": "Paul Singer", "cik": "1048445"},
    {"name": "D.E. Shaw & Co.", "manager": "David E. Shaw", "cik": "1159229"},
    {"name": "Third Point", "manager": "Dan Loeb", "cik": "1040273"},
    {"name": "Tiger Global Management", "manager": "Chase Coleman", "cik": "1167483"},
    {"name": "Pershing Square Capital", "manager": "Bill Ackman", "cik": "1336528"},
    {"name": "Baupost Group", "manager": "Seth Klarman", "cik": "1061768"},
    {"name": "Viking Global Investors", "manager": "Andreas Halvorsen", "cik": "1103804"},
    {"name": "Appaloosa Management", "manager": "David Tepper", "cik": "1656456"},
    {"name": "Lone Pine Capital", "manager": "Stephen Mandel", "cik": "1061165"}
]

class HedgeFundTradesFetcher:
    def __init__(self, quarters_to_fetch: int = 1):
        # Initialize Supabase client
        if SUPABASE_URL and SUPABASE_KEY:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        else:
            logger.error("Supabase credentials are missing.")
            self.supabase = None
        
        # Number of quarters to look back
        self.quarters_to_fetch = quarters_to_fetch
        
        # Load complete list of tracked hedge funds
        self.hedge_funds = self._load_hedge_funds()
        
        # Cache for stock symbols
        self.stock_symbols = self._load_stock_symbols()
        
        # Store current date information
        self.current_date = datetime.now().date()
        self.quarters = self._get_recent_quarters(self.quarters_to_fetch)
    
    async def run(self):
        """Main method to run the hedge fund trades fetcher"""
        logger.info("Starting hedge fund trades fetching process")
        
        try:
            # Fetch 13F filings for tracked hedge funds
            await self.fetch_13f_filings()
            
            # Fetch from WhaleWisdom if API key is available
            if WHALEWISDOM_API_KEY:
                await self.fetch_from_whalewisdom()
            
            # Fetch additional data from Fintel
            await self.fetch_from_fintel()
            
            logger.info("Hedge fund trades fetching process completed")
            return True
        except Exception as e:
            logger.error(f"Error in hedge fund trades fetching process: {e}")
            return False
    
    async def fetch_13f_filings(self):
        """Fetch 13F filings from SEC EDGAR for tracked hedge funds"""
        logger.info(f"Fetching 13F filings for {len(self.hedge_funds)} hedge funds")
        
        for fund in self.hedge_funds:
            try:
                cik = fund.get("cik")
                if not cik:
                    logger.warning(f"No CIK found for {fund.get('name')}, skipping")
                    continue
                
                # Fetch 13F filings for this fund
                logger.info(f"Fetching 13F filings for {fund.get('name')} (CIK: {cik})")
                
                # SEC rate limits - be respectful
                await asyncio.sleep(0.1)
                
                # Search for 13F-HR filings
                url = f"{SEC_SEARCH_URL}?CIK={cik}&type=13F-HR&count=10"
                headers = {"User-Agent": SEC_USER_AGENT}
                
                response = requests.get(url, headers=headers)
                if response.status_code != 200:
                    logger.error(f"Failed to fetch 13F filings for {fund.get('name')}: Status {response.status_code}")
                    continue
                
                # Parse the search results
                soup = BeautifulSoup(response.content, "html.parser")
                
                # Find the filing links
                filing_links = []
                filing_dates = []
                
                # Extract filings from the table
                filing_tables = soup.select("table.tableFile2")
                if filing_tables:
                    rows = filing_tables[0].select("tr")
                    for row in rows[1:]:  # Skip header row
                        cells = row.select("td")
                        if len(cells) >= 3:
                            filing_type = cells[0].text.strip()
                            if "13F-HR" in filing_type and "13F-HR/A" not in filing_type:  # Skip amendments
                                filing_date_text = cells[2].text.strip()
                                try:
                                    filing_date = datetime.strptime(filing_date_text, "%Y-%m-%d").date()
                                    
                                    # Only process filings from recent quarters
                                    if any(self._is_same_quarter(filing_date, q) for q in self.quarters):
                                        # Find the documents link
                                        doc_link = cells[1].find("a", href=True)
                                        if doc_link:
                                            filing_links.append(f"https://www.sec.gov{doc_link['href']}")
                                            filing_dates.append(filing_date)
                                except ValueError:
                                    logger.warning(f"Could not parse filing date: {filing_date_text}")
                
                # Process each filing
                for i, filing_link in enumerate(filing_links):
                    try:
                        filing_date = filing_dates[i]
                        logger.info(f"Processing 13F filing for {fund.get('name')} from {filing_date}")
                        
                        # SEC rate limits - be respectful
                        await asyncio.sleep(0.1)
                        
                        # Get the filing detail page
                        detail_response = requests.get(filing_link, headers=headers)
                        if detail_response.status_code != 200:
                            logger.error(f"Failed to fetch filing detail: Status {detail_response.status_code}")
                            continue
                        
                        # Parse the detail page
                        detail_soup = BeautifulSoup(detail_response.content, "html.parser")
                        
                        # Find the XML file (Information Table)
                        xml_link = None
                        for table_row in detail_soup.select("table.tableFile tr"):
                            cells = table_row.select("td")
                            if len(cells) >= 3 and "INFORMATION TABLE" in cells[1].text:
                                link = cells[2].find("a", href=True)
                                if link:
                                    xml_link = f"https://www.sec.gov{link['href']}"
                                    break
                        
                        if not xml_link:
                            # Try another format for the documents table
                            for table_row in detail_soup.select("div#formDiv table tr"):
                                cells = table_row.select("td")
                                if len(cells) >= 4 and "INFORMATION TABLE" in cells[3].text:
                                    link = cells[2].find("a", href=True)
                                    if link:
                                        xml_link = f"https://www.sec.gov{link['href']}"
                                        break
                        
                        if xml_link:
                            # Process the XML Information Table
                            await self._process_13f_information_table(fund, xml_link, filing_date)
                        else:
                            logger.warning(f"Could not find Information Table XML for {fund.get('name')}")
                    except Exception as e:
                        logger.error(f"Error processing filing {filing_link}: {e}")
                        continue
                        
            except Exception as e:
                logger.error(f"Error fetching 13F filings for {fund.get('name')}: {e}")
    
    async def _process_13f_information_table(self, fund: Dict[str, Any], xml_link: str, filing_date: date):
        """Process the 13F Information Table XML file"""
        try:
            # SEC rate limits - be respectful
            await asyncio.sleep(0.1)
            
            # Get the XML file
            headers = {"User-Agent": SEC_USER_AGENT}
            response = requests.get(xml_link, headers=headers)
            if response.status_code != 200:
                logger.error(f"Failed to fetch XML file: Status {response.status_code}")
                return
            
            # Parse the XML
            soup = BeautifulSoup(response.content, "xml")
            if not soup:
                # Fallback to lxml parser
                soup = BeautifulSoup(response.content, "lxml")
            
            # Find all InfoTable entries
            info_tables = soup.find_all("infoTable")
            logger.info(f"Found {len(info_tables)} holdings for {fund.get('name')}")
            
            # Process each holding
            trades = []
            for info_table in info_tables:
                try:
                    # Extract holding information
                    name_of_issuer = info_table.find("nameOfIssuer")
                    title_of_class = info_table.find("titleOfClass")
                    cusip = info_table.find("cusip")
                    value = info_table.find("value")
                    shares = info_table.find("sshPrnamt")
                    shares_type = info_table.find("sshPrnamtType")
                    
                    if not name_of_issuer or not cusip or not value or not shares:
                        continue
                    
                    name_of_issuer = name_of_issuer.text.strip()
                    cusip_value = cusip.text.strip()
                    value_in_thousands = int(value.text.strip()) * 1000  # Values reported in thousands
                    shares_count = int(shares.text.strip())
                    
                    # Find ticker symbol for this CUSIP
                    symbol = self._get_symbol_for_cusip(cusip_value)
                    
                    # Create trade record
                    trade = {
                        "fund_name": fund.get("name"),
                        "manager": fund.get("manager", ""),
                        "cik": fund.get("cik"),
                        "filing_date": filing_date.isoformat(),
                        "quarter_end": self._get_quarter_end_date(filing_date).isoformat(),
                        "company_name": name_of_issuer,
                        "symbol": symbol,
                        "cusip": cusip_value,
                        "value": value_in_thousands,
                        "shares": shares_count,
                        "shares_type": shares_type.text.strip() if shares_type else "SH",  # Default to SH (shares)
                        "source": "sec_edgar"
                    }
                    
                    # Generate a unique ID for this holding
                    trade_id = f"{fund.get('cik')}_{cusip_value}_{filing_date.isoformat()}"
                    trade["trade_id"] = trade_id
                    
                    trades.append(trade)
                    
                except Exception as e:
                    logger.error(f"Error processing holding: {e}")
                    continue
            
            # Save all trades to the database
            if trades:
                await self._save_trades_to_database(trades)
                
        except Exception as e:
            logger.error(f"Error processing 13F Information Table: {e}")
    
    async def fetch_from_whalewisdom(self):
        """Fetch hedge fund holdings data from WhaleWisdom API"""
        if not WHALEWISDOM_API_KEY:
            logger.info("WhaleWisdom API key not available, skipping")
            return
        
        logger.info("Fetching hedge fund data from WhaleWisdom")
        
        for fund in self.hedge_funds:
            try:
                filer_id = fund.get("whalewisdom_id") or fund.get("cik")
                if not filer_id:
                    logger.warning(f"No WhaleWisdom ID or CIK found for {fund.get('name')}, skipping")
                    continue
                
                logger.info(f"Fetching WhaleWisdom data for {fund.get('name')}")
                
                # API rate limits
                await asyncio.sleep(1)
                
                # Fetch the latest quarter data
                url = f"https://api.whalewisdom.com/api/v1/filer/{filer_id}/holdings"
                headers = {
                    "Authorization": f"Bearer {WHALEWISDOM_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                response = requests.get(url, headers=headers)
                if response.status_code != 200:
                    logger.error(f"Failed to fetch WhaleWisdom data: Status {response.status_code}")
                    continue
                
                data = response.json()
                if "holdings" not in data:
                    logger.warning(f"No holdings data found for {fund.get('name')}")
                    continue
                
                # Process holdings
                holdings = data["holdings"]
                trades = []
                
                filing_date = datetime.strptime(data.get("as_of_date", ""), "%Y-%m-%d").date()
                
                for holding in holdings:
                    try:
                        symbol = holding.get("ticker")
                        if not symbol:
                            continue
                        
                        # Create trade record
                        trade = {
                            "fund_name": fund.get("name"),
                            "manager": fund.get("manager", ""),
                            "cik": fund.get("cik"),
                            "filing_date": filing_date.isoformat(),
                            "quarter_end": self._get_quarter_end_date(filing_date).isoformat(),
                            "company_name": holding.get("security_name", ""),
                            "symbol": symbol,
                            "cusip": holding.get("cusip", ""),
                            "value": int(float(holding.get("value", 0))),
                            "shares": int(float(holding.get("shares", 0))),
                            "shares_type": "SH",  # Default to SH (shares)
                            "source": "whalewisdom"
                        }
                        
                        # Generate a unique ID for this holding
                        trade_id = f"{fund.get('cik')}_{symbol}_{filing_date.isoformat()}"
                        trade["trade_id"] = trade_id
                        
                        # Check if this is a new position or change
                        prev_shares = float(holding.get("prev_shares", 0))
                        if prev_shares == 0:
                            trade["transaction_type"] = "NEW"
                        elif float(holding.get("shares", 0)) > prev_shares:
                            trade["transaction_type"] = "BUY"
                        elif float(holding.get("shares", 0)) < prev_shares:
                            trade["transaction_type"] = "SELL"
                        else:
                            trade["transaction_type"] = "HOLD"
                        
                        trades.append(trade)
                        
                    except Exception as e:
                        logger.error(f"Error processing WhaleWisdom holding: {e}")
                        continue
                
                # Save all trades to the database
                if trades:
                    await self._save_trades_to_database(trades)
                    
            except Exception as e:
                logger.error(f"Error fetching WhaleWisdom data for {fund.get('name')}: {e}")
    
    async def fetch_from_fintel(self):
        """Fetch recent hedge fund activity from Fintel"""
        logger.info("Fetching recent hedge fund activity from Fintel")
        
        try:
            # Fintel's institutional ownership changes page
            url = "https://fintel.io/institutional-ownership-changes"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                logger.error(f"Failed to fetch Fintel data: Status {response.status_code}")
                return
            
            # Parse the page
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Find the table with the latest institutional ownership changes
            tables = soup.find_all("table")
            
            if not tables:
                logger.warning("No tables found on Fintel page")
                return
            
            # Process the first table, which should contain the latest changes
            rows = tables[0].find_all("tr")
            
            if len(rows) <= 1:  # Only header row
                logger.warning("No data rows found in Fintel table")
                return
            
            trades = []
            
            # Skip the header row
            for row in rows[1:]:
                try:
                    cells = row.find_all("td")
                    if len(cells) < 6:
                        continue
                    
                    # Extract data from cells
                    date_cell = cells[0].text.strip()
                    fund_name_cell = cells[1].text.strip()
                    stock_cell = cells[2].text.strip()
                    action_cell = cells[3].text.strip()
                    shares_cell = cells[4].text.strip().replace(",", "")
                    value_cell = cells[5].text.strip().replace(",", "").replace("$", "")
                    
                    # Parse the date
                    try:
                        filing_date = datetime.strptime(date_cell, "%Y-%m-%d").date()
                    except ValueError:
                        logger.warning(f"Could not parse Fintel date: {date_cell}")
                        continue
                    
                    # Only process recent filings (last 30 days)
                    if (datetime.now().date() - filing_date).days > 30:
                        continue
                    
                    # Extract ticker symbol
                    symbol_match = re.search(r'\(([A-Z]+)\)', stock_cell)
                    if symbol_match:
                        symbol = symbol_match.group(1)
                        company_name = stock_cell.split('(')[0].strip()
                    else:
                        logger.warning(f"Could not extract symbol from: {stock_cell}")
                        continue
                    
                    # Determine transaction type
                    if "new position" in action_cell.lower():
                        transaction_type = "NEW"
                    elif "increased" in action_cell.lower():
                        transaction_type = "BUY"
                    elif "decreased" in action_cell.lower() or "reduced" in action_cell.lower():
                        transaction_type = "SELL"
                    elif "sold out" in action_cell.lower() or "liquidated" in action_cell.lower():
                        transaction_type = "SOLD OUT"
                    else:
                        transaction_type = "UNKNOWN"
                    
                    # Parse shares and value
                    try:
                        shares = int(float(shares_cell))
                        value = int(float(value_cell))
                    except ValueError:
                        logger.warning(f"Could not parse shares or value: {shares_cell}, {value_cell}")
                        continue
                    
                    # Match fund to our tracked funds if possible
                    matched_fund = None
                    for fund in self.hedge_funds:
                        if fund_name_cell.lower() in fund.get("name", "").lower():
                            matched_fund = fund
                            break
                    
                    # Create trade record
                    trade = {
                        "fund_name": matched_fund.get("name") if matched_fund else fund_name_cell,
                        "manager": matched_fund.get("manager", "") if matched_fund else "",
                        "cik": matched_fund.get("cik", "") if matched_fund else "",
                        "filing_date": filing_date.isoformat(),
                        "quarter_end": self._get_quarter_end_date(filing_date).isoformat(),
                        "company_name": company_name,
                        "symbol": symbol,
                        "value": value,
                        "shares": shares,
                        "transaction_type": transaction_type,
                        "shares_type": "SH",  # Default to SH (shares)
                        "source": "fintel"
                    }
                    
                    # Generate a unique ID for this trade
                    fund_id = matched_fund.get("cik", "") if matched_fund else fund_name_cell
                    trade_id = f"{fund_id}_{symbol}_{filing_date.isoformat()}"
                    trade["trade_id"] = trade_id
                    
                    trades.append(trade)
                    
                except Exception as e:
                    logger.error(f"Error processing Fintel row: {e}")
                    continue
            
            # Save all trades to the database
            if trades:
                await self._save_trades_to_database(trades)
                
        except Exception as e:
            logger.error(f"Error fetching data from Fintel: {e}")
    
    async def _save_trades_to_database(self, trades: List[Dict[str, Any]]):
        """Save trades to the Supabase database"""
        if not self.supabase:
            logger.error("No Supabase client available, cannot save to database")
            return
        
        logger.info(f"Saving {len(trades)} hedge fund trades to database")
        
        try:
            # Process trades in batches to avoid database limitations
            batch_size = 100
            for i in range(0, len(trades), batch_size):
                batch = trades[i:i+batch_size]
                
                # Check which trades already exist to avoid duplicates
                trade_ids = [trade["trade_id"] for trade in batch]
                existing_trades = set()
                
                existing_result = self.supabase.table(HEDGE_FUND_TRADES_TABLE) \
                    .select("trade_id") \
                    .in_("trade_id", trade_ids) \
                    .execute()
                
                if hasattr(existing_result, 'data'):
                    existing_trades = {item.get("trade_id") for item in existing_result.data}
                
                # Filter out existing trades
                new_trades = [trade for trade in batch if trade["trade_id"] not in existing_trades]
                
                if not new_trades:
                    logger.info("No new trades to insert in this batch")
                    continue
                
                # Add timestamps
                now = datetime.now().isoformat()
                for trade in new_trades:
                    trade["created_at"] = now
                    trade["updated_at"] = now
                
                # Insert new trades
                result = self.supabase.table(HEDGE_FUND_TRADES_TABLE).insert(new_trades).execute()
                
                if hasattr(result, 'data'):
                    logger.info(f"Successfully saved {len(result.data)} new hedge fund trades")
                else:
                    logger.warning("Failed to save trades to database")
                
        except Exception as e:
            logger.error(f"Error saving trades to database: {e}")
    
    def _get_recent_quarters(self, num_quarters: int) -> List[date]:
        """Get a list of recent quarter end dates"""
        quarters = []
        current_date = self.current_date
        
        for i in range(num_quarters):
            current_year = current_date.year
            
            # Determine which quarter we're in and get its end date
            if current_date.month <= 3:
                # Q1
                quarter_end = date(current_year, 3, 31)
            elif current_date.month <= 6:
                # Q2
                quarter_end = date(current_year, 6, 30)
            elif current_date.month <= 9:
                # Q3
                quarter_end = date(current_year, 9, 30)
            else:
                # Q4
                quarter_end = date(current_year, 12, 31)
            
            quarters.append(quarter_end)
            
            # Go to the previous quarter
            if current_date.month <= 3:
                current_date = date(current_year - 1, 12, 31)
            elif current_date.month <= 6:
                current_date = date(current_year, 3, 31)
            elif current_date.month <= 9:
                current_date = date(current_year, 6, 30)
            else:
                current_date = date(current_year, 9, 30)
        
        return quarters
    
    def _get_quarter_end_date(self, filing_date: date) -> date:
        """Get the quarter end date based on a filing date"""
        year = filing_date.year
        
        # 13F filings are typically made within 45 days of quarter end
        if filing_date.month <= 2 or (filing_date.month == 3 and filing_date.day <= 15):
            # Filing for Q4 of previous year
            return date(year - 1, 12, 31)
        elif filing_date.month <= 5 or (filing_date.month == 6 and filing_date.day <= 15):
            # Filing for Q1
            return date(year, 3, 31)
        elif filing_date.month <= 8 or (filing_date.month == 9 and filing_date.day <= 15):
            # Filing for Q2
            return date(year, 6, 30)
        else:
            # Filing for Q3
            return date(year, 9, 30)
    
    def _is_same_quarter(self, date1: date, date2: date) -> bool:
        """Check if two dates are in the same quarter"""
        year1, month1 = date1.year, date1.month
        year2, month2 = date2.year, date2.month
        
        quarter1 = (month1 - 1) // 3 + 1
        quarter2 = (month2 - 1) // 3 + 1
        
        return year1 == year2 and quarter1 == quarter2
    
    def _get_symbol_for_cusip(self, cusip: str) -> str:
        """Get stock symbol for a CUSIP"""
        # First check our cache of stock symbols
        for symbol, details in self.stock_symbols.items():
            if details.get("cusip") == cusip:
                return symbol
        
        # If not found, try to look it up (simplified)
        try:
            # This is a placeholder - In a real implementation, you would use a 
            # financial data provider API to look up CUSIP to symbol mapping
            return ""
        except Exception as e:
            logger.error(f"Error looking up symbol for CUSIP {cusip}: {e}")
            return ""
    
    def _load_hedge_funds(self) -> List[Dict[str, Any]]:
        """Load the list of hedge funds to track"""
        try:
            if os.path.exists(HEDGE_FUNDS_FILE):
                with open(HEDGE_FUNDS_FILE, 'r') as f:
                    return json.load(f)
            else:
                # Save the default list for future use
                with open(HEDGE_FUNDS_FILE, 'w') as f:
                    json.dump(TOP_HEDGE_FUNDS, f, indent=2)
                
                return TOP_HEDGE_FUNDS
                
        except Exception as e:
            logger.error(f"Error loading hedge funds list: {e}")
            return TOP_HEDGE_FUNDS
    
    def _load_stock_symbols(self) -> Dict[str, Dict[str, str]]:
        """Load stock symbols including CUSIP information"""
        try:
            stock_symbols_file = os.path.join(DATA_DIR, "stock_symbols.json")
            
            if os.path.exists(stock_symbols_file):
                with open(stock_symbols_file, 'r') as f:
                    return json.load(f)
            else:
                # Create a minimal mapping
                symbols = {}
                
                # Save for future use
                with open(stock_symbols_file, 'w') as f:
                    json.dump(symbols, f, indent=2)
                
                return symbols
                
        except Exception as e:
            logger.error(f"Error loading stock symbols: {e}")
            return {}

async def main():
    """Main entry point for the hedge fund trades fetcher"""
    fetcher = HedgeFundTradesFetcher()
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main()) 
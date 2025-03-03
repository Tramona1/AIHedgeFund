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
logger = logging.getLogger("insider-trades-fetcher")
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}',
    handlers=[logging.StreamHandler()]
)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SEC_USER_AGENT = os.getenv("SEC_USER_AGENT", "InsiderTradesFetcher test@example.com")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Constants
INSIDER_TRADES_TABLE = "insider_trades"
DATA_DIR = os.path.join("data", "insider_trades")
os.makedirs(DATA_DIR, exist_ok=True)

# SEC EDGAR URLs
SEC_BASE_URL = "https://www.sec.gov"
EDGAR_SEARCH_URL = f"{SEC_BASE_URL}/cgi-bin/browse-edgar"
FORM_4_SEARCH_URL = f"{EDGAR_SEARCH_URL}?action=getcurrent&type=4&count=100"

class InsiderTradesFetcher:
    def __init__(self, days_to_fetch: int = 7):
        """Initialize the insider trades fetcher.
        
        Args:
            days_to_fetch: Number of days of data to fetch
        """
        self.days_to_fetch = days_to_fetch
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": SEC_USER_AGENT,
            "Accept-Encoding": "gzip, deflate",
            "Host": "www.sec.gov"
        })
        
    async def run(self):
        """Run the complete insider trades fetching process."""
        try:
            logger.info("Starting insider trades fetching process", 
                       extra={"metadata": {"days_to_fetch": self.days_to_fetch}})
            
            # Method 1: Direct from SEC EDGAR
            await self.fetch_recent_form4_filings()
            
            # Method 2: From alternative data sources like OpenInsider
            await self.fetch_from_open_insider()
            
            logger.info("Completed insider trades fetching process", extra={"metadata": {}})
            return True
        except Exception as e:
            logger.error(f"Error in insider trades fetching process: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return False
    
    async def fetch_recent_form4_filings(self):
        """Fetch recent Form 4 filings directly from SEC EDGAR."""
        try:
            logger.info("Fetching recent Form 4 filings from SEC EDGAR", extra={"metadata": {}})
            
            # Set up pagination
            start = 0
            count = 100
            max_pages = 5  # Limit to avoid overwhelming the API
            
            for page in range(max_pages):
                try:
                    # Respect SEC rate limits - max 10 requests per second
                    await asyncio.sleep(0.1)
                    
                    # Fetch the page listing Form 4 filings
                    search_url = f"{FORM_4_SEARCH_URL}&start={start}&count={count}"
                    logger.info(f"Fetching Form 4 page {page+1}", 
                               extra={"metadata": {"url": search_url}})
                    
                    response = self.session.get(search_url, timeout=30)
                    response.raise_for_status()
                    
                    # Parse the HTML
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find all entries in the table
                    entries = soup.select('tr.odd, tr.even')
                    
                    if not entries:
                        logger.info("No more Form 4 entries found", extra={"metadata": {}})
                        break
                    
                    logger.info(f"Found {len(entries)} Form 4 entries on page {page+1}", 
                               extra={"metadata": {"count": len(entries)}})
                    
                    # Process each entry
                    for entry in entries:
                        try:
                            # Get filing details
                            columns = entry.find_all('td')
                            if len(columns) < 5:
                                continue
                                
                            # Get the filing link
                            filing_link_elem = columns[1].find('a', href=True)
                            if not filing_link_elem:
                                continue
                                
                            filing_link = f"{SEC_BASE_URL}{filing_link_elem['href']}"
                            
                            # Get filing date
                            filing_date_text = columns[3].text.strip()
                            try:
                                filing_date = datetime.strptime(filing_date_text, '%Y-%m-%d').date()
                            except ValueError:
                                # Try another format if the first one fails
                                filing_date = datetime.strptime(filing_date_text, '%m/%d/%Y').date()
                            
                            # Check if the filing is within our date range
                            today = date.today()
                            if (today - filing_date).days > self.days_to_fetch:
                                continue
                            
                            # Get company name and ticker
                            company_info = columns[0].text.strip()
                            company_name = company_info
                            ticker = ""
                            
                            # Try to extract ticker from company info (Format: NAME (TICKER))
                            if '(' in company_info and ')' in company_info:
                                company_parts = company_info.rsplit('(', 1)
                                company_name = company_parts[0].strip()
                                ticker = company_parts[1].split(')', 1)[0].strip()
                            
                            # Get filing type
                            filing_type = columns[2].text.strip()
                            
                            if filing_type != "4":
                                continue  # Just to be safe, we only want Form 4
                            
                            # Process the Form 4 filing
                            await self.process_form4_filing(filing_link, ticker, company_name, filing_date)
                            
                        except Exception as e:
                            logger.error(f"Error processing Form 4 entry: {str(e)}", 
                                       extra={"metadata": {"error": str(e)}})
                    
                    # Move to next page
                    start += count
                    
                    # If we got fewer results than expected, we're done
                    if len(entries) < count:
                        break
                        
                except Exception as e:
                    logger.error(f"Error fetching Form 4 page {page+1}: {str(e)}", 
                               extra={"metadata": {"page": page+1, "error": str(e)}})
                    break
            
        except Exception as e:
            logger.error(f"Error fetching Form 4 filings: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
    
    async def process_form4_filing(self, filing_url: str, ticker: str, company_name: str, filing_date: date):
        """Process a Form 4 filing to extract insider trading information."""
        try:
            # Get filing accession number for tracking
            accession_number = filing_url.split('accession_number=')[1] if 'accession_number=' in filing_url else 'unknown'
            
            logger.info(f"Processing Form 4 filing: {accession_number}", 
                       extra={"metadata": {"url": filing_url, "ticker": ticker}})
            
            # Check if we've already processed this filing
            if await self._filing_exists(accession_number):
                logger.info(f"Filing already processed, skipping: {accession_number}", 
                           extra={"metadata": {"accession_number": accession_number}})
                return
            
            # Get the filing detail page
            await asyncio.sleep(0.1)  # Respect SEC rate limits
            response = self.session.get(filing_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find the XML link for the filing
            xml_link = None
            for link in soup.find_all('a', href=True):
                if 'primary_doc.xml' in link['href']:
                    xml_link = f"{SEC_BASE_URL}{link['href']}"
                    break
            
            if not xml_link:
                logger.warning(f"No XML link found for filing: {accession_number}", 
                             extra={"metadata": {"url": filing_url}})
                return
                
            # Get the XML content
            await asyncio.sleep(0.1)  # Respect SEC rate limits
            xml_response = self.session.get(xml_link, timeout=30)
            xml_response.raise_for_status()
            
            # Parse the XML to extract insider trading details
            insider_trades = self._parse_form4_xml(xml_response.text, accession_number, ticker, company_name, filing_date)
            
            if not insider_trades:
                logger.warning(f"No insider trades found in filing: {accession_number}", 
                             extra={"metadata": {"url": filing_url}})
                return
                
            # Store the insider trades in Supabase
            for trade in insider_trades:
                result = supabase.table(INSIDER_TRADES_TABLE).upsert(trade).execute()
                
                if result.data:
                    logger.info(f"Successfully stored insider trade: {trade.get('id')}", 
                               extra={"metadata": {"id": trade.get('id')}})
                else:
                    logger.warning(f"Failed to store insider trade: {trade.get('id')}", 
                                 extra={"metadata": {"id": trade.get('id')}})
            
        except Exception as e:
            logger.error(f"Error processing Form 4 filing {filing_url}: {str(e)}", 
                       extra={"metadata": {"url": filing_url, "error": str(e)}})
    
    def _parse_form4_xml(self, xml_content: str, accession_number: str, ticker: str, company_name: str, filing_date: date) -> List[Dict[str, Any]]:
        """Parse Form 4 XML to extract insider trading information."""
        try:
            # Use BeautifulSoup to parse the XML
            soup = BeautifulSoup(xml_content, 'xml')
            if not soup:
                soup = BeautifulSoup(xml_content, 'html.parser')
            
            # List to store all trades from this filing
            insider_trades = []
            
            # Get insider information
            try:
                # Get reporting owner name
                owner_element = soup.find('reportingOwner')
                
                owner_name = ""
                if owner_element:
                    owner_name_element = owner_element.find('rptOwnerName')
                    if owner_name_element:
                        owner_name = owner_name_element.text.strip()
                    else:
                        # Try individual name components
                        first_name = owner_element.find('rptOwnerFirstName')
                        middle_name = owner_element.find('rptOwnerMiddleName')
                        last_name = owner_element.find('rptOwnerLastName')
                        
                        name_parts = []
                        if first_name: name_parts.append(first_name.text.strip())
                        if middle_name: name_parts.append(middle_name.text.strip())
                        if last_name: name_parts.append(last_name.text.strip())
                        
                        owner_name = ' '.join(name_parts)
                
                # Get insider title/relationship to company
                relationship_element = soup.find('officerTitle')
                title = relationship_element.text.strip() if relationship_element else ""
                
                if not title:
                    # Check director/officer/other status
                    is_director = soup.find('isDirector')
                    is_officer = soup.find('isOfficer')
                    is_ten_percent_owner = soup.find('isTenPercentOwner')
                    
                    relationship_parts = []
                    if is_director and is_director.text.strip() == '1':
                        relationship_parts.append("Director")
                    if is_officer and is_officer.text.strip() == '1':
                        relationship_parts.append("Officer")
                    if is_ten_percent_owner and is_ten_percent_owner.text.strip() == '1':
                        relationship_parts.append("10% Owner")
                        
                    title = ', '.join(relationship_parts)
            except Exception as e:
                logger.warning(f"Error extracting insider details: {str(e)}", 
                             extra={"metadata": {"error": str(e)}})
                owner_name = "Unknown"
                title = "Unknown"
            
            # Get transaction details
            non_derivative_transactions = soup.find_all('nonDerivativeTransaction')
            derivative_transactions = soup.find_all('derivativeTransaction')
            
            # Process non-derivative transactions (direct stock transactions)
            for transaction in non_derivative_transactions:
                try:
                    # Get the security information
                    security_title_elem = transaction.find('securityTitle')
                    security_title = security_title_elem.find('value').text.strip() if security_title_elem else "Common Stock"
                    
                    # Get transaction date
                    transaction_date_elem = transaction.find('transactionDate')
                    transaction_date = transaction_date_elem.find('value').text.strip() if transaction_date_elem else str(filing_date)
                    
                    # Get transaction code
                    transaction_code_elem = transaction.find('transactionCode')
                    transaction_code = transaction_code_elem.text.strip() if transaction_code_elem else ""
                    
                    # Map transaction code to type (P = purchase, S = sale)
                    transaction_type = "BUY" if transaction_code == "P" else "SELL" if transaction_code == "S" else transaction_code
                    
                    # Get shares, price, and value
                    shares_elem = transaction.find('transactionShares')
                    shares = float(shares_elem.find('value').text.strip()) if shares_elem else 0
                    
                    price_elem = transaction.find('transactionPricePerShare')
                    price = float(price_elem.find('value').text.strip()) if price_elem else 0
                    
                    value = shares * price
                    
                    # Get post-transaction holdings
                    holdings_elem = transaction.find('sharesOwnedFollowingTransaction')
                    holdings = float(holdings_elem.find('value').text.strip()) if holdings_elem else 0
                    
                    # Create a unique ID for this trade
                    trade_id = f"insider_trade_{ticker}_{accession_number}_{transaction_code}_{int(shares)}_{int(price*100)}"
                    
                    # Create trade entry
                    trade_data = {
                        "id": trade_id,
                        "symbol": ticker,
                        "company_name": company_name,
                        "insider_name": owner_name,
                        "insider_title": title,
                        "transaction_type": transaction_type,
                        "transaction_code": transaction_code,
                        "transaction_date": transaction_date,
                        "shares": shares,
                        "price": price,
                        "value": value,
                        "holdings": holdings,
                        "security_type": security_title,
                        "is_direct": True,
                        "filing_date": str(filing_date),
                        "source": "SEC",
                        "filing_url": f"https://www.sec.gov/Archives/edgar/data/{{submission_acc_num}}.txt".replace(
                            "{{submission_acc_num}}", accession_number.replace('-', '')
                        ),
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    insider_trades.append(trade_data)
                    
                except Exception as e:
                    logger.warning(f"Error processing non-derivative transaction: {str(e)}", 
                                 extra={"metadata": {"error": str(e)}})
            
            # Process derivative transactions (options, etc.)
            for transaction in derivative_transactions:
                try:
                    # Get the security information
                    security_title_elem = transaction.find('securityTitle')
                    security_title = security_title_elem.find('value').text.strip() if security_title_elem else "Derivative Security"
                    
                    # Get transaction date
                    transaction_date_elem = transaction.find('transactionDate')
                    transaction_date = transaction_date_elem.find('value').text.strip() if transaction_date_elem else str(filing_date)
                    
                    # Get transaction code
                    transaction_code_elem = transaction.find('transactionCode')
                    transaction_code = transaction_code_elem.text.strip() if transaction_code_elem else ""
                    
                    # Map transaction code to type (P = purchase, S = sale)
                    transaction_type = "BUY" if transaction_code == "P" else "SELL" if transaction_code == "S" else transaction_code
                    
                    # Get shares, price, and value
                    shares_elem = transaction.find('transactionShares')
                    shares = float(shares_elem.find('value').text.strip()) if shares_elem else 0
                    
                    price_elem = transaction.find('transactionPricePerShare')
                    price = float(price_elem.find('value').text.strip()) if price_elem and price_elem.find('value') else 0
                    
                    value = shares * price
                    
                    # Get post-transaction holdings
                    holdings_elem = transaction.find('sharesOwnedFollowingTransaction')
                    holdings = float(holdings_elem.find('value').text.strip()) if holdings_elem else 0
                    
                    # Create a unique ID for this trade
                    trade_id = f"insider_trade_{ticker}_{accession_number}_derivative_{transaction_code}_{int(shares)}_{int(price*100)}"
                    
                    # Create trade entry
                    trade_data = {
                        "id": trade_id,
                        "symbol": ticker,
                        "company_name": company_name,
                        "insider_name": owner_name,
                        "insider_title": title,
                        "transaction_type": transaction_type,
                        "transaction_code": transaction_code,
                        "transaction_date": transaction_date,
                        "shares": shares,
                        "price": price,
                        "value": value,
                        "holdings": holdings,
                        "security_type": security_title,
                        "is_direct": False,
                        "filing_date": str(filing_date),
                        "source": "SEC",
                        "filing_url": f"https://www.sec.gov/Archives/edgar/data/{{submission_acc_num}}.txt".replace(
                            "{{submission_acc_num}}", accession_number.replace('-', '')
                        ),
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    insider_trades.append(trade_data)
                    
                except Exception as e:
                    logger.warning(f"Error processing derivative transaction: {str(e)}", 
                                 extra={"metadata": {"error": str(e)}})
            
            return insider_trades
            
        except Exception as e:
            logger.error(f"Error parsing Form 4 XML: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return []
    
    async def fetch_from_open_insider(self):
        """Fetch insider trading data from OpenInsider as a backup source."""
        try:
            logger.info("Fetching insider trades from OpenInsider", extra={"metadata": {}})
            
            # OpenInsider URLs
            OPENINSIDER_URL = "http://openinsider.com/screener"
            
            # Calculate date range
            end_date = date.today()
            start_date = end_date - timedelta(days=self.days_to_fetch)
            
            # Parameters for latest trades
            params = {
                "s": "0",  # Sort by filing date, descending
                "o": "0",  # Offset
                "pl": "0",  # Price low
                "ph": "",  # Price high
                "ll": "0",  # % low
                "lh": "",  # % high
                "fd": start_date.strftime("%Y-%m-%d"),  # Filing date start
                "td": end_date.strftime("%Y-%m-%d"),  # Filing date end
                "tdr": "0",  # Transaction date range
                "fdr": "0",  # Filing date range
                "xs": "0",  # Include small unknown filings
                "vl": "25000",  # Value low ($)
                "vh": "",  # Value high ($)
                "ocl": "0",  # Officer changes low
                "och": "",  # Officer changes high
                "sic1": "-1",  # Industry
                "sicl": "100",  # Sector
                "sich": "",  # Sector high
                "grp": "0",  # Group by stock
                "cnt": "100",  # Count
                "page": "1"  # Page
            }
            
            # Number of pages to fetch
            max_pages = 5
            
            for page in range(1, max_pages + 1):
                try:
                    params["page"] = str(page)
                    
                    # Fetch the data
                    response = requests.get(OPENINSIDER_URL, params=params, timeout=30)
                    response.raise_for_status()
                    
                    # Parse the HTML
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find the table with insider trades
                    table = soup.find('table', {'class': 'tinytable'})
                    
                    if not table:
                        logger.warning("No insider trades table found", extra={"metadata": {}})
                        break
                    
                    # Extract the trades
                    trades = []
                    rows = table.find_all('tr')[1:]  # Skip header row
                    
                    if not rows:
                        logger.info(f"No more trades found on page {page}", extra={"metadata": {}})
                        break
                    
                    logger.info(f"Found {len(rows)} insider trades on page {page}", 
                               extra={"metadata": {"count": len(rows)}})
                    
                    for row in rows:
                        try:
                            columns = row.find_all('td')
                            
                            if len(columns) < 16:
                                continue
                            
                            # Extract data
                            filing_date_str = columns[1].text.strip()
                            trade_date_str = columns[2].text.strip()
                            ticker = columns[3].text.strip()
                            company_name = columns[4].text.strip()
                            
                            # Get link to SEC filing
                            filing_url = ""
                            filing_link = columns[1].find('a', href=True)
                            if filing_link:
                                filing_url = filing_link['href']
                                if not filing_url.startswith('http'):
                                    filing_url = f"http://openinsider.com{filing_url}"
                            
                            insider_name = columns[5].text.strip()
                            insider_title = columns[6].text.strip()
                            trade_type = columns[7].text.strip()
                            
                            # Parse price and shares
                            price_str = columns[8].text.strip().replace('$', '')
                            shares_str = columns[9].text.strip().replace(',', '')
                            
                            try:
                                price = float(price_str) if price_str else 0
                                shares = float(shares_str) if shares_str else 0
                                value = price * shares
                            except ValueError:
                                price = 0
                                shares = 0
                                value = 0
                            
                            # Parse holdings
                            holdings_str = columns[10].text.strip().replace(',', '')
                            holdings = float(holdings_str) if holdings_str and holdings_str.replace('-', '').isdigit() else 0
                            
                            # Create a unique ID
                            trade_id = f"insider_trade_{ticker}_{filing_date_str}_{trade_type}_{int(shares)}_{int(price*100)}"
                            
                            # Map trade type to our format
                            if trade_type == 'P':
                                transaction_type = "BUY"
                            elif trade_type == 'S':
                                transaction_type = "SELL"
                            else:
                                transaction_type = trade_type
                            
                            # Create trade data
                            trade_data = {
                                "id": trade_id,
                                "symbol": ticker,
                                "company_name": company_name,
                                "insider_name": insider_name,
                                "insider_title": insider_title,
                                "transaction_type": transaction_type,
                                "transaction_code": trade_type,
                                "transaction_date": trade_date_str,
                                "shares": shares,
                                "price": price,
                                "value": value,
                                "holdings": holdings,
                                "security_type": "Common Stock",  # OpenInsider doesn't specify
                                "is_direct": True,  # OpenInsider doesn't specify
                                "filing_date": filing_date_str,
                                "source": "OpenInsider",
                                "filing_url": filing_url,
                                "created_at": datetime.now().isoformat(),
                                "updated_at": datetime.now().isoformat()
                            }
                            
                            # Check if we already have this trade
                            if await self._trade_exists(trade_id):
                                continue
                            
                            # Store the trade
                            result = supabase.table(INSIDER_TRADES_TABLE).upsert(trade_data).execute()
                            
                            if result.data:
                                logger.info(f"Successfully stored insider trade: {trade_id}", 
                                           extra={"metadata": {"id": trade_id}})
                            else:
                                logger.warning(f"Failed to store insider trade: {trade_id}", 
                                             extra={"metadata": {"id": trade_id}})
                            
                        except Exception as e:
                            logger.error(f"Error processing OpenInsider trade: {str(e)}", 
                                       extra={"metadata": {"error": str(e)}})
                    
                    # Sleep to avoid overwhelming the server
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error fetching OpenInsider page {page}: {str(e)}", 
                               extra={"metadata": {"page": page, "error": str(e)}})
            
        except Exception as e:
            logger.error(f"Error fetching from OpenInsider: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
    
    async def _filing_exists(self, accession_number: str) -> bool:
        """Check if a filing has already been processed."""
        try:
            result = supabase.table(INSIDER_TRADES_TABLE).select("id").like("id", f"%{accession_number}%").execute()
            return len(result.data) > 0
        except Exception:
            return False
    
    async def _trade_exists(self, trade_id: str) -> bool:
        """Check if a trade already exists in the database."""
        try:
            result = supabase.table(INSIDER_TRADES_TABLE).select("id").eq("id", trade_id).execute()
            return len(result.data) > 0
        except Exception:
            return False

async def main():
    """Main function to run the insider trades fetcher."""
    fetcher = InsiderTradesFetcher(days_to_fetch=7)
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main()) 
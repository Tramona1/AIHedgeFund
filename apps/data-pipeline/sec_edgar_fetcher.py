import logging
import json
import os
import time
import asyncio
import re
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}')

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

FILINGS_TABLE = "sec_filings"
TRACKED_FORMS = ["13F-HR", "13D", "13G", "3", "4", "5"]  # Forms to track
HEADERS = {
    "User-Agent": "YourAppName ContactEmail@domain.com",  # Update with real values as per SEC requirements
    "Accept-Encoding": "gzip, deflate",
    "Host": "www.sec.gov"
}

class SecEdgarFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.base_url = "https://www.sec.gov/Archives/edgar/data"
        self.search_url = "https://www.sec.gov/cgi-bin/browse-edgar"
    
    def _fetch_with_backoff(self, url, params=None):
        """Fetch with exponential backoff to respect SEC rate limits."""
        max_retries = 5
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, params=params)
                if response.status_code == 200:
                    return response
                elif response.status_code == 429:  # Too Many Requests
                    logger.warning(f"Rate limited by SEC (429). Backing off...", 
                                  extra={"metadata": {"url": url, "attempt": attempt}})
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}", 
                                  extra={"metadata": {"url": url, "status_code": response.status_code}})
                
                # Wait longer between requests (SEC rate limit is 10 requests per second)
                time.sleep(10)  # 10-second delay between requests
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}", extra={"metadata": {"url": url}})
            
            # Exponential backoff
            time.sleep(retry_delay)
            retry_delay *= 2
        
        logger.error(f"Failed to fetch {url} after {max_retries} attempts", 
                    extra={"metadata": {"url": url, "max_retries": max_retries}})
        return None
    
    def fetch_latest_filings(self, form_type, count=100):
        """Fetch the latest filings of a specific form type."""
        params = {
            "action": "getcurrent",
            "owner": "include",
            "type": form_type,
            "count": count,
            "output": "atom"
        }
        
        response = self._fetch_with_backoff(self.search_url, params)
        if not response:
            return []
        
        soup = BeautifulSoup(response.content, "xml")
        entries = soup.find_all("entry")
        
        filings = []
        for entry in entries:
            try:
                filing_url = entry.find("link")["href"]
                company = entry.find("title").text
                filing_date = entry.find("updated").text
                
                # Extract CIK and other identifiers
                cik_match = re.search(r'CIK=(\d+)', filing_url)
                cik = cik_match.group(1) if cik_match else None
                
                accession_number_match = re.search(r'accession_number=([^&]+)', filing_url)
                accession_number = accession_number_match.group(1) if accession_number_match else None
                
                if cik and accession_number:
                    filing_info = {
                        "cik": cik,
                        "company": company,
                        "form_type": form_type,
                        "filing_date": filing_date,
                        "accession_number": accession_number,
                        "url": filing_url,
                        "processed": False,
                        "timestamp": datetime.now().isoformat()
                    }
                    filings.append(filing_info)
            except Exception as e:
                logger.error(f"Error parsing filing entry: {e}", extra={"metadata": {"entry": str(entry)}})
        
        return filings
    
    def _parse_filing_content(self, form_type, accession_number, cik):
        """Parse the content of a filing based on its type."""
        # This would be expanded based on form type (13F, Form 4, etc.)
        # For demonstration, we're just returning a placeholder
        return {"holdings": [], "details": {}}
    
    def store_filings(self, filings):
        """Store filings in Supabase database."""
        for filing in filings:
            try:
                # Check if filing already exists
                existing = supabase.table(FILINGS_TABLE) \
                    .select("id") \
                    .eq("accession_number", filing["accession_number"]) \
                    .execute()
                
                if not existing.data or len(existing.data) == 0:
                    # Insert new filing
                    supabase.table(FILINGS_TABLE).insert(filing).execute()
                    logger.info(f"Inserted new filing: {filing['accession_number']}", 
                              extra={"metadata": {"filing": filing["accession_number"]}})
                else:
                    # Update existing filing
                    supabase.table(FILINGS_TABLE) \
                        .update(filing) \
                        .eq("accession_number", filing["accession_number"]) \
                        .execute()
                    logger.info(f"Updated filing: {filing['accession_number']}", 
                              extra={"metadata": {"filing": filing["accession_number"]}})
            except Exception as e:
                logger.error(f"Error storing filing: {e}", extra={"metadata": {"filing": filing.get("accession_number", "unknown")}})
    
    async def run(self):
        all_filings = []
        for form_type in TRACKED_FORMS:
            logger.info(f"Fetching {form_type} filings", extra={"metadata": {"form_type": form_type}})
            filings = self.fetch_latest_filings(form_type)
            all_filings.extend(filings)
            # Respect SEC rate limits (10 requests per second)
            await asyncio.sleep(10)
        
        if all_filings:
            self.store_filings(all_filings)
            logger.info(f"Stored {len(all_filings)} filings", extra={"metadata": {"count": len(all_filings)}})
        else:
            logger.warning("No filings found", extra={"metadata": {}})
    
    def close(self):
        """Close the session."""
        if self.session:
            self.session.close()

async def main():
    fetcher = SecEdgarFetcher()
    try:
        await fetcher.run()
    finally:
        fetcher.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main()) 
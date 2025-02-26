import asyncio
import logging
import json
import os
from datetime import datetime, timedelta
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}')

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = os.getenv("API_URL", "http://localhost:3001")  # Default to local API

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SEC_FILINGS_TABLE = "sec_filings"
ALERTS_TABLE = "holdings_alerts"
INVESTORS_TABLE = "tracked_investors"
HOLDINGS_TABLE = "investor_holdings"

class HoldingsChangeDetector:
    def __init__(self):
        self.session = requests.Session()
    
    async def get_processed_filings(self):
        """
        Get recently processed SEC filings that have not been checked for holdings changes.
        """
        try:
            response = supabase.table(SEC_FILINGS_TABLE) \
                .select("*") \
                .eq("processed", True) \
                .eq("holdings_checked", False) \
                .order("filing_date", {"ascending": False}) \
                .limit(50) \
                .execute()
            
            if response.data:
                return response.data
            return []
        except Exception as e:
            logger.error(f"Error fetching processed filings: {e}", extra={"metadata": {}})
            return []
    
    async def get_previous_holdings(self, investor_id):
        """
        Get previous holdings for an investor to compare with new filings.
        """
        try:
            # Sort by date descending to get most recent holdings
            response = supabase.table(HOLDINGS_TABLE) \
                .select("*") \
                .eq("investor_id", investor_id) \
                .order("filing_date", {"ascending": False}) \
                .limit(1) \
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching previous holdings: {e}", 
                        extra={"metadata": {"investor_id": investor_id}})
            return None
    
    def detect_changes(self, previous_holdings, current_holdings):
        """
        Detect changes between previous and current holdings.
        """
        if not previous_holdings or not current_holdings:
            # If either is missing, we can't detect changes
            return []
        
        changes = []
        
        prev_positions = {p["ticker"]: p for p in previous_holdings.get("positions", [])}
        curr_positions = {p["ticker"]: p for p in current_holdings.get("positions", [])}
        
        # Check for new positions (bought)
        for ticker, position in curr_positions.items():
            if ticker not in prev_positions:
                changes.append({
                    "ticker": ticker,
                    "change_type": "new_position",
                    "shares": position.get("shares", 0),
                    "value": position.get("value", 0),
                    "percentage": position.get("percentage", 0)
                })
        
        # Check for closed positions (sold)
        for ticker, position in prev_positions.items():
            if ticker not in curr_positions:
                changes.append({
                    "ticker": ticker,
                    "change_type": "closed_position",
                    "shares": position.get("shares", 0),
                    "value": position.get("value", 0),
                    "percentage": position.get("percentage", 0)
                })
        
        # Check for increased/decreased positions
        for ticker in set(prev_positions.keys()) & set(curr_positions.keys()):
            prev_shares = prev_positions[ticker].get("shares", 0)
            curr_shares = curr_positions[ticker].get("shares", 0)
            
            # Only record significant changes (e.g., more than 10%)
            if curr_shares > prev_shares * 1.1:  # 10% increase
                changes.append({
                    "ticker": ticker,
                    "change_type": "increased_position",
                    "previous_shares": prev_shares,
                    "current_shares": curr_shares,
                    "shares_change": curr_shares - prev_shares,
                    "percentage_change": ((curr_shares - prev_shares) / prev_shares * 100) if prev_shares > 0 else 100
                })
            elif curr_shares < prev_shares * 0.9:  # 10% decrease
                changes.append({
                    "ticker": ticker,
                    "change_type": "decreased_position",
                    "previous_shares": prev_shares,
                    "current_shares": curr_shares,
                    "shares_change": curr_shares - prev_shares,
                    "percentage_change": ((curr_shares - prev_shares) / prev_shares * 100) if prev_shares > 0 else -100
                })
        
        return changes
    
    async def create_alert(self, investor, filing, changes):
        """
        Create an alert for significant holdings changes.
        """
        if not changes:
            return
        
        try:
            alert = {
                "investor_id": investor.get("id"),
                "investor_name": investor.get("name"),
                "filing_id": filing.get("id"),
                "filing_type": filing.get("form_type"),
                "filing_date": filing.get("filing_date"),
                "changes": changes,
                "processed": False,
                "created_at": datetime.now().isoformat()
            }
            
            # Store the alert in Supabase
            result = supabase.table(ALERTS_TABLE).insert(alert).execute()
            if result.data:
                alert_id = result.data[0].get("id")
                logger.info(f"Created alert for {investor.get('name')}", 
                           extra={"metadata": {"alert_id": alert_id}})
                
                # Send notification to API for email/notifications
                await self.send_notification(alert)
            else:
                logger.warning(f"Failed to create alert for {investor.get('name')}", 
                              extra={"metadata": {"investor": investor.get("name")}})
        except Exception as e:
            logger.error(f"Error creating alert: {e}", 
                        extra={"metadata": {"investor": investor.get("name")}})
    
    async def send_notification(self, alert):
        """
        Send a notification to the API for handling (email, push notification, etc.)
        """
        try:
            response = requests.post(
                f"{API_URL}/api/notifications/holdings",
                json=alert,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                logger.info(f"Sent notification for alert", 
                           extra={"metadata": {"alert_id": alert.get("id")}})
            else:
                logger.warning(f"Failed to send notification: {response.status_code}", 
                              extra={"metadata": {"status": response.status_code, "alert_id": alert.get("id")}})
        except Exception as e:
            logger.error(f"Error sending notification: {e}", 
                        extra={"metadata": {"alert_id": alert.get("id")}})
    
    async def mark_filing_as_checked(self, filing_id):
        """
        Mark a filing as checked for holdings changes.
        """
        try:
            supabase.table(SEC_FILINGS_TABLE) \
                .update({"holdings_checked": True}) \
                .eq("id", filing_id) \
                .execute()
        except Exception as e:
            logger.error(f"Error marking filing as checked: {e}", 
                        extra={"metadata": {"filing_id": filing_id}})
    
    async def run(self):
        """
        Run the holdings change detector.
        """
        filings = await self.get_processed_filings()
        if not filings:
            logger.info("No new processed filings to check", extra={"metadata": {}})
            return
        
        logger.info(f"Checking {len(filings)} filings for holdings changes", 
                   extra={"metadata": {"count": len(filings)}})
        
        for filing in filings:
            # For each filing, get the investor
            try:
                investor_response = supabase.table(INVESTORS_TABLE) \
                    .select("*") \
                    .eq("cik", filing.get("cik")) \
                    .execute()
                
                if not investor_response.data or len(investor_response.data) == 0:
                    logger.warning(f"No investor found for CIK {filing.get('cik')}", 
                                  extra={"metadata": {"cik": filing.get("cik")}})
                    await self.mark_filing_as_checked(filing.get("id"))
                    continue
                
                investor = investor_response.data[0]
                
                # Get current holdings from the filing
                holdings_response = supabase.table(HOLDINGS_TABLE) \
                    .select("*") \
                    .eq("filing_id", filing.get("id")) \
                    .execute()
                
                if not holdings_response.data or len(holdings_response.data) == 0:
                    logger.warning(f"No holdings data for filing {filing.get('id')}", 
                                  extra={"metadata": {"filing_id": filing.get("id")}})
                    await self.mark_filing_as_checked(filing.get("id"))
                    continue
                
                current_holdings = holdings_response.data[0]
                
                # Get previous holdings for comparison
                previous_holdings = await self.get_previous_holdings(investor.get("id"))
                
                # Detect changes
                changes = self.detect_changes(previous_holdings, current_holdings)
                
                if changes:
                    # Create alert for significant changes
                    await self.create_alert(investor, filing, changes)
                    logger.info(f"Detected {len(changes)} changes for {investor.get('name')}", 
                               extra={"metadata": {"changes": len(changes), "investor": investor.get("name")}})
                else:
                    logger.info(f"No significant changes for {investor.get('name')}", 
                               extra={"metadata": {"investor": investor.get("name")}})
                
                # Mark filing as checked
                await self.mark_filing_as_checked(filing.get("id"))
            except Exception as e:
                logger.error(f"Error processing filing {filing.get('id')}: {e}", 
                            extra={"metadata": {"filing_id": filing.get("id")}})
                continue
        
        logger.info("Completed holdings change detection", extra={"metadata": {}})
    
    def close(self):
        """Close the session."""
        if self.session:
            self.session.close()

async def main():
    detector = HoldingsChangeDetector()
    try:
        await detector.run()
    finally:
        detector.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main()) 
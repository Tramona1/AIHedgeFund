import asyncio
import logging
import json
import os
import time
from datetime import datetime, timedelta
import requests
import imaplib
import email
from email.header import decode_header
import pdfplumber
import io
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv
import google.generativeai as genai

# Configure logging
logger = logging.getLogger("bank-reports-fetcher")
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}',
    handlers=[logging.StreamHandler()]
)

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
EMAIL_SERVER = os.getenv("EMAIL_SERVER", "imap.gmail.com")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

# Constants
BANK_REPORTS_TABLE = "bank_reports"
DATA_DIR = os.path.join("reports", "banks")
os.makedirs(DATA_DIR, exist_ok=True)

# Banks we want to track
TRACKED_BANKS = [
    {"name": "JP Morgan", "domain": "jpmorgan.com", "url": "https://www.jpmorganchase.com/ir/quarterly-earnings"},
    {"name": "Bank of America", "domain": "bankofamerica.com", "url": "https://investor.bankofamerica.com/quarterly-earnings"},
    {"name": "Goldman Sachs", "domain": "goldmansachs.com", "url": "https://www.goldmansachs.com/investor-relations/financials/"},
    {"name": "Morgan Stanley", "domain": "morganstanley.com", "url": "https://www.morganstanley.com/about-us-ir/earnings-releases"},
    {"name": "Wells Fargo", "domain": "wellsfargo.com", "url": "https://www.wellsfargo.com/about/investor-relations/quarterly-earnings/"},
    {"name": "Citigroup", "domain": "citigroup.com", "url": "https://www.citigroup.com/global/investors/quarterly-earnings"}
]

class BankReportsFetcher:
    def __init__(self):
        """Initialize the bank reports fetcher."""
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        
    async def run(self):
        """Run the complete bank reports fetching process."""
        try:
            logger.info("Starting bank reports fetching process", extra={"metadata": {}})
            
            # First try to fetch via email
            await self.fetch_reports_via_email()
            
            # Then try to scrape from websites
            await self.fetch_reports_via_web()
            
            logger.info("Completed bank reports fetching process", extra={"metadata": {}})
            return True
        except Exception as e:
            logger.error(f"Error in bank reports fetching process: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return False
            
    async def fetch_reports_via_email(self):
        """Fetch reports from email inbox."""
        if not EMAIL_USER or not EMAIL_PASS:
            logger.warning("Email credentials not configured. Skipping email fetching.", 
                         extra={"metadata": {}})
            return
            
        try:
            # Connect to the email server
            mail = imaplib.IMAP4_SSL(EMAIL_SERVER)
            mail.login(EMAIL_USER, EMAIL_PASS)
            mail.select("inbox")
            
            # Search for unread emails from banks
            search_query = 'UNSEEN'
            for bank in TRACKED_BANKS:
                if bank["domain"]:
                    search_query += f' OR FROM "@{bank["domain"]}"'
                    
            status, messages = mail.search(None, search_query)
            
            if status != 'OK':
                logger.warning("Failed to search emails", extra={"metadata": {"status": status}})
                return
                
            email_ids = messages[0].split()
            logger.info(f"Found {len(email_ids)} potential bank report emails", 
                       extra={"metadata": {"count": len(email_ids)}})
            
            for email_id in email_ids:
                status, msg_data = mail.fetch(email_id, '(RFC822)')
                
                if status != 'OK':
                    continue
                    
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # Get email details
                subject = self._decode_header(msg["Subject"])
                from_address = self._decode_header(msg["From"])
                date_str = self._decode_header(msg["Date"])
                
                # Check if this is from a bank domain
                sender_domain = from_address.split("@")[-1].lower() if "@" in from_address else ""
                bank_name = None
                
                for bank in TRACKED_BANKS:
                    if bank["domain"] in sender_domain:
                        bank_name = bank["name"]
                        break
                
                if not bank_name:
                    continue
                
                # Check if this is an earnings report email
                if not self._is_earnings_report_email(subject):
                    continue
                    
                logger.info(f"Processing email: {subject}", 
                           extra={"metadata": {"subject": subject, "from": from_address}})
                
                # Process the email attachments
                for part in msg.walk():
                    if part.get_content_maintype() == 'multipart':
                        continue
                        
                    if part.get('Content-Disposition') is None:
                        continue
                        
                    filename = part.get_filename()
                    
                    if not filename:
                        continue
                        
                    # If it's a PDF, process it
                    if filename.lower().endswith('.pdf'):
                        logger.info(f"Found PDF attachment: {filename}", 
                                   extra={"metadata": {"filename": filename}})
                        
                        payload = part.get_payload(decode=True)
                        
                        # Generate a unique filename
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        unique_filename = f"{bank_name.replace(' ', '_')}_{timestamp}.pdf".lower()
                        file_path = os.path.join(DATA_DIR, unique_filename)
                        
                        # Save the file
                        with open(file_path, 'wb') as f:
                            f.write(payload)
                            
                        # Process the report
                        await self.process_report(file_path, bank_name, from_address, subject)
                        
                # Mark the email as read
                mail.store(email_id, '+FLAGS', '\\Seen')
                
            # Logout
            mail.close()
            mail.logout()
            
        except Exception as e:
            logger.error(f"Error fetching reports via email: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
    
    async def fetch_reports_via_web(self):
        """Fetch reports by scraping bank websites."""
        for bank in TRACKED_BANKS:
            if not bank["url"]:
                continue
                
            try:
                logger.info(f"Scraping reports from {bank['name']} website", 
                           extra={"metadata": {"bank": bank["name"], "url": bank["url"]}})
                
                # Get the webpage
                response = self.session.get(bank["url"], timeout=30)
                response.raise_for_status()
                
                # Parse the HTML
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for PDF links - this is a basic approach and may need customization per bank
                pdf_links = []
                
                # Find all links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    link_text = link.get_text().strip().lower()
                    
                    # Check if it's likely a quarterly report link
                    is_report_link = (
                        href.lower().endswith('.pdf') and 
                        any(term in link_text for term in [
                            'quarter', 'earnings', 'results', 'financial', 'report'
                        ])
                    )
                    
                    if is_report_link:
                        # Make the URL absolute if it's relative
                        if href.startswith('/'):
                            base_url = '/'.join(bank["url"].split('/')[:3])  # Get domain
                            href = base_url + href
                        elif not href.startswith('http'):
                            href = bank["url"] + '/' + href
                            
                        pdf_links.append({
                            "url": href,
                            "text": link_text
                        })
                
                # Download and process the PDFs
                for link in pdf_links:
                    try:
                        # Generate a filename
                        pdf_filename = link["url"].split('/')[-1]
                        if not pdf_filename.lower().endswith('.pdf'):
                            pdf_filename += '.pdf'
                            
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        unique_filename = f"{bank['name'].replace(' ', '_')}_{timestamp}_{pdf_filename}".lower()
                        file_path = os.path.join(DATA_DIR, unique_filename)
                        
                        # Check if we already have this report
                        if await self._report_exists(link["url"]):
                            logger.info(f"Report already exists, skipping: {link['url']}", 
                                       extra={"metadata": {"url": link["url"]}})
                            continue
                        
                        # Download the PDF
                        logger.info(f"Downloading PDF: {link['url']}", 
                                   extra={"metadata": {"url": link["url"]}})
                        pdf_response = self.session.get(link["url"], timeout=30)
                        pdf_response.raise_for_status()
                        
                        # Save the file
                        with open(file_path, 'wb') as f:
                            f.write(pdf_response.content)
                            
                        # Process the report
                        await self.process_report(file_path, bank["name"], bank["url"], link["text"])
                        
                    except Exception as e:
                        logger.error(f"Error processing PDF link: {str(e)}", 
                                   extra={"metadata": {"link": link, "error": str(e)}})
                
            except Exception as e:
                logger.error(f"Error scraping {bank['name']} website: {str(e)}", 
                           extra={"metadata": {"bank": bank["name"], "error": str(e)}})
    
    async def process_report(self, file_path, bank_name, source, title):
        """Process a bank report PDF."""
        try:
            logger.info(f"Processing report: {file_path}", 
                       extra={"metadata": {"file": file_path, "bank": bank_name}})
            
            # Extract text from PDF
            text = await self._extract_text_from_pdf(file_path)
            
            if not text or len(text) < 100:
                logger.warning(f"Failed to extract meaningful text from PDF: {file_path}", 
                             extra={"metadata": {"file": file_path}})
                return
                
            # Generate report ID
            report_id = f"report_{bank_name.replace(' ', '_').lower()}_{os.path.basename(file_path).split('.')[0]}"
            
            # Determine report type and fiscal period
            report_type, fiscal_period = self._determine_report_type(text, title)
            
            # Extract metrics using AI
            metrics = await self._extract_metrics(text, bank_name)
            
            # Summarize the report
            summary = await self._summarize_report(text, bank_name)
            
            # Upload the file to Supabase storage
            file_url = await self._upload_to_storage(file_path)
            
            # Determine report date
            report_date = datetime.now().date().isoformat()
            
            # Create report entry
            report_data = {
                "id": report_id,
                "bank_name": bank_name,
                "report_date": report_date,
                "report_type": report_type,
                "fiscal_period": fiscal_period,
                "metrics": metrics,
                "summary": summary,
                "file_url": file_url,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Store in Supabase
            result = supabase.table(BANK_REPORTS_TABLE).upsert(report_data).execute()
            
            if result.data:
                logger.info(f"Successfully stored bank report: {report_id}", 
                           extra={"metadata": {"report_id": report_id}})
            else:
                logger.warning(f"Failed to store bank report: {report_id}", 
                             extra={"metadata": {"report_id": report_id}})
                
        except Exception as e:
            logger.error(f"Error processing report: {str(e)}", 
                       extra={"metadata": {"file": file_path, "error": str(e)}})
    
    async def _extract_text_from_pdf(self, file_path):
        """Extract text from a PDF file."""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}", 
                       extra={"metadata": {"file": file_path, "error": str(e)}})
            return ""
    
    async def _extract_metrics(self, text, bank_name):
        """Extract key financial metrics from the report text using AI."""
        try:
            # Limit text length to avoid token limits
            text_sample = text[:10000]  # Use first 10k chars
            
            prompt = f"""
            Extract key financial metrics from this bank ({bank_name}) earnings report.
            Return ONLY a JSON object with these fields (if found):
            - revenue: Total revenue in millions USD
            - net_income: Net income in millions USD
            - eps: Earnings per share (numeric)
            - assets: Total assets in billions USD
            - deposits: Total deposits in billions USD
            - loans: Total loans in billions USD
            - capital_ratio: Capital ratio as a percentage
            - return_on_equity: ROE as a percentage
            
            Report text:
            {text_sample}
            
            Response in JSON format only:
            """
            
            model = genai.GenerativeModel("gemini-1.5-pro")
            response = model.generate_content(prompt)
            
            # Parse the response
            try:
                # Extract JSON if it's wrapped in markdown code blocks
                response_text = response.text
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                metrics = json.loads(response_text)
                return metrics
            except:
                logger.warning("Failed to parse metrics as JSON, using raw response", 
                             extra={"metadata": {"response": response.text[:500]}})
                
                # Return a structured but empty metrics object
                return {
                    "revenue": None,
                    "net_income": None,
                    "eps": None,
                    "assets": None,
                    "deposits": None,
                    "loans": None,
                    "capital_ratio": None,
                    "return_on_equity": None,
                    "raw_response": response.text[:500]
                }
                
        except Exception as e:
            logger.error(f"Error extracting metrics: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return {}
    
    async def _summarize_report(self, text, bank_name):
        """Summarize the report using AI."""
        try:
            # Limit text length to avoid token limits
            text_sample = text[:15000]  # Use first 15k chars
            
            prompt = f"""
            Summarize this earnings report for {bank_name}. 
            Include key financial results, business highlights, and outlook if available.
            Keep the summary under 500 words and focus on the most important information for investors.
            
            Report text:
            {text_sample}
            """
            
            model = genai.GenerativeModel("gemini-1.5-pro")
            response = model.generate_content(prompt)
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error summarizing report: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return "Failed to generate summary."
    
    async def _upload_to_storage(self, file_path):
        """Upload a file to Supabase storage and return the public URL."""
        try:
            bucket_name = "reports"
            file_name = os.path.basename(file_path)
            
            # Check if the bucket exists
            storage_buckets = supabase.storage.list_buckets().execute()
            bucket_exists = any(bucket["name"] == bucket_name for bucket in storage_buckets.data)
            
            if not bucket_exists:
                supabase.storage.create_bucket(bucket_name).execute()
                logger.info(f"Created storage bucket: {bucket_name}", 
                           extra={"metadata": {"bucket": bucket_name}})
            
            # Upload the file
            with open(file_path, "rb") as f:
                supabase.storage.from_(bucket_name).upload(file_name, f)
                
            # Get the public URL
            file_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
            
            logger.info(f"Uploaded file to storage: {file_url}", 
                       extra={"metadata": {"file": file_path, "url": file_url}})
            
            return file_url
            
        except Exception as e:
            logger.error(f"Error uploading to storage: {str(e)}", 
                       extra={"metadata": {"file": file_path, "error": str(e)}})
            return None
    
    def _decode_header(self, header):
        """Decode email header."""
        if not header:
            return ""
            
        decoded_parts = []
        for part, encoding in decode_header(header):
            if isinstance(part, bytes):
                if encoding:
                    try:
                        decoded_parts.append(part.decode(encoding))
                    except:
                        decoded_parts.append(part.decode('utf-8', errors='replace'))
                else:
                    decoded_parts.append(part.decode('utf-8', errors='replace'))
            else:
                decoded_parts.append(part)
                
        return " ".join(decoded_parts)
    
    def _is_earnings_report_email(self, subject):
        """Check if an email subject indicates an earnings report."""
        if not subject:
            return False
            
        subject = subject.lower()
        
        keywords = [
            "earnings", "financial results", "quarterly results", "q1", "q2", "q3", "q4",
            "financial report", "annual report", "quarterly report"
        ]
        
        return any(keyword in subject for keyword in keywords)
    
    def _determine_report_type(self, text, title):
        """Determine the report type and fiscal period from text and title."""
        title_lower = title.lower()
        text_lower = text.lower()[:2000]  # Check just the beginning
        
        # Default values
        report_type = "unknown"
        fiscal_period = "unknown"
        
        # Check for quarterly report
        if any(q in title_lower or q in text_lower for q in ["q1", "q2", "q3", "q4", "quarter", "quarterly"]):
            report_type = "quarterly"
            
            # Try to determine which quarter
            for q in ["q1", "q2", "q3", "q4"]:
                if q in title_lower or q in text_lower:
                    quarter = q.upper()
                    break
            else:
                quarter = "Q?"
                
            # Try to find year
            import re
            year_match = re.search(r'20[12]\d', title_lower + " " + text_lower[:200])
            year = year_match.group(0) if year_match else datetime.now().year
                
            fiscal_period = f"{quarter} {year}"
            
        # Check for annual report
        elif any(term in title_lower or term in text_lower for term in ["annual", "yearly", "full year"]):
            report_type = "annual"
            
            # Try to find year
            import re
            year_match = re.search(r'20[12]\d', title_lower + " " + text_lower[:200])
            year = year_match.group(0) if year_match else datetime.now().year
                
            fiscal_period = f"FY {year}"
            
        return report_type, fiscal_period
    
    async def _report_exists(self, url):
        """Check if a report with the given URL already exists in the database."""
        try:
            result = supabase.table(BANK_REPORTS_TABLE).select("id").eq("file_url", url).execute()
            return len(result.data) > 0
        except Exception:
            return False

async def main():
    """Main function to run the bank reports fetcher."""
    fetcher = BankReportsFetcher()
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main()) 
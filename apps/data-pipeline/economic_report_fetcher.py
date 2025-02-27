import os
import imaplib
import email
import logging
import json
from datetime import datetime
import time
import requests
from email.header import decode_header
from urllib.parse import urljoin
from supabase import create_client, Client
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import pdfplumber
import google.generativeai as genai
import re

# Configure logging
logger = logging.getLogger("economic-report-fetcher")
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
EMAIL_USER = os.getenv("EMAIL_USER", "economicreports@gmail.com")
EMAIL_PASS = os.getenv("EMAIL_PASS")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Constants
REPORT_TABLE = "economic_reports"
DATA_DIR = "reports"
os.makedirs(DATA_DIR, exist_ok=True)

class RateLimiter:
    """Rate limiter for API calls."""
    def __init__(self, calls_per_minute=15):
        self.calls_per_minute = calls_per_minute
        self.call_times = []
        
    def wait_if_needed(self):
        """Wait if we've made too many calls in the last minute."""
        now = time.time()
        # Remove calls older than 1 minute
        self.call_times = [t for t in self.call_times if now - t < 60]
        
        if len(self.call_times) >= self.calls_per_minute:
            # Wait until we can make another call
            sleep_time = 60 - (now - self.call_times[0])
            if sleep_time > 0:
                time.sleep(sleep_time)
                
        self.call_times.append(time.time())

class EconomicReportFetcher:
    def __init__(self):
        """Initialize IMAP connection and session."""
        self.gemini_limiter = RateLimiter(calls_per_minute=15)
        self.http_limiter = RateLimiter(calls_per_minute=30)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })
        self.connect_to_email()

    def connect_to_email(self):
        """Connect to email server with retry logic."""
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                self.mail = imaplib.IMAP4_SSL("imap.gmail.com")
                self.mail.login(EMAIL_USER, EMAIL_PASS)
                logger.info("Connected to email server", extra={"metadata": {"attempt": attempt + 1}})
                return
            except Exception as e:
                logger.error(f"Failed to connect to email server (attempt {attempt + 1}/{max_retries})", 
                             extra={"metadata": {"error": str(e)}})
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    raise RuntimeError(f"Failed to connect to email after {max_retries} attempts")

    def fetch_with_retry(self, url, max_retries=3):
        """Fetch URL with retry logic and exponential backoff."""
        self.http_limiter.wait_if_needed()
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                logger.error(f"Attempt {attempt + 1} failed for {url}", 
                             extra={"metadata": {"error": str(e), "attempt": attempt + 1}})
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise

    def check_email(self, max_emails=20, mark_as_read=True):
        """Check email inbox for new economic report notifications."""
        self.mail.select("inbox")
        status, messages = self.mail.search(None, "UNSEEN")  # Only look at unread emails
        
        if status != "OK":
            logger.error("Failed to search email inbox", extra={"metadata": {"status": status}})
            return []
            
        reports = []
        message_ids = messages[0].split()
        
        # Process only the most recent emails if there are too many
        if len(message_ids) > max_emails:
            message_ids = message_ids[-max_emails:]
            
        for num in message_ids:
            try:
                status, msg_data = self.mail.fetch(num, "(RFC822)")
                if status != "OK":
                    continue
                    
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # Decode subject
                subject = decode_header(msg["subject"])[0][0]
                if isinstance(subject, bytes):
                    subject = subject.decode()
                    
                from_header = decode_header(msg["from"])[0][0]
                if isinstance(from_header, bytes):
                    from_header = from_header.decode()
                
                # Skip if not relevant
                if not self.is_relevant_email(subject, from_header):
                    continue
                    
                logger.info(f"Processing email: {subject}", extra={"metadata": {"from": from_header}})
                
                # Process PDF attachments
                pdf_reports = self.process_attachments(msg, subject, from_header)
                reports.extend(pdf_reports)
                
                # Process HTML content for PDF links
                html_reports = self.process_html_content(msg, subject, from_header)
                reports.extend(html_reports)
                
                # Mark as read if requested
                if mark_as_read and len(pdf_reports) + len(html_reports) > 0:
                    self.mail.store(num, '+FLAGS', '\\Seen')
                    
            except Exception as e:
                logger.error(f"Error processing email", extra={"metadata": {"error": str(e)}})
                
        return reports

    def is_relevant_email(self, subject, from_header):
        """Check if email is relevant to economic reports."""
        keywords = ['outlook', 'economic', 'market', 'update', 'report', 'insight', 'research', 
                   'analysis', 'forecast', 'quarterly', 'monthly', 'weekly', 'annual']
                   
        institutions = ['jpmorgan', 'jp morgan', 'goldman', 'morgan stanley', 'blackrock', 
                       'bridgewater', 'ubs', 'deutsche', 'barclays', 'citi', 'hsbc', 
                       'bank of america', 'wells fargo', 'imf', 'world bank', 'federal reserve',
                       'fed', 'bis', 'bea', 'bls', 'deloitte', 'pwc', 'kpmg', 'mckinsey',
                       'fidelity', 'vanguard', 'credit suisse']
                       
        subject_lower = subject.lower()
        from_lower = from_header.lower()
        
        is_keyword_match = any(keyword in subject_lower for keyword in keywords)
        is_institution_match = any(institution in from_lower or institution in subject_lower for institution in institutions)
        
        return is_keyword_match and is_institution_match

    def process_attachments(self, msg, subject, from_header):
        """Process PDF attachments in email."""
        reports = []
        
        for part in msg.walk():
            if part.get_content_type() == "application/pdf":
                try:
                    # Get filename from Content-Disposition header
                    content_disposition = part.get("Content-Disposition", "")
                    filename_match = re.search(r'filename="(.+?)"', content_disposition)
                    
                    if filename_match:
                        original_filename = filename_match.group(1)
                    else:
                        original_filename = f"{subject.replace(' ', '_')}.pdf"
                        
                    # Create a unique filename
                    filename = os.path.join(DATA_DIR, f"{original_filename.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
                    
                    # Save PDF
                    with open(filename, "wb") as f:
                        f.write(part.get_payload(decode=True))
                        
                    # Create report metadata
                    source = self.extract_source(from_header, subject)
                    reports.append({
                        "source": source,
                        "filename": filename,
                        "original_filename": original_filename,
                        "timestamp": datetime.now().isoformat(),
                        "subject": subject,
                        "from": from_header,
                        "type": "attachment"
                    })
                    
                    logger.info(f"Saved PDF attachment: {filename}", 
                                extra={"metadata": {"subject": subject, "source": source}})
                                
                except Exception as e:
                    logger.error(f"Error processing PDF attachment", 
                                 extra={"metadata": {"error": str(e), "subject": subject}})
                    
        return reports

    def process_html_content(self, msg, subject, from_header):
        """Process HTML content in email for PDF links."""
        reports = []
        
        for part in msg.walk():
            if part.get_content_type() in ["text/html", "text/plain"]:
                try:
                    content = part.get_payload(decode=True)
                    if not content:
                        continue
                        
                    # Decode content if needed
                    if isinstance(content, bytes):
                        charset = part.get_content_charset() or 'utf-8'
                        content = content.decode(charset, errors='replace')
                        
                    # Extract URLs from HTML
                    if part.get_content_type() == "text/html":
                        urls = self.extract_urls_from_html(content)
                    else:
                        urls = self.extract_urls_from_text(content)
                        
                    # Process each PDF URL
                    for url in urls:
                        try:
                            if not url.startswith('http'):
                                continue
                                
                            # Skip URLs that don't contain common PDF domains
                            if not self.is_valid_pdf_url(url):
                                continue
                                
                            pdf_filename = url.split('/')[-1].split('?')[0]
                            if not pdf_filename.endswith('.pdf'):
                                pdf_filename += '.pdf'
                                
                            filename = os.path.join(DATA_DIR, f"{pdf_filename.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
                            
                            # Download PDF
                            pdf_response = self.fetch_with_retry(url)
                            
                            # Check if it's actually a PDF
                            content_type = pdf_response.headers.get('Content-Type', '')
                            if 'application/pdf' not in content_type and not url.endswith('.pdf'):
                                continue
                                
                            with open(filename, "wb") as f:
                                f.write(pdf_response.content)
                                
                            # Create report metadata
                            source = self.extract_source(from_header, subject)
                            reports.append({
                                "source": source,
                                "filename": filename,
                                "original_filename": pdf_filename,
                                "timestamp": datetime.now().isoformat(),
                                "subject": subject,
                                "from": from_header,
                                "url": url,
                                "type": "link"
                            })
                            
                            logger.info(f"Downloaded PDF from link: {url}", 
                                        extra={"metadata": {"subject": subject, "source": source}})
                                        
                        except Exception as e:
                            logger.error(f"Error downloading PDF from link: {url}", 
                                         extra={"metadata": {"error": str(e)}})
                            
                except Exception as e:
                    logger.error(f"Error processing email content", 
                                 extra={"metadata": {"error": str(e), "subject": subject}})
                    
        return reports

    def extract_urls_from_html(self, html_content):
        """Extract PDF URLs from HTML content."""
        soup = BeautifulSoup(html_content, 'html.parser')
        urls = []
        
        # Get base URL if available
        base_url = None
        base_tag = soup.find('base', href=True)
        if base_tag:
            base_url = base_tag['href']
            
        # Look for PDF links
        for link in soup.find_all('a', href=True):
            href = link['href']
            
            # Check if link might be a PDF
            if href.endswith('.pdf') or 'pdf' in href or any(term in href.lower() for term in ['report', 'research', 'outlook', 'insight']):
                # Handle relative URLs
                if not href.startswith('http') and base_url:
                    href = urljoin(base_url, href)
                    
                if href.startswith('http'):
                    urls.append(href)
                    
        return urls

    def extract_urls_from_text(self, text_content):
        """Extract URLs from plain text content."""
        # Simple regex to find URLs
        url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+\S+'
        return re.findall(url_pattern, text_content)

    def is_valid_pdf_url(self, url):
        """Check if URL is likely to be a valid PDF link."""
        url_lower = url.lower()
        
        # Check for PDF extension
        if url_lower.endswith('.pdf'):
            return True
            
        # Check for common report hosting domains
        valid_domains = [
            'jpmorgan.com', 'goldmansachs.com', 'morganstanley.com', 'blackrock.com',
            'ubs.com', 'deloitte.com', 'mckinsey.com', 'federalreserve.gov', 
            'imf.org', 'worldbank.org', 'bridgewater.com', 'bea.gov', 'bis.org',
            'citigroup.com', 'wellsfargo.com', 'federalreserve.gov'
        ]
        
        return any(domain in url_lower for domain in valid_domains) and any(term in url_lower for term in ['pdf', 'report', 'research', 'outlook'])

    def extract_source(self, from_header, subject):
        """Extract the source institution from email headers."""
        # Try to extract from email domain
        domain_match = re.search(r'@([^>]+)', from_header)
        if domain_match:
            domain = domain_match.group(1).lower()
            if any(org in domain for org in ['jpmorgan', 'gs.com', 'morganstanley', 'blackrock', 'bridgewater']):
                return domain.split('.')[0].capitalize()
                
        # Try to extract from subject
        institutions = {
            'JP Morgan': ['jp morgan', 'jpmorgan', 'j.p. morgan'],
            'Goldman Sachs': ['goldman', 'goldman sachs', 'gs '],
            'Morgan Stanley': ['morgan stanley'],
            'BlackRock': ['blackrock'],
            'Bridgewater': ['bridgewater'],
            'Bank of America': ['bank of america', 'bofa', 'merrill'],
            'UBS': ['ubs'],
            'Citigroup': ['citi', 'citigroup'],
            'Wells Fargo': ['wells fargo'],
            'HSBC': ['hsbc'],
            'Federal Reserve': ['fed', 'federal reserve'],
            'IMF': ['imf', 'international monetary fund'],
            'World Bank': ['world bank'],
            'BIS': ['bis', 'bank for international settlements'],
            'Deloitte': ['deloitte'],
            'McKinsey': ['mckinsey']
        }
        
        subject_lower = subject.lower()
        from_lower = from_header.lower()
        
        for institution, keywords in institutions.items():
            if any(keyword in subject_lower for keyword in keywords) or any(keyword in from_lower for keyword in keywords):
                return institution
                
        # If no match, use domain or a generic source
        if domain_match:
            return domain_match.group(1).split('.')[0].capitalize()
        else:
            return "Economic Research"

    def extract_text(self, filename):
        """Extract text from a PDF file."""
        try:
            text = ""
            with pdfplumber.open(filename) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
                        
            return text if text else "No text extracted"
        except Exception as e:
            logger.error(f"Error extracting text from {filename}", 
                         extra={"metadata": {"error": str(e), "filename": filename}})
            return ""

    def categorize_report(self, subject, text_sample):
        """Categorize the report based on subject and content."""
        categories = {
            "market_outlook": ["market", "outlook", "guide to the markets", "stock", "equity", "investor"],
            "economic_forecast": ["economic", "forecast", "outlook", "gdp", "growth", "global"],
            "policy_analysis": ["fed", "federal reserve", "policy", "interest rate", "monetary"],
            "sector_analysis": ["sector", "industry", "specific sectors", "technology", "energy"],
            "investment_strategy": ["investment", "strategy", "portfolio", "allocation", "risk"]
        }
        
        subject_lower = subject.lower()
        text_sample_lower = text_sample.lower()[:5000] if text_sample else ""
        
        for category, keywords in categories.items():
            if any(keyword in subject_lower for keyword in keywords) or any(keyword in text_sample_lower for keyword in keywords):
                return category
                
        return "general"

    def summarize_with_gemini(self, text, report_metadata):
        """Summarize the report text using the Gemini API."""
        self.gemini_limiter.wait_if_needed()
        
        try:
            # Prepare a sample of text for summarization
            text_sample = text[:8000]  # Limit to 8000 chars for API efficiency
            
            prompt = f"""Summarize the following economic report and provide actionable insights for investors.
            
Report: {report_metadata['subject']}
Source: {report_metadata['source']}
Date: {datetime.now().strftime('%Y-%m-%d')}

Text sample:
{text_sample}

Please provide:
1. A concise summary (2-3 sentences)
2. Key economic indicators mentioned
3. Market implications
4. Actionable insights for investors
"""
            
            model = genai.GenerativeModel('gemini-2.0')
            response = model.generate_content(prompt)
            
            summary = response.text
            return summary
        except Exception as e:
            logger.error(f"Error summarizing with Gemini", 
                         extra={"metadata": {"error": str(e), "source": report_metadata['source']}})
            return "Summary unavailable due to an error in processing. Please refer to the original report."

    def is_duplicate(self, report):
        """Check if this report already exists in the database."""
        try:
            # Check for duplicates based on source and subject similarity
            result = supabase.table(REPORT_TABLE).select("id").eq("source", report["source"]).eq("subject", report["subject"]).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error checking for duplicates", 
                         extra={"metadata": {"error": str(e), "subject": report.get("subject")}})
            return False  # Assume it's not a duplicate if we can't check

    def upload_to_supabase(self, report):
        """Upload PDF to Supabase Storage and store metadata."""
        try:
            # Check if report is a duplicate
            if self.is_duplicate(report):
                logger.info(f"Skipping duplicate report: {report['subject']}", 
                            extra={"metadata": {"source": report["source"]}})
                return False
                
            # Extract text for summarization
            text = self.extract_text(report["filename"])
            
            # Categorize the report
            category = self.categorize_report(report["subject"], text)
            
            # Generate summary
            summary = self.summarize_with_gemini(text, report)
            
            # Upload PDF to Supabase Storage
            filename_base = os.path.basename(report["filename"])
            with open(report["filename"], "rb") as f:
                file_data = f.read()
                
            supabase.storage.from_("reports").upload(filename_base, file_data, {"content-type": "application/pdf"})
            
            # Get public URL
            file_url = supabase.storage.from_("reports").get_public_url(filename_base)
            
            # Prepare data for database
            data = {
                "source": report["source"],
                "filename": filename_base,
                "original_filename": report.get("original_filename", filename_base),
                "timestamp": report["timestamp"],
                "subject": report.get("subject", "Economic Report"),
                "url": report.get("url", ""),
                "summary": summary,
                "file_url": file_url,
                "category": category,
                "from_email": report.get("from", ""),
                "processed_at": datetime.now().isoformat()
            }
            
            # Insert into database
            result = supabase.table(REPORT_TABLE).insert(data).execute()
            
            logger.info(f"Uploaded and summarized report from {report['source']}", 
                        extra={"metadata": {"file_url": file_url, "subject": report.get("subject")}})
                        
            return True
            
        except Exception as e:
            logger.error(f"Error uploading to Supabase", 
                         extra={"metadata": {"error": str(e), "report": report}})
            return False

    def run(self):
        """Execute the report fetching and processing pipeline."""
        try:
            # Check emails for reports
            reports = self.check_email()
            
            if not reports:
                logger.info("No new economic reports found", extra={"metadata": {}})
                return
                
            logger.info(f"Found {len(reports)} potential economic reports", 
                        extra={"metadata": {"count": len(reports)}})
                        
            # Process each report
            for report in reports:
                self.upload_to_supabase(report)
                
        except Exception as e:
            logger.error(f"Error in economic report fetcher pipeline", 
                         extra={"metadata": {"error": str(e)}})
        finally:
            # Ensure connection is closed
            try:
                self.mail.logout()
            except:
                pass

    def __del__(self):
        """Ensure IMAP connection is closed on object deletion."""
        try:
            self.mail.logout()
        except:
            pass

if __name__ == "__main__":
    fetcher = EconomicReportFetcher()
    fetcher.run() 
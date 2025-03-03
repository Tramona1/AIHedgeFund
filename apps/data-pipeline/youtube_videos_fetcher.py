import asyncio
import logging
import json
import os
import time
from datetime import datetime, timedelta
import requests
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import google.generativeai as genai
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configure logging
logger = logging.getLogger("youtube-videos-fetcher")
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
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

# Constants
YOUTUBE_VIDEOS_TABLE = "youtube_videos"
STOCK_TICKER_LIST_FILE = os.path.join("data", "stock_tickers.json")
TRANSCRIPT_DIR = os.path.join("data", "transcripts")
os.makedirs(TRANSCRIPT_DIR, exist_ok=True)

# Financial channels to track
TRACKED_CHANNELS = [
    {"name": "CNBC", "channel_id": "UCvJJ_dzjViJCoLf5uKUTwoA"},
    {"name": "Bloomberg", "channel_id": "UCIALMKvObZNtJ6AmdCLP7Lg"},
    {"name": "Yahoo Finance", "channel_id": "UCrp_UI8XtuYfpiqluWLD7Lw"},
    {"name": "TD Ameritrade", "channel_id": "UCwcqd_tGpkqNBtbgG9SJwew"},
    {"name": "The Motley Fool", "channel_id": "UCpRQuIZskNKYhiLY4hSG1QA"},
    {"name": "Investor Relations", "channel_id": "UCSF9bVGPpSgdJXfJYS2AFew"},
    {"name": "Uncommon Core", "channel_id": "UCF4B5ry7pGGqKkJYLQ4RfsA"},
    {"name": "All-In Podcast", "channel_id": "UCESLZhusAkFfsNsApnjF_Cg"},
    {"name": "The Plain Bagel", "channel_id": "UCFCEuCsyWP0YkP-CU04aaOQ"},
    {"name": "Patrick Boyle", "channel_id": "UCASM0cgfkJW-YAJgS7RjJFw"}
]

# Search keywords for finding finance-related videos
FINANCE_KEYWORDS = [
    "stock market", "investment strategy", "earnings report", "financial analysis",
    "market analysis", "stock analysis", "earnings call", "quarterly results",
    "IPO analysis", "market outlook", "economic forecast", "trading strategy",
    "hedge fund", "portfolio management", "financial news", "stock picks",
    "market crash", "bull market", "bear market", "stock valuation",
    "technical analysis", "fundamental analysis", "financial statements",
    "investor presentation", "CEO interview", "company earnings"
]

class YouTubeVideosFetcher:
    def __init__(self):
        """Initialize the YouTube videos fetcher."""
        self.youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        self.stock_tickers = self._load_stock_tickers()
        
    async def run(self):
        """Run the complete YouTube videos fetching process."""
        try:
            logger.info("Starting YouTube videos fetching process", extra={"metadata": {}})
            
            # Fetch videos from tracked channels
            await self.fetch_videos_from_channels()
            
            # Search for finance-related videos
            await self.search_finance_videos()
            
            logger.info("Completed YouTube videos fetching process", extra={"metadata": {}})
            return True
        except Exception as e:
            logger.error(f"Error in YouTube videos fetching process: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return False
            
    async def fetch_videos_from_channels(self):
        """Fetch recent videos from tracked channels."""
        for channel in TRACKED_CHANNELS:
            try:
                logger.info(f"Fetching videos from channel: {channel['name']}", 
                           extra={"metadata": {"channel": channel["name"]}})
                
                # Set timeframe for recent videos (past 7 days)
                published_after = (datetime.utcnow() - timedelta(days=7)).isoformat() + "Z"
                
                # Fetch videos from channel
                request = self.youtube.search().list(
                    part="snippet",
                    channelId=channel["channel_id"],
                    maxResults=25,
                    order="date",
                    publishedAfter=published_after,
                    type="video"
                )
                
                response = request.execute()
                
                for item in response.get("items", []):
                    video_id = item["id"]["videoId"]
                    
                    # Check if this video is already in our database
                    if await self._video_exists(video_id):
                        logger.info(f"Video already exists, skipping: {video_id}", 
                                   extra={"metadata": {"video_id": video_id}})
                        continue
                    
                    # Get full video details
                    video_details = await self._get_video_details(video_id)
                    
                    if video_details:
                        # Process and store the video
                        await self.process_video(video_details, channel["name"])
                    
                # Sleep to respect API rate limits
                time.sleep(1)
                
            except HttpError as e:
                logger.error(f"YouTube API error for channel {channel['name']}: {str(e)}", 
                           extra={"metadata": {"channel": channel["name"], "error": str(e)}})
            except Exception as e:
                logger.error(f"Error fetching videos from channel {channel['name']}: {str(e)}", 
                           extra={"metadata": {"channel": channel["name"], "error": str(e)}})
                
    async def search_finance_videos(self):
        """Search for finance-related videos across YouTube."""
        for keyword in FINANCE_KEYWORDS:
            try:
                logger.info(f"Searching videos with keyword: {keyword}", 
                           extra={"metadata": {"keyword": keyword}})
                
                # Set timeframe for recent videos (past 3 days)
                published_after = (datetime.utcnow() - timedelta(days=3)).isoformat() + "Z"
                
                # Search for videos with the keyword
                request = self.youtube.search().list(
                    part="snippet",
                    q=keyword,
                    maxResults=15,
                    order="relevance",
                    publishedAfter=published_after,
                    type="video",
                    relevanceLanguage="en"
                )
                
                response = request.execute()
                
                for item in response.get("items", []):
                    video_id = item["id"]["videoId"]
                    
                    # Check if this video is already in our database
                    if await self._video_exists(video_id):
                        continue
                    
                    # Get full video details
                    video_details = await self._get_video_details(video_id)
                    
                    if video_details:
                        # Process and store the video
                        await self.process_video(video_details)
                    
                # Sleep to respect API rate limits
                time.sleep(2)
                
            except HttpError as e:
                logger.error(f"YouTube API error for keyword {keyword}: {str(e)}", 
                           extra={"metadata": {"keyword": keyword, "error": str(e)}})
                # If we hit the quota, stop
                if "quota" in str(e).lower():
                    logger.warning("YouTube API quota exceeded, stopping search", 
                                 extra={"metadata": {}})
                    break
            except Exception as e:
                logger.error(f"Error searching videos with keyword {keyword}: {str(e)}", 
                           extra={"metadata": {"keyword": keyword, "error": str(e)}})
                
    async def process_video(self, video_details: Dict[str, Any], channel_name: Optional[str] = None):
        """Process a video and store its details in the database."""
        try:
            video_id = video_details["id"]
            title = video_details["snippet"]["title"]
            description = video_details["snippet"].get("description", "")
            channel_id = video_details["snippet"]["channelId"]
            channel_title = channel_name or video_details["snippet"]["channelTitle"]
            published_at = video_details["snippet"]["publishedAt"]
            
            # Get view count, likes, etc.
            statistics = video_details.get("statistics", {})
            view_count = int(statistics.get("viewCount", 0))
            like_count = int(statistics.get("likeCount", 0))
            comment_count = int(statistics.get("commentCount", 0))
            
            logger.info(f"Processing video: {title}", 
                       extra={"metadata": {"video_id": video_id, "channel": channel_title}})
            
            # Get transcript if available
            transcript = await self._get_transcript(video_id)
            
            # If transcript is available, use it to analyze the video content
            if transcript:
                # Find mentioned stocks
                mentioned_stocks = await self._find_mentioned_stocks(title + " " + description + " " + transcript[:5000])
                
                # Generate a summary
                summary = await self._generate_summary(title, description, transcript)
            else:
                # No transcript, so use only title and description
                mentioned_stocks = await self._find_mentioned_stocks(title + " " + description)
                summary = await self._generate_summary(title, description, "")
            
            # Create video entry
            video_data = {
                "video_id": video_id,
                "title": title,
                "channel": channel_title,
                "channel_id": channel_id,
                "publish_date": published_at,
                "view_count": view_count,
                "like_count": like_count,
                "comment_count": comment_count,
                "description": description,
                "transcript": transcript,
                "mentioned_stocks": mentioned_stocks,
                "summary": summary,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Store in Supabase
            result = supabase.table(YOUTUBE_VIDEOS_TABLE).insert(video_data).execute()
            
            if result.data:
                logger.info(f"Successfully stored video: {video_id}", 
                           extra={"metadata": {"video_id": video_id}})
            else:
                logger.warning(f"Failed to store video: {video_id}", 
                             extra={"metadata": {"video_id": video_id}})
                
        except Exception as e:
            logger.error(f"Error processing video {video_details.get('id', 'unknown')}: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
    
    async def _get_video_details(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a YouTube video."""
        try:
            request = self.youtube.videos().list(
                part="snippet,statistics,contentDetails",
                id=video_id
            )
            
            response = request.execute()
            
            if response.get("items"):
                return response["items"][0]
            else:
                logger.warning(f"No video found with ID: {video_id}", 
                             extra={"metadata": {"video_id": video_id}})
                return None
                
        except HttpError as e:
            logger.error(f"YouTube API error for video {video_id}: {str(e)}", 
                       extra={"metadata": {"video_id": video_id, "error": str(e)}})
            return None
        except Exception as e:
            logger.error(f"Error getting video details for {video_id}: {str(e)}", 
                       extra={"metadata": {"video_id": video_id, "error": str(e)}})
            return None
    
    async def _get_transcript(self, video_id: str) -> Optional[str]:
        """
        Get the transcript of a YouTube video using a third-party API
        or directly from YouTube's caption API if accessible.
        """
        try:
            # For now, we'll use a simplified mock implementation
            # In a real implementation, you could use youtube_transcript_api package
            # or any other method to get transcripts
            
            # Try to get from cached transcript if available
            transcript_file = os.path.join(TRANSCRIPT_DIR, f"{video_id}.txt")
            if os.path.exists(transcript_file):
                with open(transcript_file, "r", encoding="utf-8") as f:
                    return f.read()
            
            # Here we would normally fetch the actual transcript
            # For demonstration, return None to simulate unavailable transcript
            # In a real implementation, you'd call the appropriate API
            
            # Mock implementation - assume 50% of videos have transcripts
            import random
            if random.random() < 0.5:
                return None
                
            # Simulated transcript for demonstration
            transcript = f"This is a simulated transcript for video {video_id}. In a real implementation, this would be the actual transcript from the YouTube video."
            
            # Save transcript to cache
            with open(transcript_file, "w", encoding="utf-8") as f:
                f.write(transcript)
                
            return transcript
            
        except Exception as e:
            logger.error(f"Error getting transcript for video {video_id}: {str(e)}", 
                       extra={"metadata": {"video_id": video_id, "error": str(e)}})
            return None
    
    async def _find_mentioned_stocks(self, text: str) -> List[Dict[str, str]]:
        """Find stock tickers mentioned in the video content."""
        try:
            mentioned_stocks = []
            
            # If we don't have stock tickers loaded, return empty list
            if not self.stock_tickers:
                return mentioned_stocks
                
            # Simple approach: look for ticker symbols in the text
            text = text.upper()
            
            for ticker in self.stock_tickers:
                ticker_symbol = ticker["symbol"].upper()
                company_name = ticker["name"].upper()
                
                # Check for ticker symbol with word boundaries
                if f" {ticker_symbol} " in f" {text} " or f"${ticker_symbol}" in text:
                    mentioned_stocks.append({
                        "symbol": ticker["symbol"],
                        "name": ticker["name"]
                    })
                    continue
                
                # Check for company name
                if company_name in text:
                    mentioned_stocks.append({
                        "symbol": ticker["symbol"],
                        "name": ticker["name"]
                    })
            
            # For more advanced analysis, use AI to detect stock mentions
            if not mentioned_stocks and len(text) > 100:
                ai_detected_stocks = await self._detect_stocks_with_ai(text[:5000])
                if ai_detected_stocks:
                    mentioned_stocks.extend(ai_detected_stocks)
            
            # Limit to unique stocks
            unique_stocks = []
            seen_symbols = set()
            
            for stock in mentioned_stocks:
                if stock["symbol"] not in seen_symbols:
                    unique_stocks.append(stock)
                    seen_symbols.add(stock["symbol"])
            
            return unique_stocks
            
        except Exception as e:
            logger.error(f"Error finding mentioned stocks: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return []
    
    async def _detect_stocks_with_ai(self, text: str) -> List[Dict[str, str]]:
        """Use AI to detect stock mentions in text."""
        try:
            prompt = f"""
            Find all stock tickers and company names mentioned in the following text.
            If multiple tickers or companies are mentioned, include all of them.
            Return your answer as a JSON array containing objects with "symbol" and "name" fields.
            If no stocks are mentioned, return an empty array.
            
            Example response format:
            [
                {{"symbol": "AAPL", "name": "Apple Inc."}},
                {{"symbol": "MSFT", "name": "Microsoft Corporation"}}
            ]
            
            Text to analyze:
            {text}
            
            JSON response:
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
                
                stocks = json.loads(response_text)
                return stocks
            except:
                logger.warning("Failed to parse AI-detected stocks as JSON", 
                             extra={"metadata": {"response": response.text[:500]}})
                return []
                
        except Exception as e:
            logger.error(f"Error detecting stocks with AI: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return []
    
    async def _generate_summary(self, title: str, description: str, transcript: str) -> str:
        """Generate a summary of the video content using AI."""
        try:
            # Prepare content for summarization
            content = f"Title: {title}\n\nDescription: {description}"
            
            if transcript:
                # Use a sample of the transcript if it's long
                transcript_sample = transcript[:10000] if len(transcript) > 10000 else transcript
                content += f"\n\nTranscript excerpt: {transcript_sample}"
            
            prompt = f"""
            Summarize the key points of this financial video content.
            Focus on any investment advice, stock recommendations, market analysis, or financial insights.
            Keep the summary concise (under 300 words) and highlight the most actionable information.
            
            Content to summarize:
            {content}
            """
            
            model = genai.GenerativeModel("gemini-1.5-pro")
            response = model.generate_content(prompt)
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return "Summary generation failed."
    
    def _load_stock_tickers(self) -> List[Dict[str, str]]:
        """Load the list of stock tickers from a JSON file."""
        try:
            if os.path.exists(STOCK_TICKER_LIST_FILE):
                with open(STOCK_TICKER_LIST_FILE, "r") as f:
                    return json.load(f)
            
            # If file doesn't exist, create a dummy list with major stocks
            # In a real implementation, you would fetch a complete list
            dummy_tickers = [
                {"symbol": "AAPL", "name": "Apple Inc."},
                {"symbol": "MSFT", "name": "Microsoft Corporation"},
                {"symbol": "AMZN", "name": "Amazon.com Inc."},
                {"symbol": "GOOGL", "name": "Alphabet Inc."},
                {"symbol": "META", "name": "Meta Platforms Inc."},
                {"symbol": "TSLA", "name": "Tesla Inc."},
                {"symbol": "NVDA", "name": "NVIDIA Corporation"},
                {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
                {"symbol": "V", "name": "Visa Inc."},
                {"symbol": "JNJ", "name": "Johnson & Johnson"}
            ]
            
            # Save the dummy list for future use
            os.makedirs(os.path.dirname(STOCK_TICKER_LIST_FILE), exist_ok=True)
            with open(STOCK_TICKER_LIST_FILE, "w") as f:
                json.dump(dummy_tickers, f, indent=2)
                
            return dummy_tickers
            
        except Exception as e:
            logger.error(f"Error loading stock tickers: {str(e)}", 
                       extra={"metadata": {"error": str(e)}})
            return []
    
    async def _video_exists(self, video_id: str) -> bool:
        """Check if a video already exists in the database."""
        try:
            result = supabase.table(YOUTUBE_VIDEOS_TABLE).select("video_id").eq("video_id", video_id).execute()
            return len(result.data) > 0
        except Exception:
            return False

async def main():
    """Main function to run the YouTube videos fetcher."""
    fetcher = YouTubeVideosFetcher()
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main()) 
import os
import re
import logging
import json
import time
from datetime import datetime
import requests
import google.generativeai as genai
import assemblyai as aai
from dotenv import load_dotenv
from supabase import create_client, Client
from urllib.parse import urlparse, parse_qs

# Configure logging
logger = logging.getLogger("interview-processor")
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
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configure APIs
genai.configure(api_key=GEMINI_API_KEY)
aai.settings.api_key = ASSEMBLYAI_API_KEY

# Constants
INTERVIEW_TABLE = "interviews"
DATA_DIR = "interviews"
os.makedirs(DATA_DIR, exist_ok=True)

class InterviewProcessor:
    def __init__(self):
        """Initialize the interview processor."""
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        
    def extract_video_id(self, youtube_url):
        """Extract YouTube video ID from a URL."""
        if not youtube_url or 'youtube.com' not in youtube_url and 'youtu.be' not in youtube_url:
            return None
            
        if 'youtu.be' in youtube_url:
            return youtube_url.split('/')[-1].split('?')[0]
            
        parsed_url = urlparse(youtube_url)
        video_id = None
        
        if parsed_url.netloc == 'youtube.com' or parsed_url.netloc == 'www.youtube.com':
            if parsed_url.path == '/watch':
                query = parse_qs(parsed_url.query)
                video_id = query.get('v', [None])[0]
            elif '/v/' in parsed_url.path:
                video_id = parsed_url.path.split('/v/')[1].split('/')[0]
                
        return video_id
    
    def get_youtube_metadata(self, youtube_url):
        """Get metadata for a YouTube video."""
        try:
            # Using a simple method to get title and channel
            # A more robust approach would use the YouTube API
            response = self.session.get(youtube_url, timeout=10)
            
            if response.status_code != 200:
                return {"title": "Unknown Video", "channel": "Unknown Channel"}
                
            html = response.text
            
            # Extract title using simple regex (a more robust solution would use proper HTML parsing)
            title_match = re.search(r'<title>(.+?)</title>', html)
            if title_match:
                title = title_match.group(1).replace(' - YouTube', '')
            else:
                title = "Unknown Video"
                
            # Extract channel - this is a simplified approach
            channel_match = re.search(r'"channelName":"(.+?)"', html)
            if channel_match:
                channel = channel_match.group(1)
            else:
                channel = "Unknown Channel"
                
            return {"title": title, "channel": channel}
            
        except Exception as e:
            logger.error(f"Error fetching YouTube metadata for {youtube_url}", 
                         extra={"metadata": {"error": str(e)}})
            return {"title": "Unknown Video", "channel": "Unknown Channel"}
            
    def transcribe_video(self, youtube_url):
        """Transcribe a YouTube video using AssemblyAI."""
        try:
            logger.info(f"Starting transcription for {youtube_url}", extra={"metadata": {}})
            
            # Create a transcription config
            config = aai.TranscriptionConfig(
                language_code="en",
                punctuate=True,
                format_text=True,
                auto_highlights=True,
                summarization=True,
                summary_type=aai.SummarizationType.paragraph,
                summary_model=aai.SummarizationModel.informative
            )
            
            # Create a transcriber
            transcriber = aai.Transcriber()
            
            # Submit the URL for transcription
            transcript = transcriber.transcribe(
                audio_url=youtube_url,
                config=config
            )
            
            # Wait for transcription to complete
            while transcript.status != aai.TranscriptStatus.completed:
                if transcript.status == aai.TranscriptStatus.error:
                    error_message = transcript.error or "Unknown error during transcription"
                    logger.error(f"Transcription failed: {error_message}", 
                                 extra={"metadata": {"youtube_url": youtube_url}})
                    return None
                time.sleep(5)
                transcript = transcriber.poll(transcript.id)
            
            # Extract text and summary
            text = transcript.text
            summary = transcript.summary
            
            logger.info(f"Transcription complete for {youtube_url}", 
                        extra={"metadata": {"transcript_length": len(text) if text else 0}})
            
            return {
                "text": text,
                "summary": summary,
                "highlights": [h.text for h in transcript.auto_highlights.results] if transcript.auto_highlights else []
            }
            
        except Exception as e:
            logger.error(f"Error transcribing video: {youtube_url}", 
                         extra={"metadata": {"error": str(e)}})
            return None
            
    def summarize_with_gemini(self, transcript_data, metadata):
        """Summarize the transcript using Gemini API."""
        try:
            # If we already have a summary from AssemblyAI, use that as a starting point
            existing_summary = transcript_data.get('summary', '')
            
            # Get text sample (first 10000 chars)
            text_sample = transcript_data.get('text', '')[:10000]
            
            # Extract highlights
            highlights = transcript_data.get('highlights', [])
            highlights_text = "\n".join([f"- {h}" for h in highlights[:5]]) if highlights else "None detected"
            
            prompt = f"""Summarize this financial interview and provide actionable insights for investors.
            
Video: {metadata['title']}
Speaker: {metadata['channel']}
Date: {datetime.now().strftime('%Y-%m-%d')}

Existing summary:
{existing_summary}

Key highlights detected:
{highlights_text}

Transcript sample:
{text_sample}

Please provide:
1. A concise summary (2-3 paragraphs)
2. Key financial insights mentioned
3. Investment implications
4. Actionable takeaways for investors
"""
            
            model = genai.GenerativeModel('gemini-2.0')
            response = model.generate_content(prompt)
            
            enhanced_summary = response.text
            return enhanced_summary
            
        except Exception as e:
            logger.error(f"Error summarizing with Gemini", 
                         extra={"metadata": {"error": str(e), "title": metadata.get('title')}})
            # Return the existing summary if available, otherwise a generic message
            return transcript_data.get('summary', "Summary unavailable due to an error in processing.")
            
    def is_duplicate(self, video_id):
        """Check if a video has already been processed."""
        try:
            result = supabase.table(INTERVIEW_TABLE).select("id").eq("video_id", video_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error checking for duplicate video", 
                         extra={"metadata": {"error": str(e), "video_id": video_id}})
            return False  # Assume it's not a duplicate if we can't check
            
    def store_interview(self, video_url, transcript_data, metadata):
        """Store the interview data in Supabase."""
        try:
            video_id = self.extract_video_id(video_url)
            
            if not video_id:
                logger.error(f"Invalid YouTube URL: {video_url}", extra={"metadata": {}})
                return False
                
            # Check for duplicates
            if self.is_duplicate(video_id):
                logger.info(f"Skipping duplicate video: {video_id}", 
                            extra={"metadata": {"title": metadata.get('title')}})
                return False
                
            # Generate enhanced summary with Gemini
            enhanced_summary = self.summarize_with_gemini(transcript_data, metadata)
            
            # Generate transcript filename
            transcript_filename = f"{video_id}_transcript.txt"
            full_transcript_path = os.path.join(DATA_DIR, transcript_filename)
            
            # Save transcript to file
            with open(full_transcript_path, 'w') as f:
                f.write(transcript_data.get('text', ''))
                
            # Upload transcript to Supabase Storage
            with open(full_transcript_path, 'rb') as f:
                supabase.storage.from_("interviews").upload(
                    transcript_filename,
                    f,
                    {"content-type": "text/plain"}
                )
                
            # Get public URL
            transcript_url = supabase.storage.from_("interviews").get_public_url(transcript_filename)
            
            # Store the data in the interviews table
            data = {
                "video_id": video_id,
                "video_url": video_url,
                "title": metadata.get('title', 'Unknown Video'),
                "speaker": metadata.get('channel', 'Unknown Channel'),
                "timestamp": datetime.now().isoformat(),
                "summary": enhanced_summary,
                "highlights": json.dumps(transcript_data.get('highlights', [])),
                "transcript_url": transcript_url,
                "processed_at": datetime.now().isoformat()
            }
            
            result = supabase.table(INTERVIEW_TABLE).insert(data).execute()
            
            logger.info(f"Stored interview data for {video_url}", 
                        extra={"metadata": {"title": metadata.get('title')}})
                        
            return True
            
        except Exception as e:
            logger.error(f"Error storing interview data", 
                         extra={"metadata": {"error": str(e), "video_url": video_url}})
            return False
            
    def process_video(self, video_url):
        """Process a single video."""
        try:
            # Extract video ID and check if already processed
            video_id = self.extract_video_id(video_url)
            
            if not video_id:
                logger.error(f"Invalid YouTube URL: {video_url}", extra={"metadata": {}})
                return False
                
            if self.is_duplicate(video_id):
                logger.info(f"Skipping already processed video: {video_id}", extra={"metadata": {}})
                return False
                
            # Get video metadata
            metadata = self.get_youtube_metadata(video_url)
            
            # Transcribe the video
            transcript_data = self.transcribe_video(video_url)
            
            if not transcript_data or not transcript_data.get('text'):
                logger.error(f"Failed to transcribe video: {video_url}", extra={"metadata": {}})
                return False
                
            # Store the interview data
            return self.store_interview(video_url, transcript_data, metadata)
            
        except Exception as e:
            logger.error(f"Error processing video: {video_url}", 
                         extra={"metadata": {"error": str(e)}})
            return False
            
    def run(self, video_urls=None):
        """Run the interview processor on a list of videos."""
        if not video_urls:
            logger.info("No videos to process", extra={"metadata": {}})
            return
            
        logger.info(f"Processing {len(video_urls)} videos", 
                    extra={"metadata": {"count": len(video_urls)}})
                    
        success_count = 0
        
        for video_url in video_urls:
            success = self.process_video(video_url)
            if success:
                success_count += 1
                
        logger.info(f"Processed {success_count}/{len(video_urls)} videos successfully", 
                    extra={"metadata": {"success_count": success_count, "total": len(video_urls)}})
                    
        return success_count
            
if __name__ == "__main__":
    # Example usage
    processor = InterviewProcessor()
    processor.run([
        "https://www.youtube.com/watch?v=example",
        "https://youtu.be/another_example"
    ]) 
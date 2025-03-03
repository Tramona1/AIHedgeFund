import os
import requests
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """
    Test script to manually trigger the weekly newsletter generation.
    This is useful for testing the newsletter functionality without waiting for the scheduled time.
    """
    load_dotenv()
    
    # Get API base URL from environment or use default
    api_base_url = os.getenv("API_BASE_URL", "http://localhost:3000")
    
    logger.info(f"Using API base URL: {api_base_url}")
    
    # Call the API endpoint to generate and send newsletters
    api_url = f"{api_base_url}/api/notifications/send-weekly-newsletter"
    
    logger.info(f"Sending request to: {api_url}")
    
    try:
        # For weekly newsletter, we can either omit frequency (defaults to weekly)
        # or explicitly set it to "weekly"
        response = requests.post(api_url, json={"frequency": "weekly"})
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Weekly newsletter job completed successfully: {result}")
        else:
            logger.error(f"Weekly newsletter API returned error: {response.status_code}")
            logger.error(f"Response: {response.text}")
                
    except Exception as e:
        logger.error(f"Error in weekly newsletter job: {e}")

if __name__ == "__main__":
    main() 
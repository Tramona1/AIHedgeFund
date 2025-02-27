import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment
api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
if not api_key:
    print("Error: ALPHA_VANTAGE_API_KEY not found in environment variables")
    exit(1)

# Test a simple API call - Global Quote for Apple
url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey={api_key}"
print(f"Making request to Alpha Vantage API: {url}")

response = requests.get(url)
data = response.json()

print("\nResponse Status:", response.status_code)
print("\nResponse Data:")
print(data)

# Check if the request was successful
if "Global Quote" in data and data["Global Quote"]:
    print("\nSuccess! Alpha Vantage API is working correctly.")
    print(f"Current price of AAPL: ${data['Global Quote'].get('05. price', 'N/A')}")
else:
    print("\nError or unexpected response format:")
    print(data) 
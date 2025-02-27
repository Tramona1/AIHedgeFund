import os
import sys
import json
from dotenv import load_dotenv
import requests
import time

def print_separator(title):
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

class FredDataTester:
    def __init__(self):
        self.api_key = os.getenv("FRED_API_KEY")
        if not self.api_key:
            raise ValueError("FRED_API_KEY environment variable not set")
        
        self.base_url = "https://api.stlouisfed.org/fred"
        self.last_call_time = 0
        
    def _rate_limit(self):
        """Simple rate limiting to avoid hitting API limits."""
        current_time = time.time()
        time_since_last_call = current_time - self.last_call_time
        
        if time_since_last_call < 1.0:  # Ensure at least 1 second between calls
            time.sleep(1.0 - time_since_last_call)
            
        self.last_call_time = time.time()
    
    def fetch_series_info(self, series_id):
        """Fetch information about a FRED data series."""
        self._rate_limit()
        
        url = f"{self.base_url}/series?series_id={series_id}&api_key={self.api_key}&file_type=json"
        print(f"Fetching series info for {series_id}...")
        
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            if "seriess" in data and data["seriess"]:
                series = data["seriess"][0]
                return {
                    "id": series_id,
                    "title": series.get("title"),
                    "frequency": series.get("frequency"),
                    "observation_start": series.get("observation_start"),
                    "observation_end": series.get("observation_end"),
                    "units": series.get("units")
                }
            else:
                print(f"Error or empty response: {data}")
                return None
        else:
            print(f"Failed to fetch data: Status code {response.status_code}")
            return None
    
    def fetch_series_data(self, series_id, limit=5):
        """Fetch actual data values for a FRED series."""
        self._rate_limit()
        
        url = f"{self.base_url}/series/observations?series_id={series_id}&api_key={self.api_key}&file_type=json&sort_order=desc&limit={limit}"
        print(f"Fetching recent data for {series_id}...")
        
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            if "observations" in data and data["observations"]:
                return [
                    {
                        "date": obs.get("date"),
                        "value": obs.get("value")
                    }
                    for obs in data["observations"]
                ]
            else:
                print(f"Error or empty response: {data}")
                return None
        else:
            print(f"Failed to fetch data: Status code {response.status_code}")
            return None

def test_fred_data():
    print_separator("TESTING FRED ECONOMIC DATA API")
    
    try:
        tester = FredDataTester()
        
        # Test fetching information for key economic indicators
        indicators = {
            "GDP": "Gross Domestic Product",
            "UNRATE": "Unemployment Rate",
            "CPIAUCSL": "Consumer Price Index",
            "FEDFUNDS": "Federal Funds Rate"
        }
        
        indicator_info = {}
        
        for series_id, description in indicators.items():
            print(f"\nTesting {description} ({series_id}):")
            
            # Get series info
            info = tester.fetch_series_info(series_id)
            if info:
                print(f"✅ Series info: {info['title']}")
                print(f"   Frequency: {info['frequency']}")
                print(f"   Range: {info['observation_start']} to {info['observation_end']}")
                indicator_info[series_id] = info
            else:
                print(f"❌ Failed to fetch series info for {series_id}")
            
            # Get recent data values
            data = tester.fetch_series_data(series_id)
            if data:
                print(f"✅ Recent data values:")
                for i, point in enumerate(data[:3]):  # Display up to 3 points
                    print(f"   {point['date']}: {point['value']}")
            else:
                print(f"❌ Failed to fetch data values for {series_id}")
        
        return len(indicator_info) > 0
        
    except Exception as e:
        print(f"❌ Error testing FRED data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    load_dotenv()  # Load environment variables
    
    print("\n📈 TESTING FRED ECONOMIC DATA API 📈\n")
    print("This script will test data fetching from the Federal Reserve Economic Data (FRED) API")
    print("to verify we can get real economic indicator data.\n")
    
    # Run the test
    result = test_fred_data()
    
    # Print summary
    print_separator("TEST SUMMARY")
    
    if result:
        print("✅ FRED API test: PASSED")
        print("\n✅ The data pipeline can successfully fetch real economic data from FRED.")
        print("   This confirms that your API key is working and data is being returned.")
        print("   Your backend should be able to fetch and process economic indicators.")
    else:
        print("❌ FRED API test: FAILED")
        print("\n❌ The test was unable to fetch economic data. Check your API key and internet connection.")

if __name__ == "__main__":
    main() 
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

class GeminiTester:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        self.api_url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent"
        
    def generate_text(self, prompt):
        """Send a prompt to Gemini API and get a response."""
        print(f"Sending prompt to Gemini: '{prompt}'")
        
        headers = {
            "Content-Type": "application/json"
        }
        
        data = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.5,
                "maxOutputTokens": 100
            }
        }
        
        url = f"{self.api_url}?key={self.api_key}"
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            data = response.json()
            if "candidates" in data and data["candidates"]:
                text = ""
                for part in data["candidates"][0]["content"]["parts"]:
                    if "text" in part:
                        text += part["text"]
                return text.strip()
            else:
                print(f"Error or empty response: {data}")
                return None
        else:
            print(f"Failed to get response. Status code: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Response content: {response.text}")
            return None

def test_gemini_api():
    print_separator("TESTING GEMINI AI API")
    
    try:
        tester = GeminiTester()
        
        # Test generating financial analysis
        prompts = [
            "What factors might affect the stock market in the coming week? Keep it brief.",
            "Analyze the current trend in tech stocks briefly.",
            "What are 3 key metrics to look at when evaluating a company's financial health?"
        ]
        
        responses = []
        
        for i, prompt in enumerate(prompts):
            print(f"\nTest {i+1}: {prompt}")
            response = tester.generate_text(prompt)
            
            if response:
                print(f"✅ Generated response: \n   {response[:150]}...")
                responses.append(response)
            else:
                print(f"❌ Failed to generate response")
        
        return len(responses) > 0
        
    except Exception as e:
        print(f"❌ Error testing Gemini API: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    load_dotenv()  # Load environment variables
    
    print("\n🤖 TESTING GEMINI AI API 🤖\n")
    print("This script will test the Gemini AI API")
    print("to verify we can generate text for financial analysis.\n")
    
    # Run the test
    result = test_gemini_api()
    
    # Print summary
    print_separator("TEST SUMMARY")
    
    if result:
        print("✅ Gemini API test: PASSED")
        print("\n✅ The data pipeline can successfully connect to Gemini AI API.")
        print("   This confirms that your API key is working and responses are being generated.")
        print("   Your backend should be able to generate financial analysis using AI.")
    else:
        print("❌ Gemini API test: FAILED")
        print("\n❌ The test was unable to generate text. Check your API key and internet connection.")

if __name__ == "__main__":
    main() 
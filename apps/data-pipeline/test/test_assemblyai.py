import os
import requests
import time
from dotenv import load_dotenv

def test_assemblyai_api():
    print("Testing AssemblyAI API connection...")
    
    # Load environment variables
    load_dotenv()
    
    # Get API key from environment variables
    api_key = os.getenv("ASSEMBLYAI_API_KEY")
    if not api_key:
        print("Error: ASSEMBLYAI_API_KEY not found in environment variables.")
        return False
    
    # Set up the API headers
    headers = {
        "authorization": api_key,
        "content-type": "application/json"
    }
    
    try:
        # First, let's check if the API is accessible by getting a list of transcripts
        print("Checking API access by retrieving transcripts list...")
        list_url = "https://api.assemblyai.com/v2/transcript"
        response = requests.get(list_url, headers=headers)
        
        if response.status_code == 200:
            print(f"API connection successful (Status: {response.status_code})")
            print(f"Recent transcripts: {response.json()}")
            
            # Now let's test a simple audio transcription with a sample file
            # Using a different public sample audio URL
            sample_audio = "https://github.com/AssemblyAI-Examples/audio-examples/raw/main/20230607_me_canadian_wildfires.mp3"
            
            # Submit the audio file for transcription
            print("\nSubmitting a sample audio file for transcription...")
            endpoint = "https://api.assemblyai.com/v2/transcript"
            json_data = {
                "audio_url": sample_audio
            }
            
            response = requests.post(endpoint, json=json_data, headers=headers)
            transcript_id = response.json()['id']
            print(f"Transcript ID: {transcript_id}")
            
            # Wait for the transcription to complete
            endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
            
            print("\nWaiting for transcription to complete...")
            while True:
                response = requests.get(endpoint, headers=headers)
                status = response.json()['status']
                
                if status == 'completed':
                    print(f"Transcription completed!")
                    result = response.json()
                    print(f"\nTranscription result (first 300 chars):")
                    print(result['text'][:300] + "..." if len(result['text']) > 300 else result['text'])
                    print("\n✅ AssemblyAI API is working correctly!")
                    return True
                elif status == 'error':
                    print(f"Transcription error: {response.json()['error']}")
                    return False
                
                print(f"Status: {status}, waiting...")
                time.sleep(5)  # Increased wait time
        else:
            print(f"Error accessing API: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing AssemblyAI API: {str(e)}")
        return False

if __name__ == "__main__":
    test_assemblyai_api() 
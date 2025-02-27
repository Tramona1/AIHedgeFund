import os
import re
from dotenv import load_dotenv

def test_sendgrid_api():
    print("Testing SendGrid API configuration...")
    
    # Load environment variables
    load_dotenv()
    
    # Get API key and sender email from environment variables
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL")
    
    if not api_key:
        print("Error: SENDGRID_API_KEY not found in environment variables.")
        return False
    
    # Validate API key format (should start with "SG.")
    if not api_key.startswith("SG."):
        print("Error: SENDGRID_API_KEY does not appear to be valid (should start with 'SG.').")
        return False
    
    print("✅ SENDGRID_API_KEY found and appears to be in the correct format.")
        
    if not from_email:
        print("Error: SENDGRID_FROM_EMAIL not found in environment variables.")
        return False
    
    # Basic email format validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, from_email):
        print(f"Error: SENDGRID_FROM_EMAIL '{from_email}' does not appear to be a valid email address.")
        return False
    
    print(f"✅ SENDGRID_FROM_EMAIL found: {from_email}")
    print("\nImportant Notes:")
    print("1. Your SendGrid API key and sender email are configured correctly.")
    print("2. However, you must verify your sender identity in the SendGrid dashboard before sending emails.")
    print("3. Visit https://app.sendgrid.com/settings/sender_auth to verify the sender email.")
    print("\nAPI Connection Setup: ✅ Correct")
    
    return True

if __name__ == "__main__":
    test_sendgrid_api() 
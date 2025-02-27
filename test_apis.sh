#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

echo "===================================================="
echo "Testing API Keys for AI Hedge Fund"
echo "===================================================="

# Test Supabase Connection
echo -e "\n\n🔍 TESTING SUPABASE CONNECTION"
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ SUPABASE_URL is not set in .env file"
else
  SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
  echo "🔗 Using URL: $SUPABASE_URL"
  
  RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/interviews?limit=1" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  if [[ $RESPONSE == *"error"* ]]; then
    echo "❌ Supabase test failed"
    echo "$RESPONSE"
  else
    echo "✅ Supabase connection successful"
  fi
fi

# Test Alpha Vantage API
echo -e "\n\n🔍 TESTING ALPHA VANTAGE API"
if [ -z "$ALPHA_VANTAGE_API_KEY" ]; then
  echo "❌ ALPHA_VANTAGE_API_KEY is not set in .env file"
else
  echo "🔑 Using key: ${ALPHA_VANTAGE_API_KEY:0:5}..."
  
  RESPONSE=$(curl -s "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=$ALPHA_VANTAGE_API_KEY")
  
  if [[ $RESPONSE == *"Error Message"* ]]; then
    echo "❌ Alpha Vantage test failed"
    echo "$RESPONSE"
  else
    echo "✅ Alpha Vantage API test successful"
  fi
fi

# Test FRED API
echo -e "\n\n🔍 TESTING FRED API"
if [ -z "$FRED_API_KEY" ]; then
  echo "❌ FRED_API_KEY is not set in .env file"
else
  echo "🔑 Using key: ${FRED_API_KEY:0:5}..."
  
  RESPONSE=$(curl -s "https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=$FRED_API_KEY&file_type=json")
  
  if [[ $RESPONSE == *"error"* ]]; then
    echo "❌ FRED API test failed"
    echo "$RESPONSE"
  else
    echo "✅ FRED API test successful"
  fi
fi

# Test Gemini API
echo -e "\n\n🔍 TESTING GEMINI API"
if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ GEMINI_API_KEY is not set in .env file"
else
  echo "🔑 Using key: ${GEMINI_API_KEY:0:5}..."
  
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -d '{"contents":[{"parts":[{"text":"Hello, world!"}]}]}' \
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent")
  
  if [[ $RESPONSE == *"error"* ]]; then
    echo "❌ Gemini API test failed"
    echo "$RESPONSE"
  else
    echo "✅ Gemini API test successful"
  fi
fi

# Test AssemblyAI API
echo -e "\n\n🔍 TESTING ASSEMBLYAI API"
if [ -z "$ASSEMBLYAI_API_KEY" ]; then
  echo "❌ ASSEMBLYAI_API_KEY is not set in .env file"
else
  echo "🔑 Using key: ${ASSEMBLYAI_API_KEY:0:5}..."
  
  RESPONSE=$(curl -s --request GET \
    --url "https://api.assemblyai.com/v2/transcript/status" \
    --header "authorization: $ASSEMBLYAI_API_KEY")
  
  if [[ $RESPONSE == *"error"* ]]; then
    echo "❌ AssemblyAI test failed"
    echo "$RESPONSE"
  else
    echo "✅ AssemblyAI API test successful"
  fi
fi

# Test SendGrid API
echo -e "\n\n🔍 TESTING SENDGRID API"
if [ -z "$SENDGRID_API_KEY" ]; then
  echo "❌ SENDGRID_API_KEY is not set in .env file"
else
  echo "🔑 Using key: ${SENDGRID_API_KEY:0:5}..."
  
  RESPONSE=$(curl -s --request GET \
    --url "https://api.sendgrid.com/v3/marketing/lists" \
    --header "Authorization: Bearer $SENDGRID_API_KEY")
  
  if [[ $RESPONSE == *"errors"* ]]; then
    echo "❌ SendGrid test failed"
    echo "$RESPONSE"
  else
    echo "✅ SendGrid API test successful"
  fi
fi

echo -e "\n\n===================================================="
echo "API Testing Complete"
echo "====================================================" 
#!/bin/bash

# Load environment variables from .env file
echo "Loading environment variables from .env..."
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Environment variables loaded successfully!"
else
  echo "Error: .env file not found!"
  exit 1
fi

# Verify key environment variables
echo "Verifying key API variables..."
[ -z "$SUPABASE_URL" ] && echo "❌ SUPABASE_URL not set" || echo "✅ SUPABASE_URL set"
[ -z "$ALPHA_VANTAGE_API_KEY" ] && echo "❌ ALPHA_VANTAGE_API_KEY not set" || echo "✅ ALPHA_VANTAGE_API_KEY set"
[ -z "$FRED_API_KEY" ] && echo "❌ FRED_API_KEY not set" || echo "✅ FRED_API_KEY set"
[ -z "$GEMINI_API_KEY" ] && echo "❌ GEMINI_API_KEY not set" || echo "✅ GEMINI_API_KEY set"
[ -z "$ASSEMBLYAI_API_KEY" ] && echo "❌ ASSEMBLYAI_API_KEY not set" || echo "✅ ASSEMBLYAI_API_KEY set"
[ -z "$SENDGRID_API_KEY" ] && echo "❌ SENDGRID_API_KEY not set" || echo "✅ SENDGRID_API_KEY set"

echo
echo "Environment ready! You can now run API commands."
echo "To use in a new terminal session, run: source load_env.sh" 
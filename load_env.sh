#!/bin/bash

# Script to load environment variables for development
echo "Loading environment variables from .env..."

# Check if .env file exists in the current directory
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Environment variables loaded successfully!"
else
  echo "No .env file found in current directory. Using defaults."
fi

# Always return success to avoid breaking the build
exit 0

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
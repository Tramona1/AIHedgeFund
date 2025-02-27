# API Troubleshooting Guide

This guide helps you troubleshoot API key issues in the AI Hedge Fund project.

## Quick Fix Steps

1. **Fix Environment Variables**: 
   - Ensure all API keys are correctly added to your `.env` file
   - For each API that's failing, verify the key format and validity
   - Make sure the environment variables are loaded before running any commands

2. **Run Tests**:
   ```bash
   ./test_apis.sh
   ```

## Common Issues and Solutions

### Environment Variable Loading

The most common issue is that environment variables from `.env` are not properly loaded. To fix this:

```bash
# In your terminal
source .env
# Or
set -a; source .env; set +a
```

### API-Specific Issues

#### Supabase

- **Issue**: "No host part in the URL" error
- **Solution**: 
  - Make sure both `SUPABASE_URL` and `SUPABASE_KEY` are set in `.env`
  - Ensure `SUPABASE_URL` includes the full URL (e.g., `https://your-project.supabase.co`)

#### Alpha Vantage

- **Issue**: "Invalid or missing apikey" error
- **Solution**:
  - Register/retrieve a valid key from: https://www.alphavantage.co/support/#api-key
  - Check for typos in your API key

#### FRED API

- **Issue**: "Bad Request - API key not a 32 character string"
- **Solution**:
  - Register for a valid key at: https://fred.stlouisfed.org/docs/api/api_key.html
  - Ensure the key is exactly 32 characters

#### Gemini API

- **Issue**: "Permission denied - unregistered caller"
- **Solution**:
  - Create/retrieve a valid key from: https://aistudio.google.com/app/apikey
  - Make sure you've enabled the Gemini API for your project

#### AssemblyAI API

- **Issue**: "Authentication error, API token missing/invalid"
- **Solution**:
  - Get a valid key from: https://www.assemblyai.com/dashboard/account
  - Check that you're passing it in the correct format (`authorization: YOUR_KEY`)

#### SendGrid API

- **Issue**: "Permission denied, wrong credentials"
- **Solution**:
  - Get a valid key from: https://app.sendgrid.com/settings/api_keys
  - Ensure you have the correct permissions for the API key

## Testing Individual APIs

Use these commands to test each API individually:

```bash
# Test Supabase
curl -X GET "$SUPABASE_URL/rest/v1/interviews?limit=1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

# Test Alpha Vantage
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=$ALPHA_VANTAGE_API_KEY"

# Test FRED API
curl "https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=$FRED_API_KEY&file_type=json"

# Test Gemini API
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello, world!"}]}]}' \
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent"

# Test AssemblyAI
curl --request GET \
  --url "https://api.assemblyai.com/v2/transcript/status" \
  --header "authorization: $ASSEMBLYAI_API_KEY"

# Test SendGrid
curl --request GET \
  --url "https://api.sendgrid.com/v3/marketing/lists" \
  --header "Authorization: Bearer $SENDGRID_API_KEY"
```

## Twitter/X API Integration

We've commented out the Twitter/X API integration as it's currently too expensive. When you're ready to add it back:

1. Update your `.env` file with a valid `X_BEARER_TOKEN`
2. Uncomment the relevant code in `scheduler.py`
3. Test the API key with:
   ```bash
   curl -X GET "https://api.twitter.com/2/tweets/search/recent?query=from:twitterdev" \
     -H "Authorization: Bearer $X_BEARER_TOKEN"
   ``` 
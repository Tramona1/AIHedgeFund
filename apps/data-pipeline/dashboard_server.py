import os
import json
import logging
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "component": "%(name)s", "message": "%(message)s", "metadata": %(metadata)s}')

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)

# Tables
SEC_FILINGS_TABLE = "sec_filings"
TWITTER_TABLE = "twitter_data"
MARKET_TABLE = "market_data"
DARK_POOL_TABLE = "dark_pool_data"
OPTION_FLOW_TABLE = "option_flow_data"
ALERTS_TABLE = "holdings_alerts"
INVESTORS_TABLE = "tracked_investors"
HOLDINGS_TABLE = "investor_holdings"

# Cross-Origin Resource Sharing (CORS) settings
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
    return response

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/market/summary', methods=['GET'])
def market_summary():
    """Get summary of market data for tracked tickers."""
    try:
        response = supabase.table(MARKET_TABLE).select("*").execute()
        
        if not response.data:
            return jsonify({"error": "No market data available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching market summary: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/market/ticker/<ticker>', methods=['GET'])
def ticker_data(ticker):
    """Get market data for a specific ticker."""
    try:
        response = supabase.table(MARKET_TABLE).select("*").eq("ticker", ticker).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": f"No data available for {ticker}"}), 404
        
        return jsonify({"data": response.data[0]})
    except Exception as e:
        logger.error(f"Error fetching {ticker} data: {e}", extra={"metadata": {"ticker": ticker}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/filings/recent', methods=['GET'])
def recent_filings():
    """Get recent SEC filings."""
    try:
        limit = request.args.get('limit', default=10, type=int)
        form_type = request.args.get('form_type')
        
        query = supabase.table(SEC_FILINGS_TABLE).select("*").order("filing_date", {"ascending": False}).limit(limit)
        
        if form_type:
            query = query.eq("form_type", form_type)
        
        response = query.execute()
        
        if not response.data:
            return jsonify({"error": "No filings available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching recent filings: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/twitter/recent', methods=['GET'])
def recent_tweets():
    """Get recent Twitter data with stock mentions."""
    try:
        limit = request.args.get('limit', default=10, type=int)
        ticker = request.args.get('ticker')
        
        query = supabase.table(TWITTER_TABLE).select("*").order("created_at", {"ascending": False}).limit(limit)
        
        if ticker:
            # This is a simplified approach - in practice you would need a more complex query
            # to filter by tickers in the JSON array
            query = query.contains("tickers", [ticker])
        
        response = query.execute()
        
        if not response.data:
            return jsonify({"error": "No Twitter data available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching recent tweets: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/dark-pool/recent', methods=['GET'])
def recent_dark_pool():
    """Get recent dark pool data."""
    try:
        limit = request.args.get('limit', default=10, type=int)
        ticker = request.args.get('ticker')
        
        query = supabase.table(DARK_POOL_TABLE).select("*").order("date", {"ascending": False}).limit(limit)
        
        if ticker:
            query = query.eq("ticker", ticker)
        
        response = query.execute()
        
        if not response.data:
            return jsonify({"error": "No dark pool data available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching dark pool data: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/option-flow/recent', methods=['GET'])
def recent_option_flow():
    """Get recent option flow data."""
    try:
        limit = request.args.get('limit', default=10, type=int)
        ticker = request.args.get('ticker')
        sentiment = request.args.get('sentiment')  # bullish, bearish, neutral
        
        query = supabase.table(OPTION_FLOW_TABLE).select("*").order("date", {"ascending": False}).limit(limit)
        
        if ticker:
            query = query.eq("ticker", ticker)
        
        if sentiment:
            query = query.eq("sentiment", sentiment)
        
        response = query.execute()
        
        if not response.data:
            return jsonify({"error": "No option flow data available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching option flow data: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/alerts/recent', methods=['GET'])
def recent_alerts():
    """Get recent holdings change alerts."""
    try:
        limit = request.args.get('limit', default=10, type=int)
        ticker = request.args.get('ticker')
        investor_id = request.args.get('investor_id')
        
        query = supabase.table(ALERTS_TABLE).select("*").order("created_at", {"ascending": False}).limit(limit)
        
        if investor_id:
            query = query.eq("investor_id", investor_id)
        
        response = query.execute()
        
        # If ticker filter is provided, filter the results after fetching
        # (since changes are stored as JSON arrays)
        result_data = response.data
        if ticker and result_data:
            filtered_data = []
            for alert in result_data:
                changes = alert.get("changes", [])
                ticker_changes = [change for change in changes if change.get("ticker") == ticker]
                if ticker_changes:
                    # Clone the alert but replace changes with filtered changes
                    filtered_alert = {**alert}
                    filtered_alert["changes"] = ticker_changes
                    filtered_data.append(filtered_alert)
            result_data = filtered_data
        
        if not result_data:
            return jsonify({"error": "No alerts available"}), 404
        
        return jsonify({"data": result_data})
    except Exception as e:
        logger.error(f"Error fetching recent alerts: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/investors', methods=['GET'])
def get_investors():
    """Get list of tracked investors."""
    try:
        response = supabase.table(INVESTORS_TABLE).select("*").execute()
        
        if not response.data:
            return jsonify({"error": "No investors available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching investors: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/holdings/investor/<investor_id>', methods=['GET'])
def investor_holdings(investor_id):
    """Get holdings for a specific investor."""
    try:
        response = supabase.table(HOLDINGS_TABLE) \
            .select("*") \
            .eq("investor_id", investor_id) \
            .order("filing_date", {"ascending": False}) \
            .limit(1) \
            .execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": f"No holdings available for investor {investor_id}"}), 404
        
        return jsonify({"data": response.data[0]})
    except Exception as e:
        logger.error(f"Error fetching holdings: {e}", extra={"metadata": {"investor_id": investor_id}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/summary', methods=['GET'])
def dashboard_summary():
    """Get a summary of all data for the dashboard."""
    try:
        # Market data summary
        market_response = supabase.table(MARKET_TABLE).select("ticker,price,rsi").limit(10).execute()
        market_data = market_response.data if market_response.data else []
        
        # Recent alerts
        alerts_response = supabase.table(ALERTS_TABLE).select("*").order("created_at", {"ascending": False}).limit(5).execute()
        alerts_data = alerts_response.data if alerts_response.data else []
        
        # Recent Twitter mentions
        twitter_response = supabase.table(TWITTER_TABLE).select("*").order("created_at", {"ascending": False}).limit(5).execute()
        twitter_data = twitter_response.data if twitter_response.data else []
        
        # Unusual options activity
        options_response = supabase.table(OPTION_FLOW_TABLE) \
            .select("*") \
            .eq("has_unusual_activity", True) \
            .order("date", {"ascending": False}) \
            .limit(5) \
            .execute()
        options_data = options_response.data if options_response.data else []
        
        # Dark pool activity
        dark_pool_response = supabase.table(DARK_POOL_TABLE) \
            .select("*") \
            .eq("high_percentage", True) \
            .order("date", {"ascending": False}) \
            .limit(5) \
            .execute()
        dark_pool_data = dark_pool_response.data if dark_pool_response.data else []
        
        summary = {
            "market_data": market_data,
            "recent_alerts": alerts_data,
            "twitter_mentions": twitter_data,
            "unusual_options": options_data,
            "dark_pool_activity": dark_pool_data,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify({"data": summary})
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port) 
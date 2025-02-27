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
FUNDAMENTALS_TABLE = "fundamental_data"
ECONOMIC_INDICATORS_TABLE = "economic_indicators"
ECONOMIC_NEWS_TABLE = "economic_news"
TOP_STOCKS_TABLE = "top_stocks"
EARNINGS_CALENDAR_TABLE = "earnings_calendar"
ECONOMIC_REPORTS_TABLE = "economic_reports"
INTERVIEWS_TABLE = "interviews"

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

@app.route('/api/market/top-stocks', methods=['GET'])
def top_stocks():
    """Get top gainers, losers, and most active stocks."""
    try:
        response = supabase.table(TOP_STOCKS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": "No top stocks data available"}), 404
        
        return jsonify({"data": response.data[0]})
    except Exception as e:
        logger.error(f"Error fetching top stocks: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/market/earnings', methods=['GET'])
def earnings_calendar():
    """Get earnings calendar data."""
    try:
        days_ahead = request.args.get('days_ahead', default=7, type=int)
        
        # Get current date
        today = datetime.now().date()
        future_date = today + timedelta(days=days_ahead)
        
        response = supabase.table(EARNINGS_CALENDAR_TABLE) \
            .select("*") \
            .gte("report_date", today.isoformat()) \
            .lte("report_date", future_date.isoformat()) \
            .order("report_date", {"ascending": True}) \
            .execute()
        
        if not response.data:
            return jsonify({"error": "No earnings calendar data available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching earnings calendar: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/market/technical-indicators/<ticker>', methods=['GET'])
def technical_indicators(ticker):
    """Get technical indicators for a specific ticker."""
    try:
        response = supabase.table(MARKET_TABLE).select("ticker,price,volume,rsi,macd,macd_signal,macd_histogram").eq("ticker", ticker).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": f"No technical indicators available for {ticker}"}), 404
        
        return jsonify({"data": response.data[0]})
    except Exception as e:
        logger.error(f"Error fetching technical indicators for {ticker}: {e}", extra={"metadata": {"ticker": ticker}})
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

@app.route('/api/fundamentals/<ticker>', methods=['GET'])
def fundamentals(ticker):
    """Get fundamental data for a specific ticker."""
    try:
        response = supabase.table(FUNDAMENTALS_TABLE).select("*").eq("ticker", ticker).order("timestamp", {"ascending": False}).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": f"No fundamental data available for {ticker}"}), 404
        
        return jsonify({"data": response.data[0]})
    except Exception as e:
        logger.error(f"Error fetching fundamentals for {ticker}: {e}", extra={"metadata": {"ticker": ticker}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/fundamentals/insights/<ticker>', methods=['GET'])
def fundamental_insights(ticker):
    """Get AI-generated insights for a specific ticker's fundamentals."""
    try:
        response = supabase.table(FUNDAMENTALS_TABLE).select("ticker,insights,timestamp").eq("ticker", ticker).order("timestamp", {"ascending": False}).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": f"No fundamental insights available for {ticker}"}), 404
        
        return jsonify({"data": response.data[0]})
    except Exception as e:
        logger.error(f"Error fetching fundamental insights for {ticker}: {e}", extra={"metadata": {"ticker": ticker}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/economic-indicators', methods=['GET'])
def economic_indicators():
    """Get economic indicator data."""
    try:
        response = supabase.table(ECONOMIC_INDICATORS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": "No economic indicator data available"}), 404
        
        return jsonify({"data": response.data[0]})
    except Exception as e:
        logger.error(f"Error fetching economic indicators: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/economic-news', methods=['GET'])
def economic_news():
    """Get economic news with sentiment analysis."""
    try:
        limit = request.args.get('limit', default=20, type=int)
        sentiment = request.args.get('sentiment')  # positive, negative, neutral
        
        response = supabase.table(ECONOMIC_NEWS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({"error": "No economic news available"}), 404
        
        # Get the most recent news collection
        news_collection = response.data[0]
        news_items = news_collection.get("news", [])
        
        # Filter by sentiment if requested
        if sentiment and news_items:
            news_items = [item for item in news_items if item.get("sentiment_label") == sentiment]
        
        # Limit the number of news items
        news_items = news_items[:limit]
        
        result = {
            "timestamp": news_collection.get("timestamp"),
            "news": news_items
        }
        
        return jsonify({"data": result})
    except Exception as e:
        logger.error(f"Error fetching economic news: {e}", extra={"metadata": {}})
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

@app.route('/api/economic-reports/recent', methods=['GET'])
def recent_economic_reports():
    """Get recent economic reports."""
    try:
        limit = request.args.get('limit', default=10, type=int)
        source = request.args.get('source')
        category = request.args.get('category')
        
        query = supabase.table(ECONOMIC_REPORTS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(limit)
        
        if source:
            query = query.eq("source", source)
        
        if category:
            query = query.eq("category", category)
        
        response = query.execute()
        
        if not response.data:
            return jsonify({"error": "No economic reports available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching economic reports: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/economic-reports/sources', methods=['GET'])
def economic_report_sources():
    """Get list of available economic report sources."""
    try:
        response = supabase.table(ECONOMIC_REPORTS_TABLE).select("source").execute()
        
        if not response.data:
            return jsonify({"error": "No economic report sources available"}), 404
        
        # Extract unique sources
        sources = list(set([item.get("source") for item in response.data if item.get("source")]))
        
        return jsonify({"data": sources})
    except Exception as e:
        logger.error(f"Error fetching economic report sources: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/economic-reports/categories', methods=['GET'])
def economic_report_categories():
    """Get list of available economic report categories."""
    try:
        response = supabase.table(ECONOMIC_REPORTS_TABLE).select("category").execute()
        
        if not response.data:
            return jsonify({"error": "No economic report categories available"}), 404
        
        # Extract unique categories
        categories = list(set([item.get("category") for item in response.data if item.get("category")]))
        
        return jsonify({"data": categories})
    except Exception as e:
        logger.error(f"Error fetching economic report categories: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/interviews/recent', methods=['GET'])
def recent_interviews():
    """Get recent interview transcriptions."""
    try:
        limit = request.args.get('limit', default=10, type=int)
        speaker = request.args.get('speaker')
        
        query = supabase.table(INTERVIEWS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(limit)
        
        if speaker:
            query = query.eq("speaker", speaker)
        
        response = query.execute()
        
        if not response.data:
            return jsonify({"error": "No interview transcriptions available"}), 404
        
        return jsonify({"data": response.data})
    except Exception as e:
        logger.error(f"Error fetching interview transcriptions: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/interviews/speakers', methods=['GET'])
def interview_speakers():
    """Get list of available interview speakers."""
    try:
        response = supabase.table(INTERVIEWS_TABLE).select("speaker").execute()
        
        if not response.data:
            return jsonify({"error": "No interview speakers available"}), 404
        
        # Extract unique speakers
        speakers = list(set([item.get("speaker") for item in response.data if item.get("speaker")]))
        
        return jsonify({"data": speakers})
    except Exception as e:
        logger.error(f"Error fetching interview speakers: {e}", extra={"metadata": {}})
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
        
        # Top stocks
        top_stocks_response = supabase.table(TOP_STOCKS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        top_stocks_data = top_stocks_response.data[0] if top_stocks_response.data else {}
        
        # Economic indicators summary (just GDP, inflation, unemployment)
        econ_response = supabase.table(ECONOMIC_INDICATORS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        econ_data = {}
        if econ_response.data and econ_response.data[0].get("indicators"):
            indicators = econ_response.data[0].get("indicators", {})
            econ_data = {
                "gdp": indicators.get("gdp", {}),
                "inflation": indicators.get("inflation", {}),
                "unemployment": indicators.get("unemployment", {})
            }
        
        # Economic news headlines (latest 3 with non-neutral sentiment)
        econ_news_response = supabase.table(ECONOMIC_NEWS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        econ_news = []
        if econ_news_response.data and econ_news_response.data[0].get("news"):
            all_news = econ_news_response.data[0].get("news", [])
            important_news = [n for n in all_news if n.get("sentiment_label") != "neutral"][:3]
            econ_news = important_news
        
        # Recent economic reports
        economic_reports_response = supabase.table(ECONOMIC_REPORTS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(3).execute()
        economic_reports = economic_reports_response.data if economic_reports_response.data else []
        
        # Recent interviews
        interviews_response = supabase.table(INTERVIEWS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(3).execute()
        interviews = interviews_response.data if interviews_response.data else []
        
        # Upcoming earnings (next 3 days)
        today = datetime.now().date()
        three_days = today + timedelta(days=3)
        earnings_response = supabase.table(EARNINGS_CALENDAR_TABLE) \
            .select("*") \
            .gte("report_date", today.isoformat()) \
            .lte("report_date", three_days.isoformat()) \
            .order("report_date", {"ascending": True}) \
            .limit(5) \
            .execute()
        earnings_data = earnings_response.data if earnings_response.data else []
        
        return jsonify({
            "market_data": market_data,
            "alerts": alerts_data,
            "twitter_mentions": twitter_data,
            "top_stocks": top_stocks_data,
            "economic_indicators": econ_data,
            "economic_news": econ_news,
            "economic_reports": economic_reports,
            "interviews": interviews,
            "upcoming_earnings": earnings_data,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error creating dashboard summary: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/trader', methods=['GET'])
def trader_dashboard():
    """Get a summary of trader-specific data for the dashboard."""
    try:
        # Market data with technical indicators
        market_response = supabase.table(MARKET_TABLE).select("ticker,price,volume,rsi,macd,macd_signal").limit(10).execute()
        market_data = market_response.data if market_response.data else []
        
        # Top stocks
        top_stocks_response = supabase.table(TOP_STOCKS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        top_stocks_data = top_stocks_response.data[0] if top_stocks_response.data else {}
        
        # Recent Twitter mentions
        twitter_response = supabase.table(TWITTER_TABLE).select("*").order("created_at", {"ascending": False}).limit(10).execute()
        twitter_data = twitter_response.data if twitter_response.data else []
        
        # Option flow data
        option_response = supabase.table(OPTION_FLOW_TABLE).select("*").order("date", {"ascending": False}).limit(10).execute()
        option_data = option_response.data if option_response.data else []
        
        # Dark pool data
        dark_pool_response = supabase.table(DARK_POOL_TABLE).select("*").order("date", {"ascending": False}).limit(10).execute()
        dark_pool_data = dark_pool_response.data if dark_pool_response.data else []
        
        return jsonify({
            "market_data": market_data,
            "top_stocks": top_stocks_data,
            "twitter_mentions": twitter_data,
            "option_flow": option_data,
            "dark_pool": dark_pool_data,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error creating trader dashboard: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/investor', methods=['GET'])
def investor_dashboard():
    """Get a summary of investor-specific data for the dashboard."""
    try:
        # Market data summary
        market_response = supabase.table(MARKET_TABLE).select("ticker,price,price_change_pct").limit(10).execute()
        market_data = market_response.data if market_response.data else []
        
        # Economic indicators
        econ_response = supabase.table(ECONOMIC_INDICATORS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        econ_data = econ_response.data[0].get("indicators", {}) if econ_response.data else {}
        
        # Economic news
        econ_news_response = supabase.table(ECONOMIC_NEWS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(1).execute()
        econ_news = econ_news_response.data[0].get("news", [])[:10] if econ_news_response.data else []
        
        # Economic reports
        economic_reports_response = supabase.table(ECONOMIC_REPORTS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(5).execute()
        economic_reports = economic_reports_response.data if economic_reports_response.data else []
        
        # Interviews
        interviews_response = supabase.table(INTERVIEWS_TABLE).select("*").order("timestamp", {"ascending": False}).limit(5).execute()
        interviews = interviews_response.data if interviews_response.data else []
        
        # Holdings alerts
        alerts_response = supabase.table(ALERTS_TABLE).select("*").order("created_at", {"ascending": False}).limit(10).execute()
        alerts_data = alerts_response.data if alerts_response.data else []
        
        # SEC filings
        filings_response = supabase.table(SEC_FILINGS_TABLE).select("*").order("filing_date", {"ascending": False}).limit(10).execute()
        filings_data = filings_response.data if filings_response.data else []
        
        # Earnings calendar (next 7 days)
        today = datetime.now().date()
        one_week = today + timedelta(days=7)
        earnings_response = supabase.table(EARNINGS_CALENDAR_TABLE) \
            .select("*") \
            .gte("report_date", today.isoformat()) \
            .lte("report_date", one_week.isoformat()) \
            .order("report_date", {"ascending": True}) \
            .limit(15) \
            .execute()
        earnings_data = earnings_response.data if earnings_response.data else []
        
        return jsonify({
            "market_data": market_data,
            "economic_indicators": econ_data,
            "economic_news": econ_news,
            "economic_reports": economic_reports,
            "interviews": interviews,
            "holdings_alerts": alerts_data,
            "sec_filings": filings_data,
            "earnings_calendar": earnings_data,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error creating investor dashboard: {e}", extra={"metadata": {}})
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True) 
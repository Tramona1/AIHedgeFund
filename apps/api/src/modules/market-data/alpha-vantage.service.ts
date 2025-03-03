import { logger } from "@repo/logger";
import fetch from "node-fetch";

// Create a module-specific logger
const alphaVantageLogger = logger.child({ module: "alpha-vantage-service" });

/**
 * Service to interact with the Alpha Vantage API
 * Documentation: https://www.alphavantage.co/documentation/
 */
export class AlphaVantageService {
  private apiKey: string;
  private baseUrl = "https://www.alphavantage.co/query";
  
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || "";
    
    if (!this.apiKey) {
      const error = "ALPHA_VANTAGE_API_KEY is not configured in environment variables";
      alphaVantageLogger.error(error);
      throw new Error(error);
    }
  }
  
  /**
   * Make a request to the Alpha Vantage API
   */
  private async makeRequest(params: Record<string, string>): Promise<any> {
    try {
      // Build URL with parameters
      const urlParams = new URLSearchParams({
        ...params,
        apikey: this.apiKey
      });
      
      const url = `${this.baseUrl}?${urlParams.toString()}`;
      
      // Make the request (without sensitive info in logs)
      alphaVantageLogger.info("Making Alpha Vantage API request", { 
        function: params.function,
        symbol: params.symbol
      });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for API error responses
      if (data["Error Message"]) {
        throw new Error(`Alpha Vantage API error: ${data["Error Message"]}`);
      }
      
      if (data["Information"]) {
        alphaVantageLogger.warn(`Alpha Vantage API information message: ${data["Information"]}`);
        // If this is a limit message, still return null to indicate failure
        if (data["Information"].includes("limit")) {
          throw new Error(`API rate limit exceeded: ${data["Information"]}`);
        }
      }
      
      if (data["Note"]) {
        alphaVantageLogger.warn(`Alpha Vantage API note: ${data["Note"]}`);
        if (data["Note"].includes("limit")) {
          throw new Error(`API rate limit exceeded: ${data["Note"]}`);
        }
      }
      
      return data;
    } catch (error) {
      alphaVantageLogger.error("Error making Alpha Vantage API request", { 
        error: error instanceof Error ? error.message : String(error),
        function: params.function, 
        symbol: params.symbol
      });
      
      throw error;
    }
  }
  
  /**
   * Get current stock quote for a symbol
   */
  async getStockQuote(symbol: string): Promise<any> {
    try {
      alphaVantageLogger.info(`Getting stock quote for ${symbol}`);
      
      const data = await this.makeRequest({
        function: "GLOBAL_QUOTE",
        symbol
      });
      
      if (!data || !data["Global Quote"] || Object.keys(data["Global Quote"]).length === 0) {
        alphaVantageLogger.warn(`No quote data found for ${symbol}`);
        return null;
      }
      
      return data["Global Quote"];
    } catch (error) {
      alphaVantageLogger.error(`Error getting stock quote for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get daily price history for a symbol
   */
  async getDailyPrices(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<any> {
    try {
      alphaVantageLogger.info(`Getting daily prices for ${symbol} with output size ${outputSize}`);
      
      const data = await this.makeRequest({
        function: "TIME_SERIES_DAILY",
        symbol,
        outputsize: outputSize
      });
      
      if (!data || !data["Time Series (Daily)"] || Object.keys(data["Time Series (Daily)"]).length === 0) {
        alphaVantageLogger.warn(`No daily price data found for ${symbol}`);
        return null;
      }
      
      return {
        metadata: data["Meta Data"],
        timeSeries: data["Time Series (Daily)"]
      };
    } catch (error) {
      alphaVantageLogger.error(`Error getting daily prices for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get RSI (Relative Strength Index) data for a symbol
   */
  async getRSI(symbol: string, interval: string, timePeriod: number): Promise<any> {
    try {
      alphaVantageLogger.info(`Getting RSI for ${symbol} with time period ${timePeriod}`);
      
      const data = await this.makeRequest({
        function: "RSI",
        symbol,
        interval,
        time_period: timePeriod.toString(),
        series_type: "close"
      });
      
      if (!data || !data["Technical Analysis: RSI"] || Object.keys(data["Technical Analysis: RSI"]).length === 0) {
        alphaVantageLogger.warn(`No RSI data found for ${symbol}`);
        return null;
      }
      
      return {
        metadata: data["Meta Data"],
        technicalIndicator: data["Technical Analysis: RSI"]
      };
    } catch (error) {
      alphaVantageLogger.error(`Error getting RSI for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get company overview for a symbol
   */
  async getCompanyOverview(symbol: string): Promise<any> {
    try {
      alphaVantageLogger.info(`Getting company overview for ${symbol}`);
      
      const data = await this.makeRequest({
        function: "OVERVIEW",
        symbol
      });
      
      if (!data || Object.keys(data).length === 0 || data["Symbol"] === undefined) {
        alphaVantageLogger.warn(`No company overview data found for ${symbol}`);
        return null;
      }
      
      return data;
    } catch (error) {
      alphaVantageLogger.error(`Error getting company overview for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get balance sheet for a symbol
   */
  async getBalanceSheet(symbol: string): Promise<any> {
    try {
      alphaVantageLogger.info(`Getting balance sheet for ${symbol}`);
      
      const data = await this.makeRequest({
        function: "BALANCE_SHEET",
        symbol
      });
      
      if (!data || !data["annualReports"] || data["annualReports"].length === 0) {
        alphaVantageLogger.warn(`No balance sheet data found for ${symbol}`);
        return null;
      }
      
      return data;
    } catch (error) {
      alphaVantageLogger.error(`Error getting balance sheet for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get income statement for a symbol
   */
  async getIncomeStatement(symbol: string): Promise<any> {
    try {
      alphaVantageLogger.info(`Getting income statement for ${symbol}`);
      
      const data = await this.makeRequest({
        function: "INCOME_STATEMENT",
        symbol
      });
      
      if (!data || !data["annualReports"] || data["annualReports"].length === 0) {
        alphaVantageLogger.warn(`No income statement data found for ${symbol}`);
        return null;
      }
      
      return data;
    } catch (error) {
      alphaVantageLogger.error(`Error getting income statement for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
}

// Export a singleton instance
export const alphaVantageService = new AlphaVantageService(); 
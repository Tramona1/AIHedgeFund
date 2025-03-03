/**
 * Unusual Whales API Service
 * Provides access to options flow and dark pool data
 */
import { logger } from "@repo/logger";
import axios from "axios";
// Create a module-specific logger
const serviceLogger = logger.child({ module: "unusual-whales-service" });
/**
 * Service for interacting with the Unusual Whales API
 * This service handles fetching options flow and dark pool data
 */
export class UnusualWhalesService {
    apiKey;
    baseUrl;
    headers;
    constructor() {
        this.apiKey = process.env.UNUSUAL_WHALES_API_KEY || "";
        this.baseUrl = "https://api.unusualwhales.com/v1"; // Adjust based on actual API docs
        if (!this.apiKey) {
            serviceLogger.warn("Unusual Whales API key is not set in environment variables");
        }
        this.headers = {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
        };
    }
    /**
     * Make a request to the Unusual Whales API
     */
    async makeRequest(endpoint, params = {}) {
        // Check if API key is available
        if (!this.apiKey) {
            throw new Error("Unusual Whales API key is not configured");
        }
        try {
            const url = `${this.baseUrl}${endpoint}`;
            serviceLogger.debug(`Making request to ${url}`, { params });
            const response = await axios.get(url, {
                headers: this.headers,
                params
            });
            if (response.status === 200) {
                return response.data;
            }
            else {
                throw new Error(`Unusual Whales API error: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            serviceLogger.error("Error making Unusual Whales API request", {
                endpoint,
                params,
                error: error.message,
                response: error.response?.data
            });
            // Enhance error with more context
            if (error.response) {
                throw new Error(`Unusual Whales API error: ${error.response.status} - ${error.response.data?.error || error.message}`);
            }
            else if (error.request) {
                throw new Error(`Unusual Whales API request error: No response received - ${error.message}`);
            }
            else {
                throw new Error(`Unusual Whales API error: ${error.message}`);
            }
        }
    }
    /**
     * Get options flow data for a specific symbol
     * @param symbol Stock ticker symbol
     * @param limit Number of records to return
     */
    async getOptionsFlow(symbol, limit = 50) {
        const endpoint = "/options/flow";
        const params = { limit };
        if (symbol) {
            params.symbol = symbol;
        }
        serviceLogger.info("Fetching options flow data", { symbol, limit });
        const data = await this.makeRequest(endpoint, params);
        return data;
    }
    /**
     * Get dark pool data for a specific symbol
     * @param symbol Stock ticker symbol
     * @param limit Number of records to return
     */
    async getDarkPoolData(symbol, limit = 50) {
        const endpoint = "/darkpool/trades";
        const params = { limit };
        if (symbol) {
            params.symbol = symbol;
        }
        serviceLogger.info("Fetching dark pool data", { symbol, limit });
        const data = await this.makeRequest(endpoint, params);
        return data;
    }
    /**
     * Get current market sentiment overview
     */
    async getMarketSentiment() {
        const endpoint = "/market/sentiment";
        serviceLogger.info("Fetching market sentiment data");
        const data = await this.makeRequest(endpoint);
        return data;
    }
    /**
     * Get detailed options data for a symbol including greeks, open interest, etc.
     * @param symbol Stock ticker symbol
     * @param expiration Optional expiration date filter (YYYY-MM-DD)
     */
    async getOptionsData(symbol, expiration) {
        const endpoint = "/options/data";
        const params = { symbol };
        if (expiration) {
            params.expiration = expiration;
        }
        serviceLogger.info("Fetching detailed options data", { symbol, expiration });
        const data = await this.makeRequest(endpoint, params);
        return data;
    }
    /**
     * Check if API is configured and available
     */
    async checkApiStatus() {
        try {
            if (!this.apiKey) {
                return {
                    available: false,
                    message: "Unusual Whales API key not configured"
                };
            }
            // Try a simple API call to verify connectivity
            await this.makeRequest("/status"); // Replace with actual status endpoint
            return {
                available: true,
                message: "Unusual Whales API is available"
            };
        }
        catch (error) {
            return {
                available: false,
                message: `Unusual Whales API unavailable: ${error.message}`
            };
        }
    }
}
// Singleton instance
export const unusualWhalesService = new UnusualWhalesService();
//# sourceMappingURL=unusual-whales.service.js.map
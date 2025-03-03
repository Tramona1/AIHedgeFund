/**
 * Unusual Whales API Service
 * Provides access to options flow and dark pool data
 */
/**
 * Service for interacting with the Unusual Whales API
 * This service handles fetching options flow and dark pool data
 */
export declare class UnusualWhalesService {
    private apiKey;
    private baseUrl;
    private headers;
    constructor();
    /**
     * Make a request to the Unusual Whales API
     */
    private makeRequest;
    /**
     * Get options flow data for a specific symbol
     * @param symbol Stock ticker symbol
     * @param limit Number of records to return
     */
    getOptionsFlow(symbol?: string, limit?: number): Promise<any>;
    /**
     * Get dark pool data for a specific symbol
     * @param symbol Stock ticker symbol
     * @param limit Number of records to return
     */
    getDarkPoolData(symbol?: string, limit?: number): Promise<any>;
    /**
     * Get current market sentiment overview
     */
    getMarketSentiment(): Promise<any>;
    /**
     * Get detailed options data for a symbol including greeks, open interest, etc.
     * @param symbol Stock ticker symbol
     * @param expiration Optional expiration date filter (YYYY-MM-DD)
     */
    getOptionsData(symbol: string, expiration?: string): Promise<any>;
    /**
     * Check if API is configured and available
     */
    checkApiStatus(): Promise<{
        available: boolean;
        message: string;
    }>;
}
export declare const unusualWhalesService: UnusualWhalesService;

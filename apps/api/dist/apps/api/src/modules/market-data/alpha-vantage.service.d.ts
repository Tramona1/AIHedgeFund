/**
 * Service to interact with the Alpha Vantage API
 * Documentation: https://www.alphavantage.co/documentation/
 */
export declare class AlphaVantageService {
    private apiKey;
    private baseUrl;
    constructor();
    /**
     * Make a request to the Alpha Vantage API
     */
    private makeRequest;
    /**
     * Get current stock quote for a symbol
     */
    getStockQuote(symbol: string): Promise<any>;
    /**
     * Get daily price history for a symbol
     */
    getDailyPrices(symbol: string, outputSize?: 'compact' | 'full'): Promise<any>;
    /**
     * Get RSI (Relative Strength Index) data for a symbol
     */
    getRSI(symbol: string, interval: string, timePeriod: number): Promise<any>;
    /**
     * Get company overview for a symbol
     */
    getCompanyOverview(symbol: string): Promise<any>;
    /**
     * Get balance sheet for a symbol
     */
    getBalanceSheet(symbol: string): Promise<any>;
    /**
     * Get income statement for a symbol
     */
    getIncomeStatement(symbol: string): Promise<any>;
}
export declare const alphaVantageService: AlphaVantageService;

/**
 * Service to handle collection of market data from external APIs
 * and storing it in the database
 */
export declare class DataCollectionService {
    /**
     * Collects current stock quote for a given symbol and stores it in the database
     */
    collectStockQuote(symbol: string): Promise<any>;
    /**
     * Collects company information for a given symbol and stores it in the database
     */
    collectCompanyInfo(symbol: string): Promise<any>;
    /**
     * Collects balance sheet data for a given symbol and stores it in the database
     */
    collectBalanceSheet(symbol: string): Promise<boolean>;
    /**
     * Collects RSI data for a given symbol and stores it in the database
     */
    collectRSI(symbol: string, timePeriod?: number): Promise<boolean>;
    /**
     * Collects all available data for a given symbol
     */
    collectAllDataForSymbol(symbol: string): Promise<{
        quote: {
            success: boolean;
            error: any;
        };
        company: {
            success: boolean;
            error: any;
        };
        balanceSheet: {
            success: boolean;
            error: any;
        };
        rsi: {
            success: boolean;
            error: any;
        };
    }>;
    /**
     * Collects data for all symbols in a watchlist
     */
    collectDataForWatchlist(): Promise<any[]>;
}
export declare const dataCollectionService: DataCollectionService;

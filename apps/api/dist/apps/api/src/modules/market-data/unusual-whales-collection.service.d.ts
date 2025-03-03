/**
 * Unusual Whales Data Collection Service
 * Collects and stores options flow and dark pool data
 */
/**
 * Service for collecting and storing data from Unusual Whales API
 */
export declare class UnusualWhalesCollectionService {
    /**
     * Collect options flow data from Unusual Whales API
     */
    collectOptionsFlow(symbol?: string): Promise<{
        success: boolean;
        count: number;
        message?: string;
    }>;
    /**
     * Collect dark pool data for a symbol
     * @param symbol Stock ticker symbol (optional - if not provided, collects for all available symbols)
     */
    collectDarkPoolData(symbol?: string): Promise<{
        success: boolean;
        count: number;
        message?: string;
    }>;
    /**
     * Collect both options flow and dark pool data for watchlist
     */
    collectWatchlistData(): Promise<{
        optionsFlow: any;
        darkPool: any;
    }>;
    /**
     * Get unique symbols from user watchlists
     */
    private getWatchlistSymbols;
}
export declare const unusualWhalesCollectionService: UnusualWhalesCollectionService;

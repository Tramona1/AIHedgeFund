/**
 * Class that handles scheduling of data collection jobs for market data
 */
export declare class CollectionScheduler {
    private isRunning;
    private isMarketOpen;
    /**
     * Start the scheduler for collecting market data
     */
    startScheduler(): {
        isRunning: boolean;
        isMarketOpen: boolean;
    };
    /**
     * Stop the scheduler for collecting market data
     */
    stopScheduler(): {
        stopped: boolean;
    };
    /**
     * Check if the US stock market is currently open
     * This is a simplified version - a production implementation would
     * consider holidays, early closings, etc.
     */
    checkMarketHours(): boolean;
    /**
     * Determine if data should be collected based on market hours and schedule
     */
    shouldCollectData(): boolean;
    /**
     * Run the data collection for watchlist symbols
     */
    collectWatchlistData(): Promise<any[] | {
        error: string;
    }>;
    /**
     * Force a data collection for watchlist symbols
     * This can be triggered manually via an API endpoint
     */
    forceCollectWatchlistData(): Promise<any[] | {
        error: string;
    }>;
    /**
     * Get the current status of the scheduler
     */
    getStatus(): {
        isRunning: boolean;
        isMarketOpen: boolean;
    };
}
export declare const collectionScheduler: CollectionScheduler;

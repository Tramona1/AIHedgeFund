/**
 * Class that handles scheduling of data collection jobs for Unusual Whales data
 */
export declare class UnusualWhalesScheduler {
    private isRunning;
    /**
     * Start the scheduler for collecting Unusual Whales data
     */
    startScheduler(): {
        isRunning: boolean;
    };
    /**
     * Stop the scheduler for collecting Unusual Whales data
     */
    stopScheduler(): {
        stopped: boolean;
    };
    /**
     * Determine if data should be collected based on market hours and schedule
     */
    shouldCollectData(): boolean;
    /**
     * Run the data collection for Unusual Whales data
     */
    collectUnusualWhalesData(): Promise<{
        optionsFlowSuccess: boolean;
        darkPoolSuccess: boolean;
    } | {
        error: string;
        optionsFlowSuccess: boolean;
        darkPoolSuccess: boolean;
    }>;
    /**
     * Force a data collection for Unusual Whales data
     * This can be triggered manually via an API endpoint
     */
    forceCollectUnusualWhalesData(): Promise<{
        optionsFlowSuccess: boolean;
        darkPoolSuccess: boolean;
    } | {
        error: string;
        optionsFlowSuccess: boolean;
        darkPoolSuccess: boolean;
    }>;
    /**
     * Get the current status of the scheduler
     */
    getStatus(): {
        isRunning: boolean;
    };
}
export declare const unusualWhalesScheduler: UnusualWhalesScheduler;

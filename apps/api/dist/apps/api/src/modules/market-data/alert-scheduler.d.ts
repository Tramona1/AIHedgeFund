/**
 * Class to handle scheduling of price alert checks
 */
export declare class AlertScheduler {
    private isRunning;
    /**
     * Start the alert scheduler
     */
    start(): {
        started: boolean;
    };
    /**
     * Stop the alert scheduler
     */
    stop(): {
        stopped: boolean;
    };
    /**
     * Run the price alert check manually
     * This can be called directly from API or scheduled externally
     */
    runPriceAlertCheck(): Promise<{
        alertsProcessed: number;
        triggeredAlerts: number;
        priceChanges: {
            processed: number;
            notified: number;
        };
        priceThresholds: {
            processed: number;
            notified: number;
        };
        volumeSurges: {
            processed: number;
            notified: number;
        };
        rsiAlerts: {
            processed: number;
            notified: number;
        };
    }>;
    /**
     * Get current status
     */
    getStatus(): {
        isRunning: boolean;
    };
}
export declare const alertScheduler: AlertScheduler;

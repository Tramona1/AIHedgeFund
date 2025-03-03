/**
 * Run scheduled data collection tasks
 */
export declare function runDataCollectionTasks(): Promise<{
    symbolsProcessed: number;
    successCount: number;
    errorCount: number;
    details: any[];
}>;
/**
 * Run scheduled price alert tasks
 */
export declare function runPriceAlertTasks(): Promise<{
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
 * Run all scheduled tasks
 */
export declare function runAllScheduledTasks(): Promise<{
    dataCollection: {
        symbolsProcessed: number;
        successCount: number;
        errorCount: number;
        details: any[];
    };
    priceAlerts: {
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
    };
}>;

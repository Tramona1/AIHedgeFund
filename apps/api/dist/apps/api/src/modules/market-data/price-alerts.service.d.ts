/**
 * Price alert types
 */
export declare enum PriceAlertType {
    PRICE_THRESHOLD = "price_threshold",
    PRICE_CHANGE_PERCENT = "price_change_percent",
    VOLUME_SPIKE = "volume_spike",
    RSI_OVERBOUGHT = "rsi_overbought",
    RSI_OVERSOLD = "rsi_oversold"
}
/**
 * Service to handle price alerts functionality
 */
declare class PriceAlertsService {
    /**
     * Check for price changes above a certain threshold
     * @param threshold Percentage threshold to check for
     * @returns Results of price change checks
     */
    checkPriceChanges(threshold?: number): Promise<{
        processed: number;
        notified: number;
    }>;
    /**
     * Check for price threshold alerts
     * @returns Results of threshold checks
     */
    checkPriceThresholds(): Promise<{
        processed: number;
        notified: number;
    }>;
    /**
     * Check for volume surges
     * @param multiple Multiple of average volume to consider a surge
     * @returns Results of volume surge checks
     */
    checkVolumeSurges(multiple?: number): Promise<{
        processed: number;
        notified: number;
    }>;
    /**
     * Check for RSI overbought/oversold conditions
     * @returns Results of RSI alert checks
     */
    checkRSIAlerts(): Promise<{
        processed: number;
        notified: number;
    }>;
    /**
     * Run checks for all configured price alerts
     * @returns Results of the alert checks
     */
    runAllAlertChecks(): Promise<{
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
}
export declare const priceAlertsService: PriceAlertsService;
export {};

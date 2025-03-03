import { logger } from "@repo/logger";
const serviceLogger = logger.child({ module: "price-alerts-service" });
/**
 * Price alert types
 */
export var PriceAlertType;
(function (PriceAlertType) {
    PriceAlertType["PRICE_THRESHOLD"] = "price_threshold";
    PriceAlertType["PRICE_CHANGE_PERCENT"] = "price_change_percent";
    PriceAlertType["VOLUME_SPIKE"] = "volume_spike";
    PriceAlertType["RSI_OVERBOUGHT"] = "rsi_overbought";
    PriceAlertType["RSI_OVERSOLD"] = "rsi_oversold";
})(PriceAlertType || (PriceAlertType = {}));
/**
 * Service to handle price alerts functionality
 */
class PriceAlertsService {
    /**
     * Check for price changes above a certain threshold
     * @param threshold Percentage threshold to check for
     * @returns Results of price change checks
     */
    async checkPriceChanges(threshold = 5) {
        serviceLogger.info(`Checking for price changes above ${threshold}%`);
        return { processed: 0, notified: 0 };
    }
    /**
     * Check for price threshold alerts
     * @returns Results of threshold checks
     */
    async checkPriceThresholds() {
        serviceLogger.info("Checking price threshold alerts");
        return { processed: 0, notified: 0 };
    }
    /**
     * Check for volume surges
     * @param multiple Multiple of average volume to consider a surge
     * @returns Results of volume surge checks
     */
    async checkVolumeSurges(multiple = 2) {
        serviceLogger.info(`Checking for volume surges (${multiple}x average)`);
        return { processed: 0, notified: 0 };
    }
    /**
     * Check for RSI overbought/oversold conditions
     * @returns Results of RSI alert checks
     */
    async checkRSIAlerts() {
        serviceLogger.info("Checking RSI alerts");
        return { processed: 0, notified: 0 };
    }
    /**
     * Run checks for all configured price alerts
     * @returns Results of the alert checks
     */
    async runAllAlertChecks() {
        serviceLogger.info("Running all price alert checks");
        const results = {
            priceChanges: await this.checkPriceChanges(),
            priceThresholds: await this.checkPriceThresholds(),
            volumeSurges: await this.checkVolumeSurges(),
            rsiAlerts: await this.checkRSIAlerts()
        };
        return {
            ...results,
            alertsProcessed: Object.values(results).reduce((sum, r) => sum + r.processed, 0),
            triggeredAlerts: Object.values(results).reduce((sum, r) => sum + r.notified, 0)
        };
    }
}
export const priceAlertsService = new PriceAlertsService();
//# sourceMappingURL=price-alerts.service.js.map
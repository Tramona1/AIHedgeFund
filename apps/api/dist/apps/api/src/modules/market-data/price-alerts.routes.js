import { Hono } from "hono";
import { logger } from "@repo/logger";
import { priceAlertsService } from "./price-alerts.service.js";
// Create a logger instance for this module
const alertsLogger = logger.child({ module: "price-alerts-routes" });
// Create a router for the price alerts API
export const priceAlertsRoutes = new Hono()
    // Endpoint to manually trigger price change checks
    .get("/check", async (c) => {
    try {
        alertsLogger.info("Manual price alert check triggered");
        const results = await priceAlertsService.runAllAlertChecks();
        return c.json({
            success: true,
            message: "Price alert checks completed successfully",
            data: results
        });
    }
    catch (error) {
        alertsLogger.error("Error in manual price alert check", { error: error });
        return c.json({
            success: false,
            message: "Failed to complete price alert checks",
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
})
    // Check specific alert type
    .get("/check/:alertType", async (c) => {
    try {
        const alertType = c.req.param("alertType");
        alertsLogger.info(`Manual check for alert type: ${alertType}`);
        let result;
        switch (alertType) {
            case "price-changes":
                const thresholdParam = c.req.query("threshold");
                const threshold = thresholdParam ? parseFloat(thresholdParam) : 5;
                result = await priceAlertsService.checkPriceChanges(threshold);
                break;
            case "price-thresholds":
                result = await priceAlertsService.checkPriceThresholds();
                break;
            case "volume-surges":
                const multipleParam = c.req.query("multiple");
                const multiple = multipleParam ? parseFloat(multipleParam) : 2;
                result = await priceAlertsService.checkVolumeSurges(multiple);
                break;
            case "rsi-alerts":
                result = await priceAlertsService.checkRSIAlerts();
                break;
            default:
                return c.json({
                    success: false,
                    message: `Unknown alert type: ${alertType}`,
                    supportedTypes: ["price-changes", "price-thresholds", "volume-surges", "rsi-alerts"]
                }, 400);
        }
        return c.json({
            success: true,
            message: `${alertType} check completed successfully`,
            data: result
        });
    }
    catch (error) {
        alertsLogger.error("Error in specific alert type check", { error: error });
        return c.json({
            success: false,
            message: "Failed to complete alert check",
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
//# sourceMappingURL=price-alerts.routes.js.map
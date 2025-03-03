import { logger } from "@repo/logger";
import { priceAlertsService } from "./price-alerts.service.js";
import { dataCollectionService } from "./data-collection.service.js";
// Create a module-specific logger
const tasksLogger = logger.child({ module: "scheduled-tasks" });
/**
 * Run scheduled data collection tasks
 */
export async function runDataCollectionTasks() {
    tasksLogger.info("Running scheduled data collection tasks");
    try {
        // Collect data for all watchlisted stocks
        const rawResults = await dataCollectionService.collectDataForWatchlist();
        // Process results
        const successCount = rawResults.filter(r => r.success !== false).length;
        const errorCount = rawResults.filter(r => r.success === false).length;
        const results = {
            symbolsProcessed: rawResults.length,
            successCount,
            errorCount,
            details: rawResults
        };
        tasksLogger.info("Data collection completed", {
            symbolsProcessed: results.symbolsProcessed,
            successCount: results.successCount,
            errorCount: results.errorCount
        });
        return results;
    }
    catch (error) {
        tasksLogger.error("Error running data collection tasks", {
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Run scheduled price alert tasks
 */
export async function runPriceAlertTasks() {
    tasksLogger.info("Running scheduled price alert tasks");
    try {
        // Run all price alert checks
        const results = await priceAlertsService.runAllAlertChecks();
        tasksLogger.info("Completed price alerts check. Processed: " + results.alertsProcessed + ", Triggered: " + results.triggeredAlerts);
        return results;
    }
    catch (error) {
        tasksLogger.error("Error running price alert tasks", {
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Run all scheduled tasks
 */
export async function runAllScheduledTasks() {
    tasksLogger.info("Running all scheduled tasks");
    try {
        // Run data collection first
        const collectionResults = await runDataCollectionTasks();
        // Then run price alerts (which will use the freshly collected data)
        const alertResults = await runPriceAlertTasks();
        return {
            dataCollection: collectionResults,
            priceAlerts: alertResults
        };
    }
    catch (error) {
        tasksLogger.error("Error running all scheduled tasks", {
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
//# sourceMappingURL=scheduled-tasks.js.map
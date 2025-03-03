import { logger } from "@repo/logger";
import { unusualWhalesService } from "./unusual-whales.service.js";
// Create a module-specific logger
const whalesJobLogger = logger.child({ module: "unusual-whales-collection-job" });
/**
 * Function to collect options flow data from Unusual Whales API
 */
export async function collectOptionsFlowData() {
    try {
        whalesJobLogger.info("Starting collection of options flow data");
        // Fetch and store options flow data
        const data = await unusualWhalesService.getLatestOptionsFlow();
        whalesJobLogger.info(`Successfully collected ${data.length} options flow items`);
        return true;
    }
    catch (error) {
        whalesJobLogger.error("Failed to collect options flow data", {
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}
/**
 * Function to collect dark pool data from Unusual Whales API
 */
export async function collectDarkPoolData() {
    try {
        whalesJobLogger.info("Starting collection of dark pool data");
        // Fetch and store dark pool data
        const data = await unusualWhalesService.getLatestDarkPoolData();
        whalesJobLogger.info(`Successfully collected ${data.length} dark pool items`);
        return true;
    }
    catch (error) {
        whalesJobLogger.error("Failed to collect dark pool data", {
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}
/**
 * Function to run all Unusual Whales data collection jobs
 */
export async function runUnusualWhalesCollectionJobs() {
    whalesJobLogger.info("Starting Unusual Whales data collection jobs");
    const optionsFlowSuccess = await collectOptionsFlowData();
    const darkPoolSuccess = await collectDarkPoolData();
    whalesJobLogger.info("Completed Unusual Whales data collection jobs", {
        optionsFlowSuccess,
        darkPoolSuccess
    });
    return {
        optionsFlowSuccess,
        darkPoolSuccess
    };
}
//# sourceMappingURL=unusual-whales-collection-job.js.map
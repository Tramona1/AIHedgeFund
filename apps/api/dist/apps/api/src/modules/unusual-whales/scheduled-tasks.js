import { logger } from "@repo/logger";
import { runUnusualWhalesCollectionJobs } from "./unusual-whales-collection-job.js";
// Create a module-specific logger
const tasksLogger = logger.child({ module: "unusual-whales-scheduled-tasks" });
/**
 * Run all Unusual Whales scheduled tasks
 */
export async function runUnusualWhalesScheduledTasks() {
    tasksLogger.info("Running Unusual Whales scheduled tasks");
    try {
        // Run data collection for Unusual Whales
        const collectionResults = await runUnusualWhalesCollectionJobs();
        tasksLogger.info("Unusual Whales scheduled tasks completed", {
            optionsFlowSuccess: collectionResults.optionsFlowSuccess,
            darkPoolSuccess: collectionResults.darkPoolSuccess
        });
        return collectionResults;
    }
    catch (error) {
        tasksLogger.error("Error running Unusual Whales scheduled tasks", {
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
//# sourceMappingURL=scheduled-tasks.js.map
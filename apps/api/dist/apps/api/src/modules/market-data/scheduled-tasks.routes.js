import { Hono } from "hono";
import { logger } from "@repo/logger";
import { runDataCollectionTasks, runPriceAlertTasks, runAllScheduledTasks } from "./scheduled-tasks.js";
// Create a module-specific logger
const routeLogger = logger.child({ module: "scheduled-tasks-routes" });
// Create a router for scheduled tasks
export const scheduledTasksRoutes = new Hono()
    // Run all scheduled tasks
    .get("/run-all", async (c) => {
    try {
        routeLogger.info("Manual trigger for all scheduled tasks");
        const results = await runAllScheduledTasks();
        return c.json({
            success: true,
            message: "All scheduled tasks completed successfully",
            data: results
        });
    }
    catch (error) {
        routeLogger.error("Error running all scheduled tasks", { error });
        return c.json({
            success: false,
            message: "Failed to run scheduled tasks",
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
})
    // Run data collection tasks only
    .get("/run-data-collection", async (c) => {
    try {
        routeLogger.info("Manual trigger for data collection tasks");
        const results = await runDataCollectionTasks();
        return c.json({
            success: true,
            message: "Data collection tasks completed successfully",
            data: results
        });
    }
    catch (error) {
        routeLogger.error("Error running data collection tasks", { error });
        return c.json({
            success: false,
            message: "Failed to run data collection tasks",
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
})
    // Run price alert tasks only
    .get("/run-price-alerts", async (c) => {
    try {
        routeLogger.info("Manual trigger for price alert tasks");
        const results = await runPriceAlertTasks();
        return c.json({
            success: true,
            message: "Price alert tasks completed successfully",
            data: results
        });
    }
    catch (error) {
        routeLogger.error("Error running price alert tasks", { error });
        return c.json({
            success: false,
            message: "Failed to run price alert tasks",
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
//# sourceMappingURL=scheduled-tasks.routes.js.map
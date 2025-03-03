import express, { Request, Response } from "express";
import { logger } from "@repo/logger";
import { runDataCollectionTasks, runPriceAlertTasks, runAllScheduledTasks } from "./scheduled-tasks.js";

// Create a module-specific logger
const routeLogger = logger.child({ module: "scheduled-tasks-routes" });

// Create an Express router for scheduled tasks
const router = express.Router();

// Run all scheduled tasks
router.get("/run-all", async (req: Request, res: Response) => {
  try {
    routeLogger.info("Manual trigger for all scheduled tasks");
    
    const results = await runAllScheduledTasks();
    
    return res.json({
      success: true,
      message: "All scheduled tasks completed successfully",
      data: results
    });
  } catch (error: any) {
    routeLogger.error("Error running all scheduled tasks", { error });
    
    return res.status(500).json({
      success: false,
      message: "Failed to run scheduled tasks",
      error: error.message || String(error)
    });
  }
});

// Run data collection tasks only
router.get("/run-data-collection", async (req: Request, res: Response) => {
  try {
    routeLogger.info("Manual trigger for data collection tasks");
    
    const results = await runDataCollectionTasks();
    
    return res.json({
      success: true,
      message: "Data collection tasks completed successfully",
      data: results
    });
  } catch (error: any) {
    routeLogger.error("Error running data collection tasks", { error });
    
    return res.status(500).json({
      success: false,
      message: "Failed to run data collection tasks",
      error: error.message || String(error)
    });
  }
});

// Run price alert tasks only
router.get("/run-price-alerts", async (req: Request, res: Response) => {
  try {
    routeLogger.info("Manual trigger for price alert tasks");
    
    const results = await runPriceAlertTasks();
    
    return res.json({
      success: true,
      message: "Price alert tasks completed successfully",
      data: results
    });
  } catch (error: any) {
    routeLogger.error("Error running price alert tasks", { error });
    
    return res.status(500).json({
      success: false,
      message: "Failed to run price alert tasks",
      error: error.message || String(error)
    });
  }
});

export const scheduledTasksRoutes = router; 
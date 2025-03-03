import express, { Request, Response } from "express";
import { logger } from "@repo/logger";
import { priceAlertsService, PriceAlertType } from "./price-alerts.service.js";

// Create a logger instance for this module
const alertsLogger = logger.child({ module: "price-alerts-routes" });

// Create an Express router for the price alerts API
const router = express.Router();

// Endpoint to manually trigger price alert checks
router.get("/check", async (req: Request, res: Response) => {
  try {
    alertsLogger.info("Manual price alert check triggered");
    
    const results = await priceAlertsService.runAllAlertChecks();
    
    return res.json({
      success: true,
      message: "Price alert checks completed successfully",
      data: results
    });
  } catch (error: any) {
    alertsLogger.error("Error in manual price alert check", { error });
    
    return res.status(500).json({
      success: false,
      message: "Failed to complete price alert checks",
      error: error.message || String(error)
    });
  }
});

// Endpoint to check specific alert types
router.get("/check/:alertType", async (req: Request, res: Response) => {
  try {
    const alertType = req.params.alertType;
    alertsLogger.info(`Manual check for alert type: ${alertType}`);
    
    let result;
    
    switch (alertType) {
      case "price-changes":
        const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : 5;
        result = await priceAlertsService.checkPriceChanges(threshold);
        break;
        
      case "price-thresholds":
        result = await priceAlertsService.checkPriceThresholds();
        break;
        
      case "volume-surges":
        const multiple = req.query.multiple ? parseFloat(req.query.multiple as string) : 2;
        result = await priceAlertsService.checkVolumeSurges(multiple);
        break;
        
      case "rsi-alerts":
        result = await priceAlertsService.checkRSIAlerts();
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown alert type: ${alertType}`,
          supportedTypes: ["price-changes", "price-thresholds", "volume-surges", "rsi-alerts"]
        });
    }
    
    return res.json({
      success: true,
      message: `${alertType} check completed successfully`,
      data: result
    });
  } catch (error: any) {
    alertsLogger.error("Error in specific alert type check", { error });
    
    return res.status(500).json({
      success: false,
      message: "Failed to complete alert check",
      error: error.message || String(error)
    });
  }
});

// Endpoint to set a price alert
router.post("/set", async (req: Request, res: Response) => {
  try {
    const { userId, symbol, type, threshold, message } = req.body;
    
    if (!userId || !symbol || !type || !threshold) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, symbol, type, and threshold are required"
      });
    }
    
    alertsLogger.info("Setting price alert", { userId, symbol, type, threshold });
    
    const alert = await priceAlertsService.setPriceAlert(userId, symbol, type, threshold, message);
    
    return res.status(201).json({
      success: true,
      message: "Price alert set successfully",
      data: alert
    });
  } catch (error: any) {
    alertsLogger.error("Error setting price alert", { error });
    
    return res.status(500).json({
      success: false,
      message: "Failed to set price alert",
      error: error.message || String(error)
    });
  }
});

// Endpoint to get all price alerts for a user
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    alertsLogger.info("Getting price alerts for user", { userId });
    
    const alerts = await priceAlertsService.getUserAlerts(userId);
    
    return res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    alertsLogger.error("Error getting user price alerts", { error, userId: req.params.userId });
    
    return res.status(500).json({
      success: false,
      message: "Failed to get price alerts",
      error: error.message || String(error)
    });
  }
});

// Export the router
export const priceAlertsRoutes = router; 
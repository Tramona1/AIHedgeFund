import { logger } from "@repo/logger";
import { priceAlertsService } from "./price-alerts.service";

// Create a module-specific logger
const schedulerLogger = logger.child({ module: "alert-scheduler" });

/**
 * Class to handle scheduling of price alert checks
 */
export class AlertScheduler {
  // Store interval IDs for cleanup
  private priceAlertInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start the alert scheduler
   */
  start() {
    schedulerLogger.info("Starting alert scheduler");
    
    // Check price alerts every 15 minutes
    this.schedulePriceAlerts(15 * 60 * 1000);
    
    schedulerLogger.info("Alert scheduler started successfully");
  }
  
  /**
   * Stop the alert scheduler
   */
  stop() {
    schedulerLogger.info("Stopping alert scheduler");
    
    if (this.priceAlertInterval) {
      clearInterval(this.priceAlertInterval);
      this.priceAlertInterval = null;
    }
    
    schedulerLogger.info("Alert scheduler stopped successfully");
  }
  
  /**
   * Schedule regular price alert checks
   */
  private schedulePriceAlerts(intervalMs: number) {
    schedulerLogger.info(`Scheduling price alerts to run every ${intervalMs / 1000} seconds`);
    
    // Run an initial check to make sure everything is working
    this.runPriceAlertCheck().catch(error => {
      schedulerLogger.error("Error in initial price alert check", { error });
    });
    
    // Set up the interval for regular checks
    this.priceAlertInterval = setInterval(() => {
      this.runPriceAlertCheck().catch(error => {
        schedulerLogger.error("Error in scheduled price alert check", { error });
      });
    }, intervalMs);
  }
  
  /**
   * Run the price alert check
   */
  private async runPriceAlertCheck() {
    try {
      schedulerLogger.info("Running scheduled price alert check");
      
      const results = await priceAlertsService.runAllAlertChecks();
      
      schedulerLogger.info("Completed scheduled price alert check", { results });
      
      return results;
    } catch (error) {
      schedulerLogger.error("Error running scheduled price alert check", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
}

// Export a singleton instance
export const alertScheduler = new AlertScheduler(); 
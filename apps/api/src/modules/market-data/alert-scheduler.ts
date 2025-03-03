import { logger } from "@repo/logger";
import { priceAlertsService } from './price-alerts.service.js';

// Create a module-specific logger
const schedulerLogger = logger.child({ module: "alert-scheduler" });

/**
 * Class to handle scheduling of price alert checks
 */
export class AlertScheduler {
  // Flag to track if scheduler is running
  private isRunning: boolean = false;
  
  /**
   * Start the alert scheduler
   */
  start() {
    schedulerLogger.info("Starting alert scheduler");
    
    // Set running flag
    this.isRunning = true;
    
    // Run an initial check
    this.runPriceAlertCheck().catch(error => {
      schedulerLogger.error("Error in initial price alert check", { error });
    });
    
    schedulerLogger.info("Alert scheduler started successfully");
    
    return { started: true };
  }
  
  /**
   * Stop the alert scheduler
   */
  stop() {
    schedulerLogger.info("Stopping alert scheduler");
    
    // Just set the flag to false - no need to clear intervals
    this.isRunning = false;
    
    schedulerLogger.info("Alert scheduler stopped successfully");
    
    return { stopped: true };
  }
  
  /**
   * Run the price alert check manually
   * This can be called directly from API or scheduled externally
   */
  async runPriceAlertCheck() {
    try {
      schedulerLogger.info("Running price alert check");
      
      const results = await priceAlertsService.runAllAlertChecks();
      
      schedulerLogger.info("Completed price alert check", { results });
      
      return results;
    } catch (error) {
      schedulerLogger.error("Error running price alert check", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning
    };
  }
}

// Export a singleton instance
export const alertScheduler = new AlertScheduler(); 
import { runUnusualWhalesCollectionJobs } from './unusual-whales-collection-job.js';
import { logger } from '@repo/logger';

// Create a module-specific logger
const schedulerLogger = logger.child({ module: 'unusual-whales-scheduler' });

/**
 * Class that handles scheduling of data collection jobs for Unusual Whales data
 */
export class UnusualWhalesScheduler {
  private isRunning = false;
  
  /**
   * Start the scheduler for collecting Unusual Whales data
   */
  startScheduler() {
    schedulerLogger.info('Starting Unusual Whales data collection scheduler');
    
    this.isRunning = true;
    
    // Run an initial collection
    this.collectUnusualWhalesData();
    
    schedulerLogger.info('Unusual Whales data collection scheduler started');
    
    return {
      isRunning: this.isRunning
    };
  }
  
  /**
   * Stop the scheduler for collecting Unusual Whales data
   */
  stopScheduler() {
    schedulerLogger.info('Stopping Unusual Whales data collection scheduler');
    
    this.isRunning = false;
    
    schedulerLogger.info('Unusual Whales data collection scheduler stopped');
    
    return { stopped: true };
  }
  
  /**
   * Determine if data should be collected based on market hours and schedule
   */
  shouldCollectData(): boolean {
    try {
      if (!this.isRunning) {
        return false;
      }
      
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Convert to Eastern Time (ET) - simplified, doesn't account for DST
      const etHour = (hour + 24 - 5) % 24; // UTC-5 for Eastern Time
      
      // Weekday check (Monday through Friday)
      const isWeekday = day >= 1 && day <= 5;
      
      // Market hours check (9:30 AM to 4:00 PM ET)
      const isMarketHours = 
        (etHour > 9 || (etHour === 9 && minute >= 30)) && // After 9:30 AM ET
        (etHour < 16); // Before 4:00 PM ET
      
      // Collect during market hours on weekdays
      if (isWeekday && isMarketHours) {
        return true;
      }
      
      // Collect right after market close (4:05 PM ET)
      if (isWeekday && etHour === 16 && minute >= 5 && minute <= 15) {
        return true;
      }
      
      // Collect in the evening (8:00-8:10 PM ET) for end-of-day analysis
      if (isWeekday && etHour === 20 && minute <= 10) {
        return true;
      }
      
      // Collect on weekend for weekly analysis
      // Saturday at 12:00 PM ET
      if (day === 6 && etHour === 12 && minute <= 10) {
        return true;
      }
      
      return false;
    } catch (error) {
      schedulerLogger.error('Error determining collection schedule', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // Default to false if there's an error
      return false;
    }
  }
  
  /**
   * Run the data collection for Unusual Whales data
   */
  async collectUnusualWhalesData() {
    try {
      schedulerLogger.info('Starting Unusual Whales data collection');
      
      const results = await runUnusualWhalesCollectionJobs();
      
      schedulerLogger.info('Completed Unusual Whales data collection', {
        optionsFlowSuccess: results.optionsFlowSuccess,
        darkPoolSuccess: results.darkPoolSuccess
      });
      
      return results;
    } catch (error) {
      schedulerLogger.error('Error collecting Unusual Whales data', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return { 
        error: error instanceof Error ? error.message : String(error),
        optionsFlowSuccess: false,
        darkPoolSuccess: false
      };
    }
  }
  
  /**
   * Force a data collection for Unusual Whales data
   * This can be triggered manually via an API endpoint
   */
  async forceCollectUnusualWhalesData() {
    schedulerLogger.info('Manual Unusual Whales data collection triggered');
    return this.collectUnusualWhalesData();
  }
  
  /**
   * Get the current status of the scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning
    };
  }
}

// Export a singleton instance
export const unusualWhalesScheduler = new UnusualWhalesScheduler(); 
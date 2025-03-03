import { dataCollectionService } from './data-collection.service.js';
import { logger } from '@repo/logger';

// Create a module-specific logger
const schedulerLogger = logger.child({ module: 'market-data-scheduler' });

/**
 * Class that handles scheduling of data collection jobs for market data
 */
export class CollectionScheduler {
  private isRunning = false;
  private isMarketOpen = false;
  
  /**
   * Start the scheduler for collecting market data
   */
  startScheduler() {
    schedulerLogger.info('Starting market data collection scheduler');
    
    this.isRunning = true;
    
    // Check market hours on startup
    this.checkMarketHours();
    
    // Run initial collection
    this.collectWatchlistData();
    
    schedulerLogger.info('Market data collection scheduler started');
    
    return {
      isRunning: this.isRunning,
      isMarketOpen: this.isMarketOpen
    };
  }
  
  /**
   * Stop the scheduler for collecting market data
   */
  stopScheduler() {
    schedulerLogger.info('Stopping market data collection scheduler');
    
    this.isRunning = false;
    
    schedulerLogger.info('Market data collection scheduler stopped');
    
    return { stopped: true };
  }
  
  /**
   * Check if the US stock market is currently open
   * This is a simplified version - a production implementation would
   * consider holidays, early closings, etc.
   */
  checkMarketHours() {
    try {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Convert to Eastern Time (ET) - simplified, doesn't account for DST
      // In production, use a proper timezone library
      const etHour = (hour + 24 - 5) % 24; // UTC-5 for Eastern Time
      
      // Market is open Monday (1) through Friday (5)
      // Normal hours are 9:30 AM to 4:00 PM ET
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = 
        (etHour > 9 || (etHour === 9 && minute >= 30)) && // After 9:30 AM ET
        (etHour < 16); // Before 4:00 PM ET
      
      const wasOpen = this.isMarketOpen;
      this.isMarketOpen = isWeekday && isMarketHours;
      
      // Log if market state changed
      if (wasOpen !== this.isMarketOpen) {
        schedulerLogger.info(`Market is now ${this.isMarketOpen ? 'OPEN' : 'CLOSED'}`);
      }
      
      return this.isMarketOpen;
    } catch (error) {
      schedulerLogger.error('Error checking market hours', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // Default to closed if there's an error
      this.isMarketOpen = false;
      return false;
    }
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
      
      // Always collect during market hours
      if (this.isMarketOpen) {
        return true;
      }
      
      // Collect right after market close (4:05 PM ET)
      if (day >= 1 && day <= 5 && etHour === 16 && minute >= 5 && minute <= 15) {
        return true;
      }
      
      // Collect in the evening (8:00-8:10 PM ET) for after-hours analysis
      if (day >= 1 && day <= 5 && etHour === 20 && minute <= 10) {
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
   * Run the data collection for watchlist symbols
   */
  async collectWatchlistData() {
    try {
      schedulerLogger.info('Starting watchlist data collection');
      
      const results = await dataCollectionService.collectDataForWatchlist();
      
      const successCount = results.filter(r => 
        r.quote?.success || 
        r.company?.success || 
        r.balanceSheet?.success || 
        r.rsi?.success
      ).length;
      
      schedulerLogger.info(`Completed watchlist data collection: ${successCount}/${results.length} symbols processed successfully`);
      
      return results;
    } catch (error) {
      schedulerLogger.error('Error collecting watchlist data', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
  
  /**
   * Force a data collection for watchlist symbols
   * This can be triggered manually via an API endpoint
   */
  async forceCollectWatchlistData() {
    schedulerLogger.info('Manual watchlist data collection triggered');
    return this.collectWatchlistData();
  }
  
  /**
   * Get the current status of the scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isMarketOpen: this.isMarketOpen
    };
  }
}

// Export a singleton instance
export const collectionScheduler = new CollectionScheduler(); 
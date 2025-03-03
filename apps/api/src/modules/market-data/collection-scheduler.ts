import { dataCollectionService } from './data-collection.service';
import { logger } from '@repo/logger';

// Create a module-specific logger
const schedulerLogger = logger.child({ module: 'market-data-scheduler' });

/**
 * Class that handles scheduling of data collection jobs for market data
 */
export class CollectionScheduler {
  private watchlistCollectionInterval: NodeJS.Timeout | null = null;
  private isMarketOpen = false;
  
  /**
   * Start the scheduler for collecting market data
   */
  startScheduler() {
    schedulerLogger.info('Starting market data collection scheduler');
    
    // Schedule a job to check if the market is open
    this.scheduleMarketHoursCheck();
    
    // Schedule a job to collect data for watchlist symbols
    this.scheduleWatchlistCollection();
    
    schedulerLogger.info('Market data collection scheduler started');
    
    return {
      watchlistCollectionActive: !!this.watchlistCollectionInterval,
      marketHoursCheckActive: true
    };
  }
  
  /**
   * Stop the scheduler for collecting market data
   */
  stopScheduler() {
    schedulerLogger.info('Stopping market data collection scheduler');
    
    // Clear the watchlist collection interval
    if (this.watchlistCollectionInterval) {
      clearInterval(this.watchlistCollectionInterval);
      this.watchlistCollectionInterval = null;
    }
    
    schedulerLogger.info('Market data collection scheduler stopped');
    
    return { stopped: true };
  }
  
  /**
   * Schedule a job to check if the market is open
   * This runs every 15 minutes during potential market hours
   */
  private scheduleMarketHoursCheck() {
    // Check immediately on startup
    this.checkMarketHours();
    
    // Then check every 15 minutes
    setInterval(() => {
      this.checkMarketHours();
    }, 15 * 60 * 1000); // 15 minutes
    
    schedulerLogger.info('Market hours check scheduled');
  }
  
  /**
   * Check if the US stock market is currently open
   * This is a simplified version - a production implementation would
   * consider holidays, early closings, etc.
   */
  private checkMarketHours() {
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
   * Schedule a job to collect data for watchlist symbols
   * - During market hours: runs every 10 minutes
   * - After hours: runs once at market close, once at 8 PM ET
   */
  private scheduleWatchlistCollection() {
    // Collect data immediately on startup
    this.collectWatchlistData();
    
    // Schedule regular collection
    this.watchlistCollectionInterval = setInterval(() => {
      // Check if we should run collection based on market hours
      const shouldCollect = this.shouldCollectData();
      
      if (shouldCollect) {
        schedulerLogger.info('Running scheduled watchlist data collection');
        this.collectWatchlistData();
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    
    schedulerLogger.info('Watchlist data collection scheduled');
  }
  
  /**
   * Determine if data should be collected based on market hours and schedule
   */
  private shouldCollectData(): boolean {
    try {
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
  private async collectWatchlistData() {
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
}

// Export a singleton instance
export const collectionScheduler = new CollectionScheduler(); 
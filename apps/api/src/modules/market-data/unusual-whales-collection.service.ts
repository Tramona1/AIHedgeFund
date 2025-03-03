/**
 * Unusual Whales Data Collection Service
 * Collects and stores options flow and dark pool data
 */

import { db } from "@repo/db";
import { optionsFlow, darkPool } from "@repo/db/schema";
import { logger } from "@repo/logger";
import { sql } from "drizzle-orm";
import { unusualWhalesService } from "./unusual-whales.service.js";

// Create a module-specific logger
const collectionLogger = logger.child({ module: "unusual-whales-collection" });

/**
 * Service for collecting and storing data from Unusual Whales API
 */
export class UnusualWhalesCollectionService {
  /**
   * Collect options flow data for a symbol
   * @param symbol Stock ticker symbol (optional - if not provided, collects for all available symbols)
   */
  async collectOptionsFlow(symbol?: string): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      collectionLogger.info(`Starting options flow collection${symbol ? ` for ${symbol}` : ''}`);
      
      // Fetch data from Unusual Whales API
      const optionsFlowData = await unusualWhalesService.getOptionsFlow(symbol);
      
      if (!optionsFlowData || !Array.isArray(optionsFlowData) || optionsFlowData.length === 0) {
        return { 
          success: false, 
          count: 0, 
          message: "No options flow data available" 
        };
      }
      
      collectionLogger.info(`Retrieved ${optionsFlowData.length} options flow records${symbol ? ` for ${symbol}` : ''}`);
      
      // Process and store each record
      let insertedCount = 0;
      
      for (const flowData of optionsFlowData) {
        try {
          // Transform API data to match our schema
          const transformedData = {
            symbol: flowData.symbol,
            timestamp: new Date(flowData.timestamp),
            contractType: flowData.type, // Assuming API returns 'type' as CALL or PUT
            strikePrice: flowData.strike_price,
            expiration: new Date(flowData.expiration),
            volume: flowData.volume,
            openInterest: flowData.open_interest,
            impliedVolatility: flowData.implied_volatility,
            premium: flowData.premium,
            premiumValue: flowData.premium_value,
            tradeSide: flowData.side, // Assuming API returns 'side' as BUY or SELL
            unusualScore: flowData.unusual_score,
          };
          
          // Insert into database
          await db.insert(optionsFlow).values(transformedData);
          insertedCount++;
        } catch (error: any) {
          collectionLogger.error("Error processing options flow record", {
            symbol: flowData.symbol,
            error: error.message
          });
        }
      }
      
      collectionLogger.info(`Successfully stored ${insertedCount} options flow records`);
      
      return {
        success: true,
        count: insertedCount
      };
    } catch (error: any) {
      collectionLogger.error("Error collecting options flow data", {
        symbol,
        error: error.message
      });
      
      return {
        success: false,
        count: 0,
        message: `Error collecting options flow data: ${error.message}`
      };
    }
  }
  
  /**
   * Collect dark pool data for a symbol
   * @param symbol Stock ticker symbol (optional - if not provided, collects for all available symbols)
   */
  async collectDarkPoolData(symbol?: string): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      collectionLogger.info(`Starting dark pool data collection${symbol ? ` for ${symbol}` : ''}`);
      
      // Fetch data from Unusual Whales API
      const darkPoolData = await unusualWhalesService.getDarkPoolData(symbol);
      
      if (!darkPoolData || !Array.isArray(darkPoolData) || darkPoolData.length === 0) {
        return { 
          success: false, 
          count: 0, 
          message: "No dark pool data available" 
        };
      }
      
      collectionLogger.info(`Retrieved ${darkPoolData.length} dark pool records${symbol ? ` for ${symbol}` : ''}`);
      
      // Process and store each record
      let insertedCount = 0;
      
      for (const poolData of darkPoolData) {
        try {
          // Transform API data to match our schema
          const transformedData = {
            symbol: poolData.symbol,
            timestamp: new Date(poolData.timestamp),
            volume: poolData.volume,
            price: poolData.price,
            totalValue: poolData.value, // Assuming API returns 'value' as the total value
            exchange: poolData.exchange,
            isBullish: poolData.is_bullish, // Boolean indicating if trade is considered bullish
            significanceScore: poolData.significance_score,
          };
          
          // Insert into database
          await db.insert(darkPool).values(transformedData);
          insertedCount++;
        } catch (error: any) {
          collectionLogger.error("Error processing dark pool record", {
            symbol: poolData.symbol,
            error: error.message
          });
        }
      }
      
      collectionLogger.info(`Successfully stored ${insertedCount} dark pool records`);
      
      return {
        success: true,
        count: insertedCount
      };
    } catch (error: any) {
      collectionLogger.error("Error collecting dark pool data", {
        symbol,
        error: error.message
      });
      
      return {
        success: false,
        count: 0,
        message: `Error collecting dark pool data: ${error.message}`
      };
    }
  }
  
  /**
   * Collect both options flow and dark pool data for watchlist
   */
  async collectWatchlistData(): Promise<{ optionsFlow: any; darkPool: any }> {
    try {
      // Get unique symbols from watchlist
      const watchlistSymbols = await this.getWatchlistSymbols();
      
      collectionLogger.info(`Collecting data for ${watchlistSymbols.length} watchlist symbols`);
      
      const optionsResults = [];
      const darkPoolResults = [];
      
      // Collect data for each symbol
      for (const symbol of watchlistSymbols) {
        try {
          const optionsResult = await this.collectOptionsFlow(symbol);
          optionsResults.push({ symbol, ...optionsResult });
          
          const darkPoolResult = await this.collectDarkPoolData(symbol);
          darkPoolResults.push({ symbol, ...darkPoolResult });
          
          // Small delay to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          collectionLogger.error(`Error collecting data for ${symbol}`, {
            error: error.message
          });
        }
      }
      
      return {
        optionsFlow: optionsResults,
        darkPool: darkPoolResults
      };
    } catch (error: any) {
      collectionLogger.error("Error collecting watchlist data", {
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Get unique symbols from user watchlists
   */
  private async getWatchlistSymbols(): Promise<string[]> {
    try {
      // This is a simplified example - adjust to match your actual schema
      const result = await db.execute(`
        SELECT DISTINCT symbol FROM user_watchlist_items
        WHERE is_active = true
      `);
      
      return result.map((row: any) => row.symbol);
    } catch (error: any) {
      collectionLogger.error("Error getting watchlist symbols", {
        error: error.message
      });
      
      return [];
    }
  }
}

// Singleton instance
export const unusualWhalesCollectionService = new UnusualWhalesCollectionService(); 
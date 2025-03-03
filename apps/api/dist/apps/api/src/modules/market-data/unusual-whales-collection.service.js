/**
 * Unusual Whales Data Collection Service
 * Collects and stores options flow and dark pool data
 */
import { logger } from "@repo/logger";
import { db } from "@repo/db";
import { sql } from "drizzle-orm";
import { unusualWhalesService } from "./unusual-whales.service.js";
import { safeTable, batchInsert } from "../../lib/db-helpers.js";
// Get schema tables directly from the DB instance
const { optionsFlow, darkPoolData, userWatchlist } = db._.schema;
// Create type-safe table proxies
const safeOptionsFlow = safeTable(optionsFlow);
const safeDarkPoolData = safeTable(darkPoolData);
const safeUserWatchlist = safeTable(userWatchlist);
// Create a module-specific logger
const collectionLogger = logger.child({ module: "unusual-whales-collection" });
/**
 * Service for collecting and storing data from Unusual Whales API
 */
export class UnusualWhalesCollectionService {
    /**
     * Collect options flow data from Unusual Whales API
     */
    async collectOptionsFlow(symbol) {
        try {
            collectionLogger.info("Collecting options flow data", { symbol });
            // Fetch data from Unusual Whales API
            const optionsFlowData = await unusualWhalesService.getOptionsFlow(symbol);
            // Filter by symbol if provided
            const filteredData = symbol
                ? optionsFlowData.filter(item => item.ticker === symbol)
                : optionsFlowData;
            if (filteredData.length === 0) {
                return {
                    success: true,
                    count: 0,
                    message: `No options flow data found ${symbol ? `for ${symbol}` : ""}`,
                };
            }
            // Transform data for database storage
            const dataToInsert = filteredData.map(item => ({
                ticker: item.ticker,
                strike: item.strike,
                contractType: item.contractType,
                expiration: new Date(item.expiration),
                sentiment: item.sentiment,
                volume: item.volume,
                openInterest: item.openInterest,
                premium: item.premium,
                timestamp: new Date(item.timestamp),
                volatility: item.volatility,
                underlyingPrice: item.underlyingPrice,
            }));
            // Use our enhanced batchInsert function with batch size and error handling
            const batchSize = 50;
            const results = await batchInsert(optionsFlow, dataToInsert, batchSize, true // Continue processing other batches even if one fails
            );
            const insertedCount = results.length;
            collectionLogger.info(`Successfully collected options flow data`, {
                total: filteredData.length,
                inserted: insertedCount,
                symbol: symbol || "all",
            });
            return {
                success: true,
                count: insertedCount,
                message: `Successfully collected ${insertedCount} options flow records`,
            };
        }
        catch (error) {
            collectionLogger.error("Error collecting options flow data", {
                symbol,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                success: false,
                count: 0,
                message: `Error collecting options flow data: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Collect dark pool data for a symbol
     * @param symbol Stock ticker symbol (optional - if not provided, collects for all available symbols)
     */
    async collectDarkPoolData(symbol) {
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
                    await db.insert(darkPoolData).values(transformedData);
                    insertedCount++;
                }
                catch (error) {
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
        }
        catch (error) {
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
    async collectWatchlistData() {
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
                }
                catch (error) {
                    collectionLogger.error(`Error collecting data for ${symbol}`, {
                        error: error.message
                    });
                }
            }
            return {
                optionsFlow: optionsResults,
                darkPool: darkPoolResults
            };
        }
        catch (error) {
            collectionLogger.error("Error collecting watchlist data", {
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Get unique symbols from user watchlists
     */
    async getWatchlistSymbols() {
        try {
            // This is a simplified example - adjust to match your actual schema
            const result = await db.execute(sql `
        SELECT DISTINCT ticker FROM user_watchlist 
        WHERE is_active = true
      `);
            return result.map((row) => row.ticker);
        }
        catch (error) {
            collectionLogger.error("Error getting watchlist symbols", {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
}
// Singleton instance
export const unusualWhalesCollectionService = new UnusualWhalesCollectionService();
//# sourceMappingURL=unusual-whales-collection.service.js.map
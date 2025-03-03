import { Hono } from "hono";
import { logger } from "@repo/logger";
import { db } from "../../lib/db.js";
import { stockData } from "@repo/db/schema";
import { eq, inArray } from "drizzle-orm";
// Create a module-specific logger
const stocksLogger = logger.child({ module: "stocks-routes" });
// Create a Hono app for the stocks routes
const app = new Hono();
/**
 * Get stock data for requested symbols
 * GET /api/market-data/stocks
 * Query params: symbols (comma-separated list)
 */
app.get('/', async (c) => {
    try {
        const symbolsParam = c.req.query('symbols');
        let symbols = [];
        if (symbolsParam) {
            symbols = symbolsParam.split(',').map(symbol => symbol.trim().toUpperCase());
        }
        stocksLogger.info(`Getting stock data for ${symbols.length > 0 ? symbols.join(', ') : 'all stocks'}`);
        let stockResult;
        if (symbols.length > 0) {
            // Query specific symbols
            stockResult = await db.select()
                .from(stockData)
                .where(inArray(stockData.symbol, symbols));
        }
        else {
            // Get all stocks with a limit
            stockResult = await db.select()
                .from(stockData)
                .limit(100);
        }
        // If no results found in the database
        if (!stockResult || stockResult.length === 0) {
            stocksLogger.warn(`No stock data found for requested symbols`);
            return c.json({
                stocks: [],
                timestamp: new Date().toISOString()
            });
        }
        return c.json({
            stocks: stockResult,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        stocksLogger.error(`Error getting stock data`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get stock data',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get stock data for a specific symbol
 * GET /api/market-data/stocks/:symbol
 */
app.get('/:symbol', async (c) => {
    try {
        const symbol = c.req.param('symbol').toUpperCase();
        stocksLogger.info(`Getting stock data for symbol: ${symbol}`);
        const stockResult = await db.select()
            .from(stockData)
            .where(eq(stockData.symbol, symbol))
            .limit(1);
        if (!stockResult || stockResult.length === 0) {
            return c.json({
                success: false,
                message: `No stock data found for symbol: ${symbol}`
            }, 404);
        }
        return c.json({
            success: true,
            symbol,
            data: stockResult[0]
        });
    }
    catch (error) {
        stocksLogger.error(`Error getting stock data for ${c.req.param('symbol')}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get stock data',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
// Export the stocks routes
export const stocksRoutes = app;
//# sourceMappingURL=stocks.routes.js.map
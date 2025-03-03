import { Hono } from "hono";
import { logger } from "@repo/logger";
import { alphaVantageService } from "./alpha-vantage.service.js";
import { collectionRoutes } from "./collection-routes.js";
import { watchlistRoutes } from "./watchlist.routes.js";
import { unusualWhalesRoutes } from "../unusual-whales/unusual-whales.routes.js";
import { stocksRoutes } from "./stocks.routes.js";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
// Create a module-specific logger
const marketDataLogger = logger.child({ module: "market-data-routes" });
// Schema for symbol request validation
const symbolSchema = z.object({
    symbol: z.string().min(1).max(10)
});
// Schema for RSI request validation
const rsiSchema = z.object({
    timePeriod: z.coerce.number().int().min(2).max(100).default(14)
});
// Create a Hono app for the market data routes
const app = new Hono();
/**
 * Get a stock quote
 * GET /api/market-data/quotes/:symbol
 */
app.get('/quotes/:symbol', zValidator('param', symbolSchema), async (c) => {
    try {
        const { symbol } = c.req.valid('param');
        marketDataLogger.info(`Getting quote for ${symbol}`);
        const data = await alphaVantageService.getStockQuote(symbol);
        if (!data) {
            return c.json({
                success: false,
                message: `No quote data found for symbol: ${symbol}`
            }, 404);
        }
        return c.json({
            success: true,
            symbol,
            data
        });
    }
    catch (error) {
        marketDataLogger.error(`Error getting quote for ${c.req.param('symbol')}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get stock quote',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get daily price data
 * GET /api/market-data/prices/:symbol
 */
app.get('/prices/:symbol', zValidator('param', symbolSchema), async (c) => {
    try {
        const { symbol } = c.req.valid('param');
        const outputSize = c.req.query('full') ? 'full' : 'compact';
        marketDataLogger.info(`Getting daily prices for ${symbol}`);
        const data = await alphaVantageService.getDailyPrices(symbol, outputSize);
        if (!data) {
            return c.json({
                success: false,
                message: `No price data found for symbol: ${symbol}`
            }, 404);
        }
        return c.json({
            success: true,
            symbol,
            outputSize,
            data
        });
    }
    catch (error) {
        marketDataLogger.error(`Error getting daily prices for ${c.req.param('symbol')}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get daily prices',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get company overview data
 * GET /api/market-data/company/:symbol
 */
app.get('/company/:symbol', zValidator('param', symbolSchema), async (c) => {
    try {
        const { symbol } = c.req.valid('param');
        marketDataLogger.info(`Getting company overview for ${symbol}`);
        const data = await alphaVantageService.getCompanyOverview(symbol);
        if (!data) {
            return c.json({
                success: false,
                message: `No company data found for symbol: ${symbol}`
            }, 404);
        }
        return c.json({
            success: true,
            symbol,
            data
        });
    }
    catch (error) {
        marketDataLogger.error(`Error getting company overview for ${c.req.param('symbol')}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get company overview',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get balance sheet data
 * GET /api/market-data/financials/balance-sheet/:symbol
 */
app.get('/financials/balance-sheet/:symbol', zValidator('param', symbolSchema), async (c) => {
    try {
        const { symbol } = c.req.valid('param');
        marketDataLogger.info(`Getting balance sheet for ${symbol}`);
        const data = await alphaVantageService.getBalanceSheet(symbol);
        if (!data) {
            return c.json({
                success: false,
                message: `No balance sheet data found for symbol: ${symbol}`
            }, 404);
        }
        return c.json({
            success: true,
            symbol,
            data
        });
    }
    catch (error) {
        marketDataLogger.error(`Error getting balance sheet for ${c.req.param('symbol')}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get balance sheet',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get income statement data
 * GET /api/market-data/financials/income-statement/:symbol
 */
app.get('/financials/income-statement/:symbol', zValidator('param', symbolSchema), async (c) => {
    try {
        const { symbol } = c.req.valid('param');
        marketDataLogger.info(`Getting income statement for ${symbol}`);
        const data = await alphaVantageService.getIncomeStatement(symbol);
        if (!data) {
            return c.json({
                success: false,
                message: `No income statement data found for symbol: ${symbol}`
            }, 404);
        }
        return c.json({
            success: true,
            symbol,
            data
        });
    }
    catch (error) {
        marketDataLogger.error(`Error getting income statement for ${c.req.param('symbol')}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get income statement',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get RSI data
 * GET /api/market-data/technical/rsi/:symbol
 * Query params: timePeriod (default: 14)
 */
app.get('/technical/rsi/:symbol', zValidator('param', symbolSchema), zValidator('query', rsiSchema), async (c) => {
    try {
        const { symbol } = c.req.valid('param');
        const { timePeriod } = c.req.valid('query');
        marketDataLogger.info(`Getting RSI for ${symbol} with time period ${timePeriod}`);
        const data = await alphaVantageService.getRSI(symbol, 'daily', timePeriod);
        if (!data) {
            return c.json({
                success: false,
                message: `No RSI data found for symbol: ${symbol}`
            }, 404);
        }
        return c.json({
            success: true,
            symbol,
            timePeriod,
            data
        });
    }
    catch (error) {
        marketDataLogger.error(`Error getting RSI for ${c.req.param('symbol')}`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get RSI data',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
// Include the collection routes
app.route('/collection', collectionRoutes);
// Include the watchlist routes
app.route('/watchlist', watchlistRoutes);
// Include the unusual whales routes
app.route('/unusual-whales', unusualWhalesRoutes);
// Include the stocks routes
app.route('/stocks', stocksRoutes);
// Export the market data routes
export const marketDataRoutes = app;
//# sourceMappingURL=market-data.routes.js.map
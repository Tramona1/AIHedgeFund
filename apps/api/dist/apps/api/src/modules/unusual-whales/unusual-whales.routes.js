import { Hono } from "hono";
import { logger } from "@repo/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { unusualWhalesService } from "./unusual-whales.service.js";
import { unusualWhalesCollectionService } from "./unusual-whales-collection.service.js";
// Create a module-specific logger
const whalesLogger = logger.child({ module: "unusual-whales-routes" });
// Create a Hono app for the unusual whales routes
const app = new Hono();
// Schema for pagination and filtering
const optionsFlowQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    minVolume: z.coerce.number().int().optional(),
    ticker: z.string().optional(),
    sentiment: z.enum(["bullish", "bearish", "neutral"]).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional()
});
const darkPoolQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    minVolume: z.coerce.number().int().optional(),
    ticker: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional()
});
/**
 * Get options flow data with pagination and filtering
 * GET /api/market-data/unusual-whales/options-flow
 */
app.get('/options-flow', zValidator('query', optionsFlowQuerySchema), async (c) => {
    try {
        const query = c.req.valid('query');
        whalesLogger.info(`Getting options flow data`, { query });
        const { data, totalCount, page, pageSize } = await unusualWhalesCollectionService.getOptionsFlow(query.page, query.pageSize, {
            minVolume: query.minVolume,
            ticker: query.ticker,
            sentiment: query.sentiment,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo
        });
        return c.json({
            success: true,
            data,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            }
        });
    }
    catch (error) {
        whalesLogger.error(`Error getting options flow data`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get options flow data',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get dark pool data with pagination and filtering
 * GET /api/market-data/unusual-whales/dark-pool
 */
app.get('/dark-pool', zValidator('query', darkPoolQuerySchema), async (c) => {
    try {
        const query = c.req.valid('query');
        whalesLogger.info(`Getting dark pool data`, { query });
        const { data, totalCount, page, pageSize } = await unusualWhalesCollectionService.getDarkPoolData(query.page, query.pageSize, {
            minVolume: query.minVolume,
            ticker: query.ticker,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo
        });
        return c.json({
            success: true,
            data,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            }
        });
    }
    catch (error) {
        whalesLogger.error(`Error getting dark pool data`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get dark pool data',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get latest options flow data
 * GET /api/market-data/unusual-whales/options-flow/latest
 */
app.get('/options-flow/latest', async (c) => {
    try {
        whalesLogger.info(`Getting latest options flow data`);
        const data = await unusualWhalesService.getLatestOptionsFlow();
        return c.json({
            success: true,
            data
        });
    }
    catch (error) {
        whalesLogger.error(`Error getting latest options flow data`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get latest options flow data',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Get latest dark pool data
 * GET /api/market-data/unusual-whales/dark-pool/latest
 */
app.get('/dark-pool/latest', async (c) => {
    try {
        whalesLogger.info(`Getting latest dark pool data`);
        const data = await unusualWhalesService.getLatestDarkPoolData();
        return c.json({
            success: true,
            data
        });
    }
    catch (error) {
        whalesLogger.error(`Error getting latest dark pool data`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to get latest dark pool data',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
// Export the unusual whales routes
export const unusualWhalesRoutes = app;
//# sourceMappingURL=unusual-whales.routes.js.map
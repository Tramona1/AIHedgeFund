import { Hono } from 'hono';
import { logger } from '@repo/logger';
import { collectionScheduler } from './collection-scheduler.js';
import { dataCollectionService } from './data-collection.service.js';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
// Create a module-specific logger
const collectionLogger = logger.child({ module: 'collection-routes' });
// Create a Hono app for the collection routes
const app = new Hono();
// Schema for symbol request validation
const symbolSchema = z.object({
    symbol: z.string().min(1).max(10)
});
/**
 * Start the data collection scheduler
 * POST /api/market-data/collection/start
 */
app.post('/start', async (c) => {
    try {
        collectionLogger.info('Starting data collection scheduler');
        const result = collectionScheduler.startScheduler();
        return c.json({
            success: true,
            message: 'Market data collection scheduler started',
            ...result
        });
    }
    catch (error) {
        collectionLogger.error('Error starting data collection scheduler', {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to start market data collection scheduler',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Stop the data collection scheduler
 * POST /api/market-data/collection/stop
 */
app.post('/stop', async (c) => {
    try {
        collectionLogger.info('Stopping data collection scheduler');
        const result = collectionScheduler.stopScheduler();
        return c.json({
            success: true,
            message: 'Market data collection scheduler stopped',
            ...result
        });
    }
    catch (error) {
        collectionLogger.error('Error stopping data collection scheduler', {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to stop market data collection scheduler',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Trigger a manual data collection for all watchlist symbols
 * POST /api/market-data/collection/run
 */
app.post('/run', async (c) => {
    try {
        collectionLogger.info('Triggering manual data collection for watchlist');
        const results = await collectionScheduler.forceCollectWatchlistData();
        return c.json({
            success: true,
            message: 'Manual data collection completed',
            results
        });
    }
    catch (error) {
        collectionLogger.error('Error running manual data collection', {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to run manual data collection',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * Collect data for a specific symbol
 * POST /api/market-data/collection/symbol
 * Body: { symbol: string }
 */
app.post('/symbol', zValidator('json', symbolSchema), async (c) => {
    try {
        const { symbol } = await c.req.valid('json');
        collectionLogger.info(`Collecting data for symbol: ${symbol}`);
        // Collect data for the specified symbol
        const results = await dataCollectionService.collectAllDataForSymbol(symbol);
        return c.json({
            success: true,
            message: `Data collection for ${symbol} completed`,
            symbol,
            results
        });
    }
    catch (error) {
        collectionLogger.error('Error collecting data for symbol', {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            message: 'Failed to collect data for symbol',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
// Export the collection routes
export const collectionRoutes = app;
//# sourceMappingURL=collection-routes.js.map
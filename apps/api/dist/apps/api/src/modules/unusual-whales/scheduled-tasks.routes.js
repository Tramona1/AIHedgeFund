import { Hono } from 'hono';
import { unusualWhalesScheduler } from './collection-scheduler.js';
import { runUnusualWhalesScheduledTasks } from './scheduled-tasks.js';
import { logger } from '@repo/logger';
// Create a module-specific logger
const routesLogger = logger.child({ module: 'unusual-whales-scheduled-tasks-routes' });
// Create a router
const app = new Hono();
/**
 * POST /api/unusual-whales/tasks/run-all
 * Manually trigger all scheduled tasks for Unusual Whales data
 */
app.post('/run-all', async (c) => {
    try {
        routesLogger.info('Manual trigger of all Unusual Whales scheduled tasks');
        const results = await runUnusualWhalesScheduledTasks();
        return c.json({
            success: true,
            results
        });
    }
    catch (error) {
        routesLogger.error('Error running all Unusual Whales scheduled tasks', {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * POST /api/unusual-whales/tasks/collect-data
 * Manually trigger collection of Unusual Whales data
 */
app.post('/collect-data', async (c) => {
    try {
        routesLogger.info('Manual trigger of Unusual Whales data collection');
        const results = await unusualWhalesScheduler.forceCollectUnusualWhalesData();
        return c.json({
            success: true,
            results
        });
    }
    catch (error) {
        routesLogger.error('Error collecting Unusual Whales data', {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
/**
 * GET /api/unusual-whales/tasks/status
 * Get the status of the Unusual Whales scheduler
 */
app.get('/status', async (c) => {
    try {
        // Get scheduler status
        const status = unusualWhalesScheduler.getStatus();
        return c.json({
            success: true,
            status
        });
    }
    catch (error) {
        routesLogger.error('Error getting Unusual Whales scheduler status', {
            error: error instanceof Error ? error.message : String(error)
        });
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
export const unusualWhalesScheduledTasksRoutes = app;
//# sourceMappingURL=scheduled-tasks.routes.js.map
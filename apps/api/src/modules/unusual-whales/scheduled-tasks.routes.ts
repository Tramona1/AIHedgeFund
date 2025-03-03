import express, { Request, Response } from 'express';
import { z } from 'zod';
import { unusualWhalesScheduler } from './collection-scheduler.js';
import { runUnusualWhalesScheduledTasks } from './scheduled-tasks.js';
import { logger } from '@repo/logger';

// Create a module-specific logger
const routesLogger = logger.child({ module: 'unusual-whales-scheduled-tasks-routes' });

// Create a router
const router = express.Router();

/**
 * POST /api/unusual-whales/tasks/run-all
 * Manually trigger all scheduled tasks for Unusual Whales data
 */
router.post('/run-all', async (req: Request, res: Response) => {
  try {
    routesLogger.info('Manual trigger of all Unusual Whales scheduled tasks');
    
    const results = await runUnusualWhalesScheduledTasks();
    
    return res.json({
      success: true,
      results
    });
  } catch (error) {
    routesLogger.error('Error running all Unusual Whales scheduled tasks', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/unusual-whales/tasks/collect-data
 * Manually trigger collection of Unusual Whales data
 */
router.post('/collect-data', async (req: Request, res: Response) => {
  try {
    routesLogger.info('Manual trigger of Unusual Whales data collection');
    
    const results = await unusualWhalesScheduler.forceCollectUnusualWhalesData();
    
    return res.json({
      success: true,
      results
    });
  } catch (error) {
    routesLogger.error('Error collecting Unusual Whales data', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/unusual-whales/tasks/status
 * Get the status of the Unusual Whales scheduler
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Get scheduler status
    const status = unusualWhalesScheduler.getStatus();
    
    return res.json({
      success: true,
      status
    });
  } catch (error) {
    routesLogger.error('Error getting Unusual Whales scheduler status', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export const unusualWhalesScheduledTasksRoutes = router; 
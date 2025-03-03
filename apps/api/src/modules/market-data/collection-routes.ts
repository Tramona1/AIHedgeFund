import express from 'express';
import { logger } from '@repo/logger';
import { collectionScheduler } from './collection-scheduler.js';
import { dataCollectionService } from './data-collection.service.js';
import { z } from 'zod';

// Create a module-specific logger
const collectionLogger = logger.child({ module: 'collection-routes' });

// Create an Express router for the collection routes
const router = express.Router();

// Schema for symbol request validation
const symbolSchema = z.object({
  symbol: z.string().min(1).max(10)
});

// Middleware for validating symbol in request body
const validateSymbolBody = (req, res, next) => {
  try {
    const result = symbolSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid symbol in request body',
        errors: result.error.errors
      });
    }
    req.validatedBody = result.data;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error validating request body',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Start the data collection scheduler
 * POST /api/market-data/collection/start
 */
router.post('/start', async (req, res) => {
  try {
    collectionLogger.info('Starting data collection scheduler');
    const result = collectionScheduler.startScheduler();
    
    return res.json({
      success: true,
      message: 'Market data collection scheduler started',
      ...result
    });
  } catch (error) {
    collectionLogger.error('Error starting data collection scheduler', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to start market data collection scheduler',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Stop the data collection scheduler
 * POST /api/market-data/collection/stop
 */
router.post('/stop', async (req, res) => {
  try {
    collectionLogger.info('Stopping data collection scheduler');
    const result = collectionScheduler.stopScheduler();
    
    return res.json({
      success: true,
      message: 'Market data collection scheduler stopped',
      ...result
    });
  } catch (error) {
    collectionLogger.error('Error stopping data collection scheduler', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to stop market data collection scheduler',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Trigger a manual data collection for all watchlist symbols
 * POST /api/market-data/collection/run
 */
router.post('/run', async (req, res) => {
  try {
    collectionLogger.info('Triggering manual data collection for watchlist');
    const results = await collectionScheduler.forceCollectWatchlistData();
    
    return res.json({
      success: true,
      message: 'Manual data collection completed',
      results
    });
  } catch (error) {
    collectionLogger.error('Error running manual data collection', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to run manual data collection',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Collect data for a specific symbol
 * POST /api/market-data/collection/symbol
 * Body: { symbol: string }
 */
router.post('/symbol', validateSymbolBody, async (req, res) => {
  try {
    const { symbol } = req.validatedBody;
    collectionLogger.info(`Collecting data for symbol: ${symbol}`);
    
    // Collect data for the specified symbol
    const results = await dataCollectionService.collectAllDataForSymbol(symbol);
    
    return res.json({
      success: true,
      message: `Data collection for ${symbol} completed`,
      symbol,
      results
    });
  } catch (error) {
    collectionLogger.error('Error collecting data for symbol', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to collect data for symbol',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export the collection routes
export const collectionRoutes = router; 
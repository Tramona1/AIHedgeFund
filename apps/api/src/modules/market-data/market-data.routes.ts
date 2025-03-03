import express from "express";
import { logger } from "@repo/logger";
import { alphaVantageService } from "./alpha-vantage.service.js";
import { collectionRoutes } from "./collection-routes.js";
import { watchlistRoutes } from "./watchlist.routes.js";
import { unusualWhalesRoutes } from "../unusual-whales/unusual-whales.routes.js";
import { stocksRoutes } from "./stocks.routes.js";
import { z } from "zod";
import { Request, Response } from "express";

// Create a module-specific logger
const marketDataLogger = logger.child({ module: "market-data-routes" });

// Create a router for the market data routes
const router = express.Router();

// Schema for symbol request validation
const symbolSchema = z.object({
  symbol: z.string().min(1).max(10)
});

// Schema for RSI request validation
const rsiSchema = z.object({
  timePeriod: z.coerce.number().int().min(2).max(100).default(14)
});

// Middleware for validating symbol parameter
const validateSymbol = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const result = symbolSchema.safeParse({ symbol: req.params.symbol });
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid symbol parameter',
        errors: result.error.errors
      });
    }
    req.params.validSymbol = result.data.symbol;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error validating symbol parameter',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Middleware for validating RSI parameters
const validateRSI = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const result = rsiSchema.safeParse({ 
      timePeriod: req.query.timePeriod || 14
    });
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid RSI parameters',
        errors: result.error.errors
      });
    }
    req.query.validTimePeriod = result.data.timePeriod;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error validating RSI parameters',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get a stock quote
 * GET /api/market-data/quotes/:symbol
 */
router.get('/quotes/:symbol', validateSymbol, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    marketDataLogger.info(`Getting quote for ${symbol}`);
    
    const data = await alphaVantageService.getStockQuote(symbol);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: `No quote data found for symbol: ${symbol}` 
      });
    }
    
    return res.json({ 
      success: true, 
      symbol, 
      data 
    });
  } catch (error) {
    marketDataLogger.error(`Error getting quote for ${req.params.symbol}`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get stock quote',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get daily price data
 * GET /api/market-data/prices/:symbol
 */
router.get('/prices/:symbol', validateSymbol, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const outputSize = req.query.full ? 'full' : 'compact';
    
    marketDataLogger.info(`Getting daily prices for ${symbol}`);
    
    const data = await alphaVantageService.getDailyPrices(symbol, outputSize);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: `No price data found for symbol: ${symbol}` 
      });
    }
    
    return res.json({ 
      success: true, 
      symbol, 
      outputSize,
      data 
    });
  } catch (error) {
    marketDataLogger.error(`Error getting daily prices for ${req.params.symbol}`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get daily prices',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get company overview data
 * GET /api/market-data/company/:symbol
 */
router.get('/company/:symbol', validateSymbol, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    marketDataLogger.info(`Getting company overview for ${symbol}`);
    
    const data = await alphaVantageService.getCompanyOverview(symbol);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: `No company data found for symbol: ${symbol}` 
      });
    }
    
    return res.json({ 
      success: true, 
      symbol, 
      data 
    });
  } catch (error) {
    marketDataLogger.error(`Error getting company overview for ${req.params.symbol}`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get company overview',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get balance sheet data
 * GET /api/market-data/financials/balance-sheet/:symbol
 */
router.get('/financials/balance-sheet/:symbol', validateSymbol, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    marketDataLogger.info(`Getting balance sheet for ${symbol}`);
    
    const data = await alphaVantageService.getBalanceSheet(symbol);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: `No balance sheet data found for symbol: ${symbol}` 
      });
    }
    
    return res.json({ 
      success: true, 
      symbol, 
      data 
    });
  } catch (error) {
    marketDataLogger.error(`Error getting balance sheet for ${req.params.symbol}`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get balance sheet',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get income statement data
 * GET /api/market-data/financials/income-statement/:symbol
 */
router.get('/financials/income-statement/:symbol', validateSymbol, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    marketDataLogger.info(`Getting income statement for ${symbol}`);
    
    const data = await alphaVantageService.getIncomeStatement(symbol);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: `No income statement data found for symbol: ${symbol}` 
      });
    }
    
    return res.json({ 
      success: true, 
      symbol, 
      data 
    });
  } catch (error) {
    marketDataLogger.error(`Error getting income statement for ${req.params.symbol}`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get income statement',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get RSI data
 * GET /api/market-data/technical/rsi/:symbol
 * Query params: timePeriod (default: 14)
 */
router.get('/technical/rsi/:symbol', validateSymbol, validateRSI, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const timePeriod = Number(req.query.timePeriod || 14);
    
    marketDataLogger.info(`Getting RSI for ${symbol} with time period ${timePeriod}`);
    
    const data = await alphaVantageService.getRSI(symbol, 'daily', timePeriod);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: `No RSI data found for symbol: ${symbol}` 
      });
    }
    
    return res.json({ 
      success: true, 
      symbol, 
      timePeriod,
      data 
    });
  } catch (error) {
    marketDataLogger.error(`Error getting RSI for ${req.params.symbol}`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get RSI data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Mount child routes
router.use('/collections', collectionRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/unusual-whales', unusualWhalesRoutes);
router.use('/stocks', stocksRoutes);

// Export the market data routes
export const marketDataRoutes = router; 
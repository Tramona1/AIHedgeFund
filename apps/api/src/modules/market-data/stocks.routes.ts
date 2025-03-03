import express from "express";
import { logger } from "@repo/logger";
import { db } from "../../lib/db.js";
import { stockData } from "@repo/db/schema";
import { eq, inArray } from "drizzle-orm";

// Create a module-specific logger
const stocksLogger = logger.child({ module: "stocks-routes" });

// Create an Express router for the stocks routes
const router = express.Router();

/**
 * Get stock data for requested symbols
 * GET /api/market-data/stocks
 * Query params: symbols (comma-separated list)
 */
router.get('/', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols;
    let symbols: string[] = [];
    
    if (symbolsParam) {
      if (typeof symbolsParam === 'string') {
        symbols = symbolsParam.split(',').map(symbol => symbol.trim().toUpperCase());
      } else if (Array.isArray(symbolsParam)) {
        symbols = symbolsParam.map(symbol => symbol.toString().trim().toUpperCase());
      }
    }
    
    stocksLogger.info(`Getting stock data for ${symbols.length > 0 ? symbols.join(', ') : 'all stocks'}`);
    
    let stockResult;
    
    if (symbols.length > 0) {
      // Query specific symbols
      stockResult = await db.select()
        .from(stockData)
        .where(inArray(stockData.symbol, symbols));
    } else {
      // Get all stocks with a limit
      stockResult = await db.select()
        .from(stockData)
        .limit(100);
    }
    
    // If no results found in the database
    if (!stockResult || stockResult.length === 0) {
      stocksLogger.warn(`No stock data found for requested symbols`);
      
      return res.json({
        stocks: [],
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      stocks: stockResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    stocksLogger.error(`Error getting stock data`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get stock data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get stock data for a specific symbol
 * GET /api/market-data/stocks/:symbol
 */
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    stocksLogger.info(`Getting stock data for symbol: ${symbol}`);
    
    const stockResult = await db.select()
      .from(stockData)
      .where(eq(stockData.symbol, symbol))
      .limit(1);
    
    if (!stockResult || stockResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No stock data found for symbol: ${symbol}`
      });
    }
    
    return res.json({
      success: true,
      symbol,
      data: stockResult[0]
    });
  } catch (error) {
    stocksLogger.error(`Error getting stock data for ${req.params.symbol}`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get stock data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export the stocks routes
export const stocksRoutes = router; 
import express, { Request, Response } from "express";
import { logger } from "@repo/logger";
import { z } from "zod";
import { unusualWhalesService } from "./unusual-whales.service.js";
import { unusualWhalesCollectionService } from "./unusual-whales-collection.service.js";

// Extend the Express Request type to include validatedQuery
declare module "express-serve-static-core" {
  interface Request {
    validatedQuery: any;
  }
}

// Create a module-specific logger
const whalesLogger = logger.child({ module: "unusual-whales-routes" });

// Create Express router
const router = express.Router();

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

// Middleware for validating options flow query parameters
const validateOptionsFlowQuery = (req, res, next) => {
  try {
    const query = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 20,
      minVolume: req.query.minVolume ? parseInt(req.query.minVolume) : undefined,
      ticker: req.query.ticker,
      sentiment: req.query.sentiment,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    
    const result = optionsFlowQuerySchema.safeParse(query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.format()
      });
    }
    
    req.validatedQuery = result.data;
    next();
  } catch (error) {
    whalesLogger.error("Validation error", { error });
    return res.status(400).json({
      success: false,
      error: "Invalid query parameters"
    });
  }
};

// Middleware for validating dark pool query parameters
const validateDarkPoolQuery = (req, res, next) => {
  try {
    const query = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 20,
      minVolume: req.query.minVolume ? parseInt(req.query.minVolume) : undefined,
      ticker: req.query.ticker,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    
    const result = darkPoolQuerySchema.safeParse(query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.format()
      });
    }
    
    req.validatedQuery = result.data;
    next();
  } catch (error) {
    whalesLogger.error("Validation error", { error });
    return res.status(400).json({
      success: false,
      error: "Invalid query parameters"
    });
  }
};

/**
 * Get options flow data with pagination and filtering
 * GET /api/market-data/unusual-whales/options-flow
 */
router.get('/options-flow', validateOptionsFlowQuery, async (req, res) => {
  try {
    const query = req.validatedQuery;
    whalesLogger.info(`Getting options flow data`, { query });
    
    const { data, totalCount, page, pageSize } = await unusualWhalesCollectionService.getOptionsFlow(
      query.page,
      query.pageSize,
      {
        minVolume: query.minVolume,
        ticker: query.ticker,
        sentiment: query.sentiment,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo
      }
    );
    
    return res.json({ 
      success: true, 
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    whalesLogger.error(`Error getting options flow data`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get options flow data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get dark pool data with pagination and filtering
 * GET /api/market-data/unusual-whales/dark-pool
 */
router.get('/dark-pool', validateDarkPoolQuery, async (req, res) => {
  try {
    const query = req.validatedQuery;
    whalesLogger.info(`Getting dark pool data`, { query });
    
    const { data, totalCount, page, pageSize } = await unusualWhalesCollectionService.getDarkPoolData(
      query.page,
      query.pageSize,
      {
        minVolume: query.minVolume,
        ticker: query.ticker,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo
      }
    );
    
    return res.json({ 
      success: true, 
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    whalesLogger.error(`Error getting dark pool data`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get dark pool data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get latest options flow data
 * GET /api/market-data/unusual-whales/options-flow/latest
 */
router.get('/options-flow/latest', async (req, res) => {
  try {
    whalesLogger.info(`Getting latest options flow data`);
    
    const data = await unusualWhalesService.getLatestOptionsFlow();
    
    return res.json({ 
      success: true, 
      data
    });
  } catch (error) {
    whalesLogger.error(`Error getting latest options flow data`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get latest options flow data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get latest dark pool data
 * GET /api/market-data/unusual-whales/dark-pool/latest
 */
router.get('/dark-pool/latest', async (req, res) => {
  try {
    whalesLogger.info(`Getting latest dark pool data`);
    
    const data = await unusualWhalesService.getLatestDarkPoolData();
    
    return res.json({ 
      success: true, 
      data
    });
  } catch (error) {
    whalesLogger.error(`Error getting latest dark pool data`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get latest dark pool data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export the unusual whales routes
export const unusualWhalesRoutes = router; 
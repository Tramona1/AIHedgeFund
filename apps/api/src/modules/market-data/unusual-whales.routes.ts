/**
 * Unusual Whales API Routes
 * API endpoints for options flow and dark pool data
 */

import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "@repo/logger";
import { unusualWhalesService } from "./unusual-whales.service.js";
import { unusualWhalesCollectionService } from "./unusual-whales-collection.service.js";

// Create a module-specific logger
const routeLogger = logger.child({ module: "unusual-whales-routes" });

// Create an Express router for unusual whales routes
const router = express.Router();

// Validation schemas
const symbolQuerySchema = z.object({
  symbol: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

type SymbolQueryParams = z.infer<typeof symbolQuerySchema>;

// Validation middleware
const validateSymbolQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = symbolQuerySchema.parse({
      symbol: req.query.symbol as string | undefined,
      limit: req.query.limit
    });
    
    // Store validated data in request object for route handlers to use
    (req as any).validatedQuery = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: error.errors
      });
    }
    next(error);
  }
};

// Collect request validation schema
const collectRequestSchema = z.object({
  symbol: z.string().optional(),
  type: z.enum(["options-flow", "dark-pool", "all"]).default("all"),
});

type CollectRequestBody = z.infer<typeof collectRequestSchema>;

// Validation middleware for collect endpoint
const validateCollectRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = collectRequestSchema.parse(req.body);
    // Store validated data in request object for route handlers to use
    (req as any).validatedBody = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: error.errors
      });
    }
    next(error);
  }
};

/**
 * Get options flow data
 * GET /api/market-data/unusual-whales/options-flow
 */
router.get("/options-flow", validateSymbolQuery, async (req: Request, res: Response) => {
  try {
    const { symbol, limit } = (req as any).validatedQuery as SymbolQueryParams;
    
    routeLogger.info("Fetching options flow data", { symbol, limit });
    
    const data = await unusualWhalesService.getOptionsFlow(symbol, limit);
    
    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    routeLogger.error("Error fetching options flow data", {
      error: error.message,
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch options flow data",
    });
  }
});

/**
 * Get dark pool data
 * GET /api/market-data/unusual-whales/dark-pool
 */
router.get("/dark-pool", validateSymbolQuery, async (req: Request, res: Response) => {
  try {
    const { symbol, limit } = (req as any).validatedQuery as SymbolQueryParams;
    
    routeLogger.info("Fetching dark pool data", { symbol, limit });
    
    const data = await unusualWhalesService.getDarkPoolData(symbol, limit);
    
    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    routeLogger.error("Error fetching dark pool data", {
      error: error.message,
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch dark pool data",
    });
  }
});

/**
 * Get market sentiment data
 * GET /api/market-data/unusual-whales/market-sentiment
 */
router.get("/market-sentiment", async (req: Request, res: Response) => {
  try {
    routeLogger.info("Fetching market sentiment data");
    
    const data = await unusualWhalesService.getMarketSentiment();
    
    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    routeLogger.error("Error fetching market sentiment data", {
      error: error.message,
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch market sentiment data",
    });
  }
});

/**
 * Start data collection for options flow and dark pool data
 * POST /api/market-data/unusual-whales/collect
 */
router.post("/collect", validateCollectRequest, async (req: Request, res: Response) => {
  try {
    const { symbol, type } = (req as any).validatedBody as CollectRequestBody;
    
    routeLogger.info("Starting data collection", { symbol, type });
    
    let results: any = {};
    
    if (type === "options-flow" || type === "all") {
      results.optionsFlow = await unusualWhalesCollectionService.collectOptionsFlow(symbol);
    }
    
    if (type === "dark-pool" || type === "all") {
      results.darkPool = await unusualWhalesCollectionService.collectDarkPoolData(symbol);
    }
    
    return res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    routeLogger.error("Error collecting data", {
      error: error.message,
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to collect data",
    });
  }
});

/**
 * Check API status
 * GET /api/market-data/unusual-whales/status
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    routeLogger.info("Checking API status");
    
    const status = await unusualWhalesService.checkApiStatus();
    
    return res.json({
      success: true,
      status,
    });
  } catch (error: any) {
    routeLogger.error("Error checking API status", {
      error: error.message,
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to check API status",
    });
  }
});

export const unusualWhalesRoutes = router; 
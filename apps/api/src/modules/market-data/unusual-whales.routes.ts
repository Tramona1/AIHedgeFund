/**
 * Unusual Whales API Routes
 * API endpoints for options flow and dark pool data
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { logger } from "@repo/logger";
import { unusualWhalesService } from "./unusual-whales.service.js";
import { unusualWhalesCollectionService } from "./unusual-whales-collection.service.js";

// Create a module-specific logger
const routeLogger = logger.child({ module: "unusual-whales-routes" });

// Create a Hono router for unusual whales routes
export const unusualWhalesRoutes = new Hono();

// Validation schemas
const symbolQuerySchema = z.object({
  symbol: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

/**
 * Get options flow data
 * GET /api/market-data/unusual-whales/options-flow
 */
unusualWhalesRoutes.get(
  "/options-flow",
  zValidator("query", symbolQuerySchema),
  async (c) => {
    try {
      const { symbol, limit } = c.req.valid("query");
      
      routeLogger.info("Fetching options flow data", { symbol, limit });
      
      const data = await unusualWhalesService.getOptionsFlow(symbol, limit);
      
      return c.json({
        success: true,
        data,
      });
    } catch (error: any) {
      routeLogger.error("Error fetching options flow data", {
        error: error.message,
      });
      
      return c.json({
        success: false,
        error: error.message || "Failed to fetch options flow data",
      }, 500);
    }
  }
);

/**
 * Get dark pool data
 * GET /api/market-data/unusual-whales/dark-pool
 */
unusualWhalesRoutes.get(
  "/dark-pool",
  zValidator("query", symbolQuerySchema),
  async (c) => {
    try {
      const { symbol, limit } = c.req.valid("query");
      
      routeLogger.info("Fetching dark pool data", { symbol, limit });
      
      const data = await unusualWhalesService.getDarkPoolData(symbol, limit);
      
      return c.json({
        success: true,
        data,
      });
    } catch (error: any) {
      routeLogger.error("Error fetching dark pool data", {
        error: error.message,
      });
      
      return c.json({
        success: false,
        error: error.message || "Failed to fetch dark pool data",
      }, 500);
    }
  }
);

/**
 * Get market sentiment data
 * GET /api/market-data/unusual-whales/market-sentiment
 */
unusualWhalesRoutes.get(
  "/market-sentiment",
  async (c) => {
    try {
      routeLogger.info("Fetching market sentiment data");
      
      const data = await unusualWhalesService.getMarketSentiment();
      
      return c.json({
        success: true,
        data,
      });
    } catch (error: any) {
      routeLogger.error("Error fetching market sentiment data", {
        error: error.message,
      });
      
      return c.json({
        success: false,
        error: error.message || "Failed to fetch market sentiment data",
      }, 500);
    }
  }
);

/**
 * Start data collection for options flow and dark pool data
 * POST /api/market-data/unusual-whales/collect
 */
unusualWhalesRoutes.post(
  "/collect",
  zValidator("json", z.object({
    symbol: z.string().optional(),
    type: z.enum(["options-flow", "dark-pool", "all"]).default("all"),
  })),
  async (c) => {
    try {
      const { symbol, type } = c.req.valid("json");
      
      routeLogger.info("Starting data collection", { symbol, type });
      
      let results: any = {};
      
      if (type === "options-flow" || type === "all") {
        results.optionsFlow = await unusualWhalesCollectionService.collectOptionsFlow(symbol);
      }
      
      if (type === "dark-pool" || type === "all") {
        results.darkPool = await unusualWhalesCollectionService.collectDarkPoolData(symbol);
      }
      
      return c.json({
        success: true,
        results,
      });
    } catch (error: any) {
      routeLogger.error("Error collecting data", {
        error: error.message,
      });
      
      return c.json({
        success: false,
        error: error.message || "Failed to collect data",
      }, 500);
    }
  }
);

/**
 * Check API status
 * GET /api/market-data/unusual-whales/status
 */
unusualWhalesRoutes.get(
  "/status",
  async (c) => {
    try {
      routeLogger.info("Checking API status");
      
      const status = await unusualWhalesService.checkApiStatus();
      
      return c.json({
        success: true,
        status,
      });
    } catch (error: any) {
      routeLogger.error("Error checking API status", {
        error: error.message,
      });
      
      return c.json({
        success: false,
        error: error.message || "Failed to check API status",
      }, 500);
    }
  }
); 
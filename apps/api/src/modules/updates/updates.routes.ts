import express, { Request, Response } from "express";
import { updatesService } from "./updates.service.js";
import { logger } from "@repo/logger";
import { z } from "zod";

// Create a component-specific logger
const routeLogger = logger.child({ component: "updates-routes" });

// Define validation schema for stock updates
const stockUpdateSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  eventType: z.enum([
    "hedge_fund_buy",
    "hedge_fund_sell",
    "investor_mention",
    "market_shift",
    "technical_signal",
    "option_flow",
    "dark_pool_buy"
  ]),
  title: z.string().min(5, "Title is required"),
  content: z.string().min(10, "Content is required"),
  details: z.any().optional(),
  source: z.string().default("system"),
});

// Extend the Express Request type to include validatedQuery
declare module "express-serve-static-core" {
  interface Request {
    validatedData: any;
  }
}

type StockUpdateData = z.infer<typeof stockUpdateSchema>;

// Create the router
const router = express.Router();

// Middleware for validating stock update data
const validateStockUpdate = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const result = stockUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.format()
      });
    }
    req.validatedData = result.data;
    next();
  } catch (error: any) {
    routeLogger.error("Validation error", { error });
    return res.status(400).json({
      success: false,
      error: error.message || "Invalid request data"
    });
  }
};

/**
 * GET /api/updates
 * Get all stock updates
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get all updates from database
    const updates = await updatesService.getAllStockUpdates();
    
    return res.json({
      success: true,
      updates
    });
  } catch (error: any) {
    routeLogger.error("Error getting all stock updates", {
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get stock updates"
    });
  }
});

/**
 * GET /api/updates/:ticker
 * Get stock updates for a specific ticker
 */
router.get("/:ticker", async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    
    // Get updates for this ticker
    const updates = await updatesService.getStockUpdatesByTicker(ticker);
    
    return res.json({
      success: true,
      ticker,
      updates
    });
  } catch (error: any) {
    routeLogger.error(`Error getting stock updates for ticker: ${req.params.ticker}`, {
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || `Failed to get updates for ${req.params.ticker}`
    });
  }
});

/**
 * POST /api/updates
 * Create a new stock update
 */
router.post("/", validateStockUpdate, async (req: Request, res: Response) => {
  try {
    const updateData: StockUpdateData = req.validatedData;
    
    // Log the update creation
    routeLogger.info(`Creating stock update for ${updateData.ticker}`, {
      ticker: updateData.ticker,
      eventType: updateData.eventType
    });
    
    // Create the update - ensuring all required fields are passed correctly
    const id = await updatesService.createStockUpdate({
      ticker: updateData.ticker,
      eventType: updateData.eventType,
      title: updateData.title,
      content: updateData.content,
      details: updateData.details,
      source: updateData.source,
      symbol: updateData.ticker // Include symbol for compatibility
    });
    
    return res.status(201).json({
      success: true,
      message: `Stock update created for ${updateData.ticker}`,
      id
    });
  } catch (error: any) {
    routeLogger.error("Error creating stock update", {
      error: error.message,
      data: req.body
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create stock update"
    });
  }
});

export const updatesRoutes = router; 
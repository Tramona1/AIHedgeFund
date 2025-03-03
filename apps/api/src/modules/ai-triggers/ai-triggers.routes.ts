/**
 * AI Triggers Routes
 * Converted to Express from Hono implementation
 */
import express, { Request, Response } from "express";
import { aiTriggersService } from "./ai-triggers.service.js";
import { logger } from "@repo/logger";
import { z } from "zod";

// Create component logger
const routeLogger = logger.child({ component: "ai-triggers-routes" });

// Create validation schema
const triggerSchema = z.object({
  ticker: z.string(),
  event_type: z.string(),
  details: z.record(z.any()).optional()
});

// Type for validated data
type TriggerData = z.infer<typeof triggerSchema>;

// Create an Express router
const router = express.Router();

// Middleware for validating trigger data
const validateTriggerData = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const validation = triggerSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: validation.error.format(),
        code: 400
      });
    }
    
    // Store validated data for the route handler
    req.body = validation.data;
    next();
  } catch (error) {
    routeLogger.error("Error validating trigger data", { error });
    return res.status(400).json({
      status: "error",
      message: "Invalid request data",
      code: 400
    });
  }
};

// Register a new AI trigger
router.post("/", validateTriggerData, async (req: Request, res: Response) => {
  try {
    const data = req.body as { ticker: string; event_type: string; details?: any };
    
    routeLogger.info("Registering AI trigger", { 
      ticker: data.ticker, 
      eventType: data.event_type 
    });
    
    // Ensure required fields exist
    if (!data.ticker || !data.event_type) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: ticker and event_type",
        code: 400
      });
    }
    
    // Process the trigger with the service
    const result = await aiTriggersService.registerTrigger(data);
    
    return res.json({
      status: "success",
      message: "AI trigger processed successfully",
      data: result
    });
  } catch (error) {
    routeLogger.error("Error processing AI trigger", { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      code: 500
    });
  }
});

// Get all active triggers
router.get("/", async (req: Request, res: Response) => {
  try {
    routeLogger.info("Fetching all AI triggers");
    
    const triggers = await aiTriggersService.getAllTriggers();
    
    return res.json({
      status: "success",
      data: triggers
    });
  } catch (error) {
    routeLogger.error("Error fetching AI triggers", { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      code: 500
    });
  }
});

// Get triggers for a specific ticker
router.get("/:ticker", async (req: Request, res: Response) => {
  try {
    const ticker = req.params.ticker;
    routeLogger.info("Fetching AI triggers for ticker", { ticker });
    
    const triggers = await aiTriggersService.getRecentTriggers(ticker);
    
    return res.json({
      status: "success",
      data: triggers
    });
  } catch (error) {
    routeLogger.error("Error fetching AI triggers for ticker", { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ticker: req.params.ticker
    });
    
    return res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      code: 500
    });
  }
});

export const aiTriggersRoutes = router; 
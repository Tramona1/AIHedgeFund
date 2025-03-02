/**
 * AI Triggers Routes
 * Simplified implementation to resolve TypeScript errors
 */
import { Hono } from "hono";
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

// Create a hono router
export const aiTriggersRoutes = new Hono()
  // Register a new AI trigger
  .post("/", async (c) => {
    try {
      // Manual validation as a workaround
      const body = await c.req.json();
      const validation = triggerSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Validation failed",
          errors: validation.error.format(),
          code: 400
        }, 400);
      }
      
      const data = validation.data;
      
      routeLogger.info("Registering AI trigger", { 
        ticker: data.ticker, 
        eventType: data.event_type 
      });
      
      const result = await aiTriggersService.registerTrigger(data);
      
      return c.json({ status: "success", data: result });
    } catch (error: any) {
      routeLogger.error("Error registering AI trigger", { 
        error: error.message,
        stack: error.stack
      });
      
      return c.json(
        { 
          status: "error", 
          message: error.message || "Unknown error", 
          code: 500 
        }, 
        500
      );
    }
  })
  
  // Get recent triggers for a ticker
  .get("/:ticker", async (c) => {
    try {
      const ticker = c.req.param("ticker");
      
      routeLogger.info("Getting recent triggers", { ticker });
      
      const triggers = await aiTriggersService.getRecentTriggers(ticker);
      
      return c.json({ triggers });
    } catch (error: any) {
      routeLogger.error("Error getting triggers", { 
        error: error.message, 
        stack: error.stack,
        ticker: c.req.param("ticker") 
      });
      
      return c.json(
        { 
          status: "error", 
          message: error.message || "Unknown error", 
          code: 500 
        }, 
        500
      );
    }
  })
  
  // Get all triggers
  .get("/", async (c) => {
    try {
      routeLogger.info("Getting all triggers");
      
      const triggers = await aiTriggersService.getAllTriggers();
      
      return c.json({ triggers });
    } catch (error: any) {
      routeLogger.error("Error getting all triggers", { 
        error: error.message, 
        stack: error.stack 
      });
      
      return c.json(
        { 
          status: "error", 
          message: error.message || "Unknown error", 
          code: 500 
        }, 
        500
      );
    }
  }); 
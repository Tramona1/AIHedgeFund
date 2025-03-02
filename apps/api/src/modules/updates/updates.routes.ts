import { Hono } from "hono";
import { updatesService } from "./updates.service.js";
import { logger } from "@repo/logger";
import { z } from "zod";

// Create a component-specific logger
const routeLogger = logger.child({ component: "updates-routes" });

// Define validation schema for stock updates
const stockUpdateSchema = z.object({
  ticker: z.string(),
  eventType: z.enum([
    "hedge_fund_buy",
    "hedge_fund_sell",
    "investor_mention",
    "market_shift",
    "technical_signal",
    "option_flow",
    "dark_pool_buy"
  ]),
  title: z.string(),
  content: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  source: z.string().optional(),
});

// Type for validated data
type StockUpdateData = z.infer<typeof stockUpdateSchema>;

// Create a router for stock updates
export const updatesRoutes = new Hono()
  // POST /api/updates - Create a new stock update
  .post("/", async (c) => {
    try {
      // Manual validation as a workaround
      const body = await c.req.json();
      const validation = stockUpdateSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Validation failed",
          errors: validation.error.format(),
          code: 400
        }, 400);
      }
      
      const data = validation.data;
      
      routeLogger.info("Received stock update creation request", { 
        ticker: data.ticker, 
        eventType: data.eventType 
      });
      
      const id = await updatesService.createStockUpdate(data);
      
      return c.json({ status: "success", message: "Stock update created successfully", id });
    } catch (error) {
      routeLogger.error("Error creating stock update", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return c.json(
        { 
          status: "error", 
          message: error instanceof Error ? error.message : "Unknown error",
          code: 500 
        }, 
        500
      );
    }
  })
  
  // GET /api/updates/ticker/:ticker - Get stock updates by ticker
  .get("/ticker/:ticker", async (c) => {
    try {
      const ticker = c.req.param("ticker");
      
      routeLogger.info("Fetching stock updates by ticker", { ticker });
      
      const updates = await updatesService.getStockUpdatesByTicker(ticker);
      
      return c.json({ updates });
    } catch (error) {
      routeLogger.error("Error fetching stock updates by ticker", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ticker: c.req.param("ticker")
      });
      
      return c.json(
        { 
          status: "error", 
          message: error instanceof Error ? error.message : "Unknown error",
          code: 500 
        }, 
        500
      );
    }
  })
  
  // GET /api/updates - Get all stock updates (admin/testing purposes for Phase 1)
  .get("/", async (c) => {
    try {
      routeLogger.info("Fetching all stock updates");
      
      const updates = await updatesService.getAllStockUpdates();
      
      return c.json({ updates });
    } catch (error) {
      routeLogger.error("Error fetching all stock updates", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return c.json(
        { 
          status: "error", 
          message: error instanceof Error ? error.message : "Unknown error",
          code: 500 
        }, 
        500
      );
    }
  }); 
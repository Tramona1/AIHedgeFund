import { Hono } from "hono";
import { aiTriggersService } from "./ai-triggers.service";
import { aiTriggerPayloadSchema } from "@repo/db";
import { zValidator } from "@/pkg/util/validator-wrapper";
import { logger } from "@repo/logger";
import { z } from "zod";

// Create a component-specific logger
const routeLogger = logger.child({ component: "ai-triggers-routes" });

// Schema for creating a test trigger
const createTestTriggerSchema = z.object({
  ticker: z.string(),
  eventType: z.enum([
    "hedge_fund_buy",
    "hedge_fund_sell",
    "investor_mention",
    "market_shift",
    "technical_signal",
    "option_flow",
    "dark_pool_buy",
    "politician_buy",
    "politician_sell"
  ]),
  // Other fields are optional
  fund: z.string().optional(),
  shares: z.number().optional(),
  shares_value: z.number().optional(),
  investor: z.string().optional(),
  source: z.string().optional(),
});

// Create a router for AI triggers
export const aiTriggersRoutes = new Hono()
  // POST /api/ai-triggers - Receive trigger from AI system
  .post("/", zValidator("json", aiTriggerPayloadSchema), async (c) => {
    try {
      const payload = c.req.valid("json");
      routeLogger.info("Received AI trigger", { 
        ticker: payload.ticker, 
        eventType: payload.event_type 
      });
      
      // Process the trigger asynchronously
      aiTriggersService.processAITrigger(payload)
        .catch(error => {
          routeLogger.error("Error processing AI trigger", { 
            error: error instanceof Error ? error.message : String(error),
            ticker: payload.ticker, 
            eventType: payload.event_type 
          });
        });
      
      // Return immediately with 202 Accepted
      return c.json({ status: "accepted", message: "Trigger received and processing" }, 202);
    } catch (error) {
      routeLogger.error("Error handling AI trigger request", { 
        error: error instanceof Error ? error.message : String(error),
        path: c.req.path,
        method: c.req.method 
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
  
  // POST /api/ai-triggers/test - Create a test trigger for demo purposes
  .post("/test", zValidator("json", createTestTriggerSchema), async (c) => {
    try {
      const { ticker, eventType, fund, shares, shares_value, investor, source } = c.req.valid("json");
      
      routeLogger.info("Creating test AI trigger", { ticker, eventType });
      
      // Create a full AI trigger payload
      const testPayload = {
        event_type: eventType,
        ticker,
        fund: fund || `Test Hedge Fund ${Math.floor(Math.random() * 10) + 1}`,
        shares: shares || Math.floor(Math.random() * 1000000) + 10000,
        shares_value: shares_value || Math.floor(Math.random() * 10000000) + 1000000,
        investor: investor || undefined,
        source: source || "Demo Test Trigger",
        timestamp: new Date().toISOString(),
        details: {
          note: "This is a test trigger created for demonstration purposes",
          demo: true
        }
      };
      
      // Process the trigger
      await aiTriggersService.processAITrigger(testPayload);
      
      return c.json({ 
        status: "success", 
        message: "Test trigger created and processed successfully",
        data: testPayload
      });
    } catch (error) {
      routeLogger.error("Error creating test trigger", { 
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
  
  // GET /api/ai-triggers/:ticker - Get AI triggers for a specific ticker
  .get("/:ticker", async (c) => {
    try {
      const ticker = c.req.param("ticker");
      routeLogger.info("Fetching AI triggers for ticker", { ticker });
      
      const events = await aiTriggersService.getAITriggersByTicker(ticker);
      
      return c.json({ events });
    } catch (error) {
      routeLogger.error("Error fetching AI triggers", { 
        error: error instanceof Error ? error.message : String(error),
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
  }); 
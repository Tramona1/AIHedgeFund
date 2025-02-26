import { Hono } from "hono";
import { notificationsService } from "./notifications.service";
import { logger } from "@repo/logger";
import { zValidator } from "@/pkg/util/validator-wrapper";
import { z } from "zod";

// Create a component-specific logger
const routeLogger = logger.child({ component: "notifications-routes" });

// Define validation schema for sending test emails
const testEmailSchema = z.object({
  ticker: z.string(),
  eventType: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});

// Create a router for notifications
export const notificationsRoutes = new Hono()
  // POST /api/notifications/test - Send a test email
  .post("/test", zValidator("json", testEmailSchema), async (c) => {
    try {
      const { ticker, eventType, details = {} } = c.req.valid("json");
      
      routeLogger.info("Received test email request", { ticker, eventType });
      
      await notificationsService.sendStockUpdateEmail(ticker, eventType, details);
      
      return c.json({ status: "success", message: "Test email sent successfully" });
    } catch (error) {
      routeLogger.error("Error sending test email", { 
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
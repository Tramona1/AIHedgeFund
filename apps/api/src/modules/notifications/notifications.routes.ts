import { Hono } from "hono";
// @ts-ignore: JS file without types
import { notificationsService } from "./notifications.service.js";
import { logger } from "@repo/logger";
import { zValidator } from "../../pkg/util/validator-wrapper.js";
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
  .post("/test", async (c) => {
    try {
      const body = await c.req.json();
      const validation = testEmailSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({
          status: "error",
          message: "Validation failed",
          errors: validation.error.format(),
          code: 400
        }, 400);
      }
      
      const { ticker, eventType, details = {} } = validation.data;
      
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
  })
  .post('/send-stock-update', async (c) => {
    const data = await c.req.json();
    const { ticker, eventType, details } = data;
    
    try {
      routeLogger.info(`Sending stock update for ${ticker} (${eventType})`, { ticker, eventType });
      await notificationsService.sendStockUpdateEmail(ticker, eventType, details);
      return c.json({ status: 'success', message: 'Stock update emails sent successfully' });
    } catch (error) {
      routeLogger.error('Error sending stock update', { 
        error: error instanceof Error ? error.message : String(error),
        ticker,
        eventType 
      });
      return c.json({ status: 'error', message: 'Failed to send stock update emails' }, 500);
    }
  })
  /* Temporarily disabled due to import issues
  .post('/send-weekly-newsletter', async (c) => {
    try {
      routeLogger.info('Starting weekly newsletter generation');
      const result = await weeklyNewsletterService.generateAndSendWeeklyNewsletters();
      routeLogger.info('Weekly newsletter generation completed', result);
      return c.json({ 
        status: 'success', 
        message: 'Weekly newsletters sent successfully',
        ...result
      });
    } catch (error) {
      routeLogger.error('Error sending weekly newsletters', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return c.json({ 
        status: 'error', 
        message: 'Failed to send weekly newsletters'
      }, 500);
    }
  })
  */; 
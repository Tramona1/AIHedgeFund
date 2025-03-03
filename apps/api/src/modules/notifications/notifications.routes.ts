import express, { Request, Response } from "express";
// @ts-ignore: JS file without types
import { notificationsService } from "./notifications.service.js";
import { logger } from "@repo/logger";
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
const router = express.Router();

// POST /api/notifications/test - Send a test email
router.post("/test", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const validation = testEmailSchema.safeParse(body);
    
    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: validation.error.format(),
        code: 400
      });
    }
    
    const { ticker, eventType, details = {} } = validation.data;
    
    routeLogger.info("Received test email request", { ticker, eventType });
    
    await notificationsService.sendStockUpdateEmail(ticker, eventType, details);
    
    return res.json({ status: "success", message: "Test email sent successfully" });
  } catch (error) {
    routeLogger.error("Error sending test email", { 
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

// POST /api/notifications/send-stock-update - Send stock update notifications
router.post('/send-stock-update', async (req: Request, res: Response) => {
  const { ticker, eventType, details } = req.body;
  
  try {
    routeLogger.info(`Sending stock update for ${ticker} (${eventType})`, { ticker, eventType });
    await notificationsService.sendStockUpdateEmail(ticker, eventType, details);
    return res.json({ status: 'success', message: 'Stock update emails sent successfully' });
  } catch (error) {
    routeLogger.error('Error sending stock update', { 
      error: error instanceof Error ? error.message : String(error),
      ticker,
      eventType 
    });
    return res.status(500).json({ status: 'error', message: 'Failed to send stock update emails' });
  }
});

/* Temporarily disabled due to import issues
router.post('/send-weekly-newsletter', async (req: Request, res: Response) => {
  try {
    routeLogger.info('Starting weekly newsletter generation');
    const result = await weeklyNewsletterService.generateAndSendWeeklyNewsletters();
    routeLogger.info('Weekly newsletter generation completed', result);
    return res.json({ 
      status: 'success', 
      message: 'Weekly newsletters sent successfully',
      ...result
    });
  } catch (error) {
    routeLogger.error('Error sending weekly newsletters', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to send weekly newsletters'
    });
  }
});
*/

export const notificationsRoutes = router; 
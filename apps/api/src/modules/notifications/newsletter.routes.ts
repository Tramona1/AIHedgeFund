import express, { Request, Response } from "express";
import { z } from "zod";
import { logger } from "@repo/logger";
// @ts-ignore: JS file without types
import { newsletterService } from "./newsletter.service.js";

// Create a component-specific logger
const routeLogger = logger.child({ component: "newsletter-routes" });

// Validation schemas
const preferencesSchema = z.object({
  isSubscribed: z.boolean().optional(),
  stocks: z.boolean().optional(),
  crypto: z.boolean().optional(),
  realEstate: z.boolean().optional(),
  commodities: z.boolean().optional(),
  bonds: z.boolean().optional(),
  etfs: z.boolean().optional(),
  weeklyMarketSummary: z.boolean().optional(),
  weeklyWatchlistUpdates: z.boolean().optional(),
  weeklyOptionsFlow: z.boolean().optional(),
  weeklyDarkPoolActivity: z.boolean().optional(),
  preferredDay: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']).optional(),
});

// Extend the Express Request type to include userId and validatedData
declare module "express-serve-static-core" {
  interface Request {
    validatedData: any;
  }
}

// Middleware for validating preferences
const validatePreferences = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const result = preferencesSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid preferences data",
        errors: result.error.format()
      });
    }
    req.validatedData = result.data;
    next();
  } catch (error: any) {
    routeLogger.error("Preferences validation error", { error });
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.message
    });
  }
};

// Create an Express router
const router = express.Router();

// GET /preferences - Get user's newsletter preferences
router.get("/preferences", async (req: Request, res: Response) => {
  try {
    // Get user ID from auth middleware or request
    const userId = req.headers["x-user-id"] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    
    routeLogger.info("Getting newsletter preferences", { userId });
    
    const preferences = await newsletterService.getUserPreferences(userId);
    
    return res.json({
      success: true,
      preferences
    });
  } catch (error: any) {
    routeLogger.error("Error fetching newsletter preferences", { 
      error: error.message,
      userId: req.headers["x-user-id"] 
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to fetch newsletter preferences",
      error: error.message
    });
  }
});

// POST /preferences - Update user's newsletter preferences
router.post("/preferences", validatePreferences, async (req: Request, res: Response) => {
  try {
    // Get user ID from auth middleware or request
    const userId = req.headers["x-user-id"] as string;
    const email = req.headers["x-user-email"] as string;
    
    if (!userId || !email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID and email required"
      });
    }
    
    const preferences = req.validatedData;
    
    routeLogger.info("Updating newsletter preferences", { userId, preferences });
    
    await newsletterService.upsertPreferences(userId, email, preferences);
    
    return res.status(200).json({
      success: true,
      message: "Newsletter preferences updated successfully"
    });
  } catch (error: any) {
    routeLogger.error("Error updating newsletter preferences", { 
      error: error.message,
      userId: req.headers["x-user-id"],
      preferences: req.body
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to update newsletter preferences",
      error: error.message
    });
  }
});

// PUT /subscribe - Subscribe to newsletter
router.put("/subscribe", async (req: Request, res: Response) => {
  try {
    // Get user ID from auth middleware or request
    const userId = req.headers["x-user-id"] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    
    routeLogger.info("User subscribing to newsletter", { userId });
    
    await newsletterService.toggleSubscription(userId, true);
    
    return res.json({
      success: true,
      message: "Successfully subscribed to newsletter"
    });
  } catch (error: any) {
    routeLogger.error("Error subscribing to newsletter", { 
      error: error.message,
      userId: req.headers["x-user-id"] 
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to subscribe to newsletter",
      error: error.message
    });
  }
});

// PUT /unsubscribe - Unsubscribe from newsletter
router.put("/unsubscribe", async (req: Request, res: Response) => {
  try {
    // Get user ID from auth middleware or request
    const userId = req.headers["x-user-id"] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    
    routeLogger.info("User unsubscribing from newsletter", { userId });
    
    await newsletterService.toggleSubscription(userId, false);
    
    return res.json({
      success: true,
      message: "Successfully unsubscribed from newsletter"
    });
  } catch (error: any) {
    routeLogger.error("Error unsubscribing from newsletter", { 
      error: error.message,
      userId: req.headers["x-user-id"] 
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to unsubscribe from newsletter",
      error: error.message
    });
  }
});

export const newsletterRoutes = router; 
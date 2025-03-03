import express, { Request, Response } from "express";
import { updatesService } from "../updates/updates.service.js";
import { logger } from "@repo/logger";
import { z } from "zod";
import { usersService } from "./users.service.js";

// Create a component-specific logger
const routeLogger = logger.child({ component: "users-routes" });

// Define validation schema for user preferences
const userPreferencesSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  tickers: z.array(z.string()).optional(),
  sectors: z.array(z.string()).optional(),
  tradingStyle: z.string().optional(),
  updateFrequency: z.enum(["daily", "weekly", "realtime"]).default("weekly"),
  customTriggers: z.record(z.string(), z.any()).optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketAlerts: z.boolean().optional(),
  newsAlerts: z.boolean().optional(),
  watchlistNotifications: z.boolean().optional()
});

// Extend the Express Request type to include validatedData
declare module "express-serve-static-core" {
  interface Request {
    validatedData: any;
  }
}

type UserPreferencesData = z.infer<typeof userPreferencesSchema>;

// Create an Express router
const router = express.Router();

// Middleware for validating user preferences
const validateUserPreferences = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const result = userPreferencesSchema.safeParse(req.body);
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
 * GET /api/users/preferences/:userId
 * Get user preferences
 */
router.get("/preferences/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    routeLogger.info("Getting user preferences", { userId });
    
    const preferencesArray = await usersService.getUserPreferences(userId);
    
    if (!preferencesArray || preferencesArray.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User preferences not found"
      });
    }
    
    const preferences = preferencesArray[0];
    
    return res.json({
      success: true,
      preferences
    });
  } catch (error: any) {
    routeLogger.error("Error getting user preferences", {
      error: error.message,
      userId: req.params.userId
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get user preferences"
    });
  }
});

/**
 * POST /api/users/preferences
 * Create or update user preferences
 */
router.post("/preferences", validateUserPreferences, async (req: Request, res: Response) => {
  try {
    const preferencesData: UserPreferencesData = req.validatedData;
    
    routeLogger.info("Creating/updating user preferences", {
      userId: preferencesData.userId
    });
    
    await usersService.createOrUpdateUserPreferences(preferencesData);
    
    return res.status(201).json({
      success: true,
      message: "User preferences saved successfully"
    });
  } catch (error: any) {
    routeLogger.error("Error saving user preferences", {
      error: error.message,
      data: req.body
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to save user preferences"
    });
  }
});

/**
 * GET /api/users/:userId/updates
 * Get stock updates for a user based on their preferences
 */
router.get("/:userId/updates", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    routeLogger.info("Getting user-relevant stock updates", { userId });
    
    // Get user preferences first to determine which updates to fetch
    const preferencesArray = await usersService.getUserPreferences(userId);
    
    if (!preferencesArray || preferencesArray.length === 0) {
      return res.json({
        success: true,
        updates: []
      });
    }
    
    const preferences = preferencesArray[0];
    
    if (!preferences.tickers || preferences.tickers.length === 0) {
      return res.json({
        success: true,
        updates: []
      });
    }
    
    // Fetch updates for each ticker in user preferences
    const updates = await Promise.all(
      preferences.tickers.map(ticker => updatesService.getStockUpdatesByTicker(ticker))
    );
    
    // Flatten the array of arrays
    const flattenedUpdates = updates.flat();
    
    return res.json({
      success: true,
      updates: flattenedUpdates
    });
  } catch (error: any) {
    routeLogger.error("Error getting user-relevant updates", {
      error: error.message,
      userId: req.params.userId
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get user updates"
    });
  }
});

/**
 * GET /api/users
 * Get all users (admin/testing purposes for Phase 1)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    routeLogger.info("Fetching all users");
    
    const users = await usersService.getAllUsers();
    
    return res.json({
      success: true,
      users
    });
  } catch (error: any) {
    routeLogger.error("Error fetching all users", {
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch users"
    });
  }
});

export const userRoutes = router; 
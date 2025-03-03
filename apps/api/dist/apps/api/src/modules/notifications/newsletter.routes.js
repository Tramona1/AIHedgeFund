import { Hono } from "hono";
import { zValidator } from "../../pkg/util/validator-wrapper.js";
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
// Create a router for newsletter preferences
export const newsletterRoutes = new Hono()
    // GET /preferences - Get user's newsletter preferences
    .get("/preferences", async (c) => {
    try {
        // Get user ID from auth context
        // @ts-ignore: Context type is defined in global declaration
        const userId = c.get("userId");
        if (!userId) {
            return c.json({
                success: false,
                message: "Unauthorized",
            }, 401);
        }
        const preferences = await newsletterService.getUserPreferences(userId);
        return c.json({
            success: true,
            data: preferences,
        });
    }
    catch (error) {
        routeLogger.error("Error getting newsletter preferences", { error });
        return c.json({
            success: false,
            message: "Failed to get newsletter preferences",
        }, 500);
    }
})
    // POST /preferences - Update user's newsletter preferences
    .post("/preferences", zValidator("json", preferencesSchema), async (c) => {
    try {
        // Get user ID from auth context
        // @ts-ignore: Context type is defined in global declaration
        const userId = c.get("userId");
        // @ts-ignore: Context type is defined in global declaration
        const email = c.get("userEmail");
        if (!userId || !email) {
            return c.json({
                success: false,
                message: "Unauthorized",
            }, 401);
        }
        const preferences = await c.req.json();
        const updated = await newsletterService.upsertPreferences(userId, email, preferences);
        return c.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        routeLogger.error("Error updating newsletter preferences", { error });
        return c.json({
            success: false,
            message: "Failed to update newsletter preferences",
        }, 500);
    }
})
    // POST /subscribe - Subscribe user to newsletter
    .post("/subscribe", async (c) => {
    try {
        // Get user ID from auth context
        // @ts-ignore: Context type is defined in global declaration
        const userId = c.get("userId");
        // @ts-ignore: Context type is defined in global declaration
        const email = c.get("userEmail");
        if (!userId || !email) {
            return c.json({
                success: false,
                message: "Unauthorized",
            }, 401);
        }
        // Subscribe user with default preferences
        const updated = await newsletterService.upsertPreferences(userId, email, {
            isSubscribed: true,
        });
        return c.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        routeLogger.error("Error subscribing to newsletter", { error });
        return c.json({
            success: false,
            message: "Failed to subscribe to newsletter",
        }, 500);
    }
})
    // POST /unsubscribe - Unsubscribe user from newsletter
    .post("/unsubscribe", async (c) => {
    try {
        // Get user ID from auth context
        // @ts-ignore: Context type is defined in global declaration
        const userId = c.get("userId");
        if (!userId) {
            return c.json({
                success: false,
                message: "Unauthorized",
            }, 401);
        }
        const updated = await newsletterService.toggleSubscription(userId, false);
        return c.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        routeLogger.error("Error unsubscribing from newsletter", { error });
        return c.json({
            success: false,
            message: "Failed to unsubscribe from newsletter",
        }, 500);
    }
});
//# sourceMappingURL=newsletter.routes.js.map
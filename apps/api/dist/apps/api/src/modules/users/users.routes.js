import { Hono } from "hono";
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
    watchlistNotifications: z.boolean().optional(),
});
// Create a router for users
export const userRoutes = new Hono()
    // POST /api/users/preferences - Create or update user preferences
    .post("/preferences", async (c) => {
    try {
        // Manual validation as a workaround
        const body = await c.req.json();
        const validation = userPreferencesSchema.safeParse(body);
        if (!validation.success) {
            return c.json({
                status: "error",
                message: "Validation failed",
                errors: validation.error.format(),
                code: 400
            }, 400);
        }
        const data = validation.data;
        routeLogger.info("Received user preferences update", { userId: data.userId });
        // Ensure userId and email are always present when passing to service
        const userPreferencesData = {
            userId: data.userId,
            email: data.email,
            ...data
        };
        await usersService.createOrUpdateUserPreferences(userPreferencesData);
        return c.json({ status: "success", message: "User preferences saved successfully" });
    }
    catch (error) {
        routeLogger.error("Error saving user preferences", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return c.json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            code: 500
        }, 500);
    }
})
    // GET /api/users/:userId/preferences - Get user preferences
    .get("/:userId/preferences", async (c) => {
    try {
        const userId = c.req.param("userId");
        routeLogger.info("Fetching user preferences", { userId });
        const userPreferences = await usersService.getUserPreferences(userId);
        if (userPreferences.length === 0) {
            // Return an empty preferences object rather than an error
            // This avoids the "User not found" error for new users
            routeLogger.info("No preferences found for user, returning empty preferences", { userId });
            return c.json({
                status: "success",
                userPreferences: null
            });
        }
        return c.json({
            status: "success",
            userPreferences: userPreferences[0]
        });
    }
    catch (error) {
        routeLogger.error("Error fetching user preferences", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: c.req.param("userId")
        });
        return c.json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            code: 500
        }, 500);
    }
})
    // GET /api/users - Get all users (admin/testing purposes for Phase 1)
    .get("/", async (c) => {
    try {
        routeLogger.info("Fetching all users");
        // Use the real data source
        const users = await usersService.getAllUsers();
        return c.json({ users });
    }
    catch (error) {
        routeLogger.error("Error fetching all users", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return c.json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            code: 500
        }, 500);
    }
});
//# sourceMappingURL=users.routes.js.map
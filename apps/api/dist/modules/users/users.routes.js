import { Hono } from "hono";
import { usersService } from "./users.service";
import { logger } from "@repo/logger";
import { zValidator } from "@/pkg/util/validator-wrapper";
import { z } from "zod";
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
});
// Create a router for users
export const userRoutes = new Hono()
    // POST /api/users/preferences - Create or update user preferences
    .post("/preferences", zValidator("json", userPreferencesSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        routeLogger.info("Received user preferences update", { userId: data.userId });
        await usersService.createOrUpdateUserPreferences(data);
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
            return c.json({
                status: "error",
                message: "User not found",
                code: 404
            }, 404);
        }
        return c.json({ userPreferences: userPreferences[0] });
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
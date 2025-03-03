import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { aiQueryService } from "./ai-query.service.js";
const aiQueryRoutes = new Hono();
// Schema for validating query requests
const queryRequestSchema = z.object({
    query: z.string().min(1, "Query is required").max(1000, "Query is too long"),
});
// Schema for validating query history requests
const historyRequestSchema = z.object({
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0),
});
/**
 * Process a natural language query about stocks
 * POST /api/ai-query
 */
aiQueryRoutes.post("/", zValidator("json", queryRequestSchema), async (c) => {
    try {
        const { query } = c.req.valid("json");
        const userId = c.req.header("x-user-id") || "anonymous";
        const result = await aiQueryService.processQuery(query);
        // Save query for future reference (if not anonymous)
        if (userId !== "anonymous") {
            await aiQueryService.saveQuery(userId, query, result);
        }
        return c.json({
            success: true,
            response: result.response,
            data: result.data,
        });
    }
    catch (error) {
        console.error("Error processing AI query:", error);
        return c.json({
            success: false,
            error: error.message || "Failed to process query",
        }, 500);
    }
});
/**
 * Get query history for a user
 * GET /api/ai-query/history
 */
aiQueryRoutes.get("/history", zValidator("query", historyRequestSchema), async (c) => {
    try {
        const { limit, offset } = c.req.valid("query");
        const userId = c.req.header("x-user-id");
        if (!userId) {
            return c.json({
                success: false,
                error: "User ID is required",
            }, 400);
        }
        // Get query history from database
        const history = await aiQueryService.getQueryHistory(userId, limit, offset);
        const total = await aiQueryService.getQueryCount(userId);
        return c.json({
            success: true,
            history,
            total,
        });
    }
    catch (error) {
        console.error("Error getting query history:", error);
        return c.json({
            success: false,
            error: error.message || "Failed to get query history",
        }, 500);
    }
});
export { aiQueryRoutes };
//# sourceMappingURL=ai-query.routes.js.map
import { Hono } from "hono";
import { interviewsService } from "./interviews.service.js";
import { logger } from "@repo/logger";
// Create a component-specific logger
const routeLogger = logger.child({ component: "interviews-routes" });
// Create a router for interviews
export const interviewsRoutes = new Hono()
    // GET /api/interviews/recent - Get recent interviews
    .get("/recent", async (c) => {
    try {
        // Extract query parameters
        const url = new URL(c.req.url);
        const limit = parseInt(url.searchParams.get("limit") || "10", 10);
        const speaker = url.searchParams.get("speaker");
        routeLogger.info("Getting recent interviews", { limit, speaker });
        const interviews = await interviewsService.getRecentInterviews(limit, speaker);
        return c.json({
            status: "success",
            data: interviews,
            meta: {
                count: interviews.length,
                limit,
                filters: { speaker }
            }
        });
    }
    catch (error) {
        routeLogger.error("Error fetching interviews", {
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
    // GET /api/interviews/speakers - Get available interview speakers
    .get("/speakers", async (c) => {
    try {
        routeLogger.info("Getting interview speakers");
        const speakers = await interviewsService.getSpeakers();
        return c.json({
            status: "success",
            data: speakers
        });
    }
    catch (error) {
        routeLogger.error("Error fetching interview speakers", {
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
//# sourceMappingURL=interviews.routes.js.map
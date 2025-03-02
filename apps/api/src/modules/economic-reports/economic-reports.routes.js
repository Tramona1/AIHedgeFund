import { Hono } from "hono";
import { economicReportsService } from "./economic-reports.service.js";
import { logger } from "@repo/logger";

// Create a component-specific logger
const routeLogger = logger.child({ component: "economic-reports-routes" });

// Create a router for economic reports
export const economicReportsRoutes = new Hono()
  // GET /api/economic-reports/recent - Get recent economic reports
  .get("/recent", async (c) => {
    try {
      // Extract query parameters
      const url = new URL(c.req.url);
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);
      const source = url.searchParams.get("source");
      const category = url.searchParams.get("category");
      
      routeLogger.info("Getting recent economic reports", { limit, source, category });
      
      const reports = await economicReportsService.getRecentReports(limit, source, category);
      
      return c.json({ 
        status: "success", 
        data: reports,
        meta: {
          count: reports.length,
          limit,
          filters: { source, category }
        }
      });
    } catch (error) {
      routeLogger.error("Error fetching economic reports", { 
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
  
  // GET /api/economic-reports/sources - Get available economic report sources
  .get("/sources", async (c) => {
    try {
      routeLogger.info("Getting economic report sources");
      
      const sources = await economicReportsService.getSources();
      
      return c.json({ 
        status: "success", 
        data: sources
      });
    } catch (error) {
      routeLogger.error("Error fetching economic report sources", { 
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
  
  // GET /api/economic-reports/categories - Get available economic report categories
  .get("/categories", async (c) => {
    try {
      routeLogger.info("Getting economic report categories");
      
      const categories = await economicReportsService.getCategories();
      
      return c.json({ 
        status: "success", 
        data: categories
      });
    } catch (error) {
      routeLogger.error("Error fetching economic report categories", { 
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
import express from "express";
import { economicReportsService } from "./economic-reports.service.js";
import { logger } from "@repo/logger";

// Create a component-specific logger
const routeLogger = logger.child({ component: "economic-reports-routes" });

// Create a router for economic reports
const router = express.Router();

// GET /api/economic-reports/recent - Get recent economic reports
router.get("/recent", async (req, res) => {
  try {
    // Extract query parameters
    const limit = parseInt(req.query.limit || "10", 10);
    const source = req.query.source;
    const category = req.query.category;
    
    routeLogger.info("Getting recent economic reports", { limit, source, category });
    
    const reports = await economicReportsService.getRecentReports(limit, source, category);
    
    return res.json({ 
      status: "success", 
      data: reports,
      meta: {
        count: reports.length,
        limit,
        filters: { source, category }
      }
    });
  } catch (error) {
    routeLogger.error("Error getting recent economic reports", { error });
    
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to get economic reports"
    });
  }
});

// GET /api/economic-reports/:id - Get economic report by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    routeLogger.info("Getting economic report by ID", { id });
    
    const report = await economicReportsService.getReportById(id);
    
    if (!report) {
      return res.status(404).json({
        status: "error",
        message: "Economic report not found"
      });
    }
    
    return res.json({
      status: "success",
      data: report
    });
  } catch (error) {
    routeLogger.error("Error getting economic report by ID", { error, id: req.params.id });
    
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to get economic report"
    });
  }
});

// GET /api/economic-reports/sources - Get all distinct sources
router.get("/sources/list", async (req, res) => {
  try {
    routeLogger.info("Getting all distinct sources");
    
    const sources = await economicReportsService.getDistinctSources();
    
    return res.json({
      status: "success",
      data: sources
    });
  } catch (error) {
    routeLogger.error("Error getting distinct sources", { error });
    
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to get sources"
    });
  }
});

export const economicReportsRoutes = router; 
import express from "express";
import { interviewsService } from "./interviews.service.js";
import { logger } from "@repo/logger";

// Create a component-specific logger
const routeLogger = logger.child({ component: "interviews-routes" });

// Create a router for interviews
const router = express.Router();

// GET /api/interviews/recent - Get recent interviews
router.get("/recent", async (req, res) => {
  try {
    // Extract query parameters
    const limit = parseInt(req.query.limit || "10", 10);
    const speaker = req.query.speaker;
    
    routeLogger.info("Getting recent interviews", { limit, speaker });
    
    const interviews = await interviewsService.getRecentInterviews(limit, speaker);
    
    return res.json({ 
      status: "success", 
      data: interviews,
      meta: {
        count: interviews.length,
        limit,
        filters: { speaker }
      }
    });
  } catch (error) {
    routeLogger.error("Error getting recent interviews", { error });
    
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to get interviews"
    });
  }
});

// GET /api/interviews/:id - Get interview by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    routeLogger.info("Getting interview by ID", { id });
    
    const interview = await interviewsService.getInterviewById(id);
    
    if (!interview) {
      return res.status(404).json({
        status: "error",
        message: "Interview not found"
      });
    }
    
    return res.json({
      status: "success",
      data: interview
    });
  } catch (error) {
    routeLogger.error("Error getting interview by ID", { error, id: req.params.id });
    
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to get interview"
    });
  }
});

// GET /api/interviews/speakers/list - Get all distinct speakers
router.get("/speakers/list", async (req, res) => {
  try {
    routeLogger.info("Getting all distinct speakers");
    
    const speakers = await interviewsService.getDistinctSpeakers();
    
    return res.json({
      status: "success",
      data: speakers
    });
  } catch (error) {
    routeLogger.error("Error getting distinct speakers", { error });
    
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to get speakers"
    });
  }
});

export const interviewsRoutes = router; 
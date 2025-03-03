import express, { Request, Response } from "express";
import { z } from "zod";
import { aiQueryService } from "./ai-query.service.js";
import { logger } from "@repo/logger";
import { zValidator } from "../../pkg/util/validator-wrapper.js";

const router = express.Router();

// Schema for validating query requests
const queryRequestSchema = z.object({
  query: z.string().min(1, "Query is required").max(1000, "Query is too long"),
});

// Schema for validating query history requests
const historyRequestSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

// Middleware for validating request body against the query schema
const validateQueryRequest = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const result = queryRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.format(),
      });
    }
    req.body = result.data;
    next();
  } catch (error: any) {
    logger.error("Validation error:", error);
    return res.status(400).json({
      success: false,
      error: error.message || "Invalid request",
    });
  }
};

// Middleware for validating query parameters against the history schema
const validateHistoryRequest = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const result = historyRequestSchema.safeParse({
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.format(),
      });
    }
    
    req.query = { ...req.query, ...result.data };
    next();
  } catch (error: any) {
    logger.error("Validation error:", error);
    return res.status(400).json({
      success: false,
      error: error.message || "Invalid request",
    });
  }
};

/**
 * Process a natural language query about stocks
 * POST /api/ai-query
 */
router.post("/", validateQueryRequest, async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const userId = req.header("x-user-id") || "anonymous";
    
    const result = await aiQueryService.processQuery(query);
    
    // Save query for future reference (if not anonymous)
    if (userId !== "anonymous") {
      await aiQueryService.saveQuery(userId, query, result);
    }
    
    return res.json({
      success: true,
      response: result.response,
      data: result.data,
    });
  } catch (error: any) {
    logger.error("Error processing AI query:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process query",
    });
  }
});

/**
 * Get query history for a user
 * GET /api/ai-query/history
 */
router.get("/history", validateHistoryRequest, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = req.header("x-user-id");
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }
    
    // Get query history from database
    const history = await aiQueryService.getQueryHistory(userId, limit, offset);
aiQueryRoutes.post(
  "/",
  zValidator("json", queryRequestSchema),
  async (c) => {
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
    } catch (error: any) {
      console.error("Error processing AI query:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Failed to process query",
        },
        500
      );
    }
  }
);

/**
 * Get query history for a user
 * GET /api/ai-query/history
 */
aiQueryRoutes.get(
  "/history",
  zValidator("query", historyRequestSchema),
  async (c) => {
    try {
      const { limit, offset } = c.req.valid("query");
      const userId = c.req.header("x-user-id");
      
      if (!userId) {
        return c.json(
          {
            success: false,
            error: "User ID is required",
          },
          400
        );
      }
      
      // Get query history from database
      const history = await aiQueryService.getQueryHistory(userId, limit, offset);
      const total = await aiQueryService.getQueryCount(userId);
      
      return c.json({
        success: true,
        history,
        total,
      });
    } catch (error: any) {
      console.error("Error getting query history:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Failed to get query history",
        },
        500
      );
    }
  }
);

export { aiQueryRoutes }; 
import { Hono } from "hono";
import { logger } from "@repo/logger";
import { portfolioService } from "./portfolio.service.js";
import { zValidator } from "../../pkg/util/validator-wrapper.js";
import { 
  createPortfolioSchema,
  updatePortfolioSchema,
  addPositionSchema,
  updatePositionSchema,
  recordTransactionSchema,
  portfolioPerformanceRequestSchema
} from "./portfolio.schema.js";
import { z } from "zod";

// Create a module-specific logger
const portfolioLogger = logger.child({ module: "portfolio-routes" });

// Create a router for portfolio management
export const portfolioRoutes = new Hono()
  // GET /api/portfolio/user/:userId - Get all portfolios for a user
  .get("/user/:userId", async (c) => {
    try {
      const userId = c.req.param("userId");
      
      portfolioLogger.info(`Fetching portfolios for user ${userId}`);
      
      const portfolios = await portfolioService.getUserPortfolios(userId);
      
      return c.json({
        success: true,
        data: portfolios,
      });
    } catch (error) {
      portfolioLogger.error("Error fetching portfolios", { error });
      
      return c.json({
        success: false,
        message: "Failed to fetch portfolios",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // GET /api/portfolio/:id - Get a single portfolio
  .get("/:id", async (c) => {
    try {
      const portfolioId = c.req.param("id");
      
      portfolioLogger.info(`Fetching portfolio ${portfolioId}`);
      
      const portfolio = await portfolioService.getPortfolio(portfolioId);
      
      return c.json({
        success: true,
        data: portfolio,
      });
    } catch (error) {
      portfolioLogger.error("Error fetching portfolio", { error });
      
      return c.json({
        success: false,
        message: "Failed to fetch portfolio",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // POST /api/portfolio/create - Create a new portfolio
  .post("/create", zValidator("json", createPortfolioSchema), async (c) => {
    try {
      const body = await c.req.json();
      const validatedData = createPortfolioSchema.parse(body);
      
      portfolioLogger.info(`Creating portfolio for user ${validatedData.userId}`);
      
      const portfolio = await portfolioService.createPortfolio(validatedData.userId, {
        name: validatedData.name,
        description: validatedData.description,
        isDefault: validatedData.isDefault,
      });
      
      return c.json({
        success: true,
        data: portfolio,
        message: "Portfolio created successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error creating portfolio", { error });
      
      return c.json({
        success: false,
        message: "Failed to create portfolio",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // PUT /api/portfolio/:id - Update a portfolio
  .put("/:id", zValidator("json", updatePortfolioSchema), async (c) => {
    try {
      const portfolioId = c.req.param("id");
      const body = await c.req.json();
      const validatedData = updatePortfolioSchema.parse(body);
      
      portfolioLogger.info(`Updating portfolio ${portfolioId}`);
      
      const portfolio = await portfolioService.updatePortfolio(portfolioId, validatedData);
      
      return c.json({
        success: true,
        data: portfolio,
        message: "Portfolio updated successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error updating portfolio", { error });
      
      return c.json({
        success: false,
        message: "Failed to update portfolio",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // DELETE /api/portfolio/:id - Delete a portfolio
  .delete("/:id", async (c) => {
    try {
      const portfolioId = c.req.param("id");
      
      portfolioLogger.info(`Deleting portfolio ${portfolioId}`);
      
      const portfolio = await portfolioService.deletePortfolio(portfolioId);
      
      return c.json({
        success: true,
        data: portfolio,
        message: "Portfolio deleted successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error deleting portfolio", { error });
      
      return c.json({
        success: false,
        message: "Failed to delete portfolio",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // GET /api/portfolio/:id/positions - Get positions for a portfolio
  .get("/:id/positions", async (c) => {
    try {
      const portfolioId = c.req.param("id");
      
      portfolioLogger.info(`Fetching positions for portfolio ${portfolioId}`);
      
      const positions = await portfolioService.getPortfolioPositions(portfolioId);
      
      return c.json({
        success: true,
        data: positions,
      });
    } catch (error) {
      portfolioLogger.error("Error fetching positions", { error });
      
      return c.json({
        success: false,
        message: "Failed to fetch positions",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // POST /api/portfolio/:id/positions/add - Add a position to a portfolio
  .post("/:id/positions/add", zValidator("json", addPositionSchema), async (c) => {
    try {
      const portfolioId = c.req.param("id");
      const body = await c.req.json();
      const validatedData = addPositionSchema.parse(body);
      
      portfolioLogger.info(`Adding position to portfolio ${portfolioId}`);
      
      const position = await portfolioService.addPosition(portfolioId, {
        symbol: validatedData.symbol,
        quantity: validatedData.quantity,
        averageCost: validatedData.averageCost,
        notes: validatedData.notes,
      });
      
      return c.json({
        success: true,
        data: position,
        message: "Position added successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error adding position", { error });
      
      return c.json({
        success: false,
        message: "Failed to add position",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // PUT /api/portfolio/positions/:id - Update a position
  .put("/positions/:id", zValidator("json", updatePositionSchema), async (c) => {
    try {
      const positionId = c.req.param("id");
      const body = await c.req.json();
      const validatedData = updatePositionSchema.parse(body);
      
      portfolioLogger.info(`Updating position ${positionId}`);
      
      const position = await portfolioService.updatePosition(positionId, validatedData);
      
      return c.json({
        success: true,
        data: position,
        message: "Position updated successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error updating position", { error });
      
      return c.json({
        success: false,
        message: "Failed to update position",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // DELETE /api/portfolio/positions/:id - Remove a position
  .delete("/positions/:id", async (c) => {
    try {
      const positionId = c.req.param("id");
      
      portfolioLogger.info(`Removing position ${positionId}`);
      
      const position = await portfolioService.removePosition(positionId);
      
      return c.json({
        success: true,
        data: position,
        message: "Position removed successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error removing position", { error });
      
      return c.json({
        success: false,
        message: "Failed to remove position",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // POST /api/portfolio/transactions - Record a transaction
  .post("/transactions", zValidator("json", recordTransactionSchema), async (c) => {
    try {
      const body = await c.req.json();
      const validatedData = recordTransactionSchema.parse(body);
      
      portfolioLogger.info(`Recording transaction for portfolio ${validatedData.portfolioId}`);
      
      const transaction = await portfolioService.recordTransaction({
        portfolioId: validatedData.portfolioId,
        positionId: validatedData.positionId,
        type: validatedData.type,
        symbol: validatedData.symbol,
        quantity: validatedData.quantity,
        price: validatedData.price,
        fees: validatedData.fees,
        notes: validatedData.notes,
        transactionDate: validatedData.transactionDate,
      });
      
      return c.json({
        success: true,
        data: transaction,
        message: "Transaction recorded successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error recording transaction", { error });
      
      return c.json({
        success: false,
        message: "Failed to record transaction",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // GET /api/portfolio/:id/transactions - Get transactions for a portfolio
  .get("/:id/transactions", async (c) => {
    try {
      const portfolioId = c.req.param("id");
      
      portfolioLogger.info(`Fetching transactions for portfolio ${portfolioId}`);
      
      const transactions = await portfolioService.getPortfolioTransactions(portfolioId);
      
      return c.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      portfolioLogger.error("Error fetching transactions", { error });
      
      return c.json({
        success: false,
        message: "Failed to fetch transactions",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // POST /api/portfolio/:id/update-prices - Update prices for all positions
  .post("/:id/update-prices", async (c) => {
    try {
      const portfolioId = c.req.param("id");
      
      portfolioLogger.info(`Updating prices for portfolio ${portfolioId}`);
      
      await portfolioService.updatePortfolioPrices(portfolioId);
      
      return c.json({
        success: true,
        message: "Portfolio prices updated successfully",
      });
    } catch (error) {
      portfolioLogger.error("Error updating portfolio prices", { error });
      
      return c.json({
        success: false,
        message: "Failed to update portfolio prices",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  })
  
  // GET /api/portfolio/:id/performance - Get performance history for a portfolio
  .get("/:id/performance", async (c) => {
    try {
      const portfolioId = c.req.param("id");
      const daysParam = c.req.query("days");
      const days = daysParam ? parseInt(daysParam, 10) : 30;
      
      portfolioLogger.info(`Fetching performance history for portfolio ${portfolioId}`);
      
      const performances = await portfolioService.getPortfolioPerformanceHistory(portfolioId, days);
      
      return c.json({
        success: true,
        data: performances,
      });
    } catch (error) {
      portfolioLogger.error("Error fetching performance history", { error });
      
      return c.json({
        success: false,
        message: "Failed to fetch performance history",
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }); 
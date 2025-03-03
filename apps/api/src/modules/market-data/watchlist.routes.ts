// @ts-nocheck - Fix for multiple versions of drizzle-orm
import express from "express";
import { logger } from "@repo/logger";
import { db } from "@repo/db";
import { and } from "drizzle-orm";
import { z } from "zod";
import { selectWhere, insertInto, updateWhere, safeEq } from "../../lib/db-helpers.js";

// Get schema objects directly from DB instance
const { userWatchlist } = db._.schema;

// Create a module-specific logger
const watchlistLogger = logger.child({ module: "watchlist-routes" });

// Create a router for the watchlist routes
const router = express.Router();

// Schemas for validation
const symbolParamSchema = z.object({
  symbol: z.string().min(1).max(10),
});

const userIdParamSchema = z.object({
  userId: z.string().min(1),
});

const addSymbolSchema = z.object({
  userId: z.string().min(1),
  symbol: z.string().min(1).max(10),
  notes: z.string().optional(),
});

const updateNotesSchema = z.object({
  notes: z.string(),
});

// Middleware for validating userId parameter
const validateUserId = (req, res, next) => {
  try {
    const result = userIdParamSchema.safeParse({ userId: req.params.userId });
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid userId parameter',
        errors: result.error.errors
      });
    }
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error validating userId parameter',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Middleware for validating symbol parameter
const validateSymbol = (req, res, next) => {
  try {
    const result = symbolParamSchema.safeParse({ symbol: req.params.symbol });
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid symbol parameter',
        errors: result.error.errors
      });
    }
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error validating symbol parameter',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Middleware for validating add symbol request body
const validateAddSymbol = (req, res, next) => {
  try {
    const result = addSymbolSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid request body',
        errors: result.error.errors
      });
    }
    req.validatedBody = result.data;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error validating request body',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Middleware for validating update notes request body
const validateUpdateNotes = (req, res, next) => {
  try {
    const result = updateNotesSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid notes in request body',
        errors: result.error.errors
      });
    }
    req.validatedBody = result.data;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error validating notes in request body',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get all watchlist items for a user
 * GET /api/market-data/watchlist/user/:userId
 */
router.get("/user/:userId", validateUserId, async (req, res) => {
  try {
    const userId = req.params.userId;
    watchlistLogger.info(`Getting watchlist for user ${userId}`);
    
    const watchlistItems = await selectWhere(
      userWatchlist,
      and(
        safeEq(userWatchlist.userId, userId),
        safeEq(userWatchlist.isActive, true)
      )
    );
    
    return res.json({
      success: true,
      userId,
      watchlist: watchlistItems,
    });
  } catch (error) {
    watchlistLogger.error(`Error getting watchlist for user ${req.params.userId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to get user watchlist",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Add a symbol to a user's watchlist
 * POST /api/market-data/watchlist/add
 */
router.post("/add", validateAddSymbol, async (req, res) => {
  try {
    const { userId, symbol, notes } = req.validatedBody;
    watchlistLogger.info(`Adding ${symbol} to watchlist for user ${userId}`);
    
    // Check if symbol already exists for this user
    const existing = await selectWhere(
      userWatchlist,
      and(
        safeEq(userWatchlist.userId, userId),
        safeEq(userWatchlist.symbol, symbol)
      )
    );
    
    if (existing.length > 0) {
      // If it exists but is not active, reactivate it
      if (!existing[0].isActive) {
        const updated = await updateWhere(
          userWatchlist,
          { 
            isActive: true,
            notes: notes || existing[0].notes,
            addedAt: new Date()
          },
          and(
            safeEq(userWatchlist.userId, userId),
            safeEq(userWatchlist.symbol, symbol)
          )
        );
        
        watchlistLogger.info(`Reactivated ${symbol} in watchlist for user ${userId}`);
        
        return res.json({
          success: true,
          message: `Symbol ${symbol} reactivated in watchlist`,
          watchlistItem: updated[0]
        });
      }
      
      return res.status(409).json({
        success: false,
        message: `Symbol ${symbol} already exists in watchlist`,
        watchlistItem: existing[0]
      });
    }
    
    // Insert the new watchlist item
    const result = await insertInto(
      userWatchlist,
      {
        userId,
        symbol,
        notes,
        addedAt: new Date(),
        isActive: true
      }
    );
    
    watchlistLogger.info(`Added ${symbol} to watchlist for user ${userId}`);
    
    return res.json({
      success: true,
      message: `Symbol ${symbol} added to watchlist`,
      watchlistItem: result
    });
  } catch (error) {
    watchlistLogger.error("Error adding symbol to watchlist", {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to add symbol to watchlist",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Remove a symbol from a user's watchlist (soft delete)
 * DELETE /api/market-data/watchlist/user/:userId/symbol/:symbol
 */
router.delete(
  "/user/:userId/symbol/:symbol", 
  validateUserId,
  validateSymbol,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const symbol = req.params.symbol;
      watchlistLogger.info(`Removing ${symbol} from watchlist for user ${userId}`);
      
      // Soft delete by setting isActive to false
      const result = await updateWhere(
        userWatchlist,
        { isActive: false },
        and(
          safeEq(userWatchlist.userId, userId),
          safeEq(userWatchlist.symbol, symbol),
          safeEq(userWatchlist.isActive, true)
        )
      );
      
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Symbol ${symbol} not found in watchlist or already removed`,
        });
      }
      
      watchlistLogger.info(`Removed ${symbol} from watchlist for user ${userId}`);
      
      return res.json({
        success: true,
        message: `Symbol ${symbol} removed from watchlist`,
        watchlistItem: result[0]
      });
    } catch (error) {
      watchlistLogger.error(`Error removing symbol from watchlist`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return res.status(500).json({
        success: false,
        message: "Failed to remove symbol from watchlist",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Update notes for a symbol in a user's watchlist
 * PATCH /api/market-data/watchlist/user/:userId/symbol/:symbol/notes
 */
router.patch(
  "/user/:userId/symbol/:symbol/notes",
  validateUserId,
  validateSymbol,
  validateUpdateNotes,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const symbol = req.params.symbol;
      const { notes } = req.validatedBody;
      
      watchlistLogger.info(`Updating notes for ${symbol} in watchlist for user ${userId}`);
      
      const result = await updateWhere(
        userWatchlist,
        { notes },
        and(
          safeEq(userWatchlist.userId, userId),
          safeEq(userWatchlist.symbol, symbol),
          safeEq(userWatchlist.isActive, true)
        )
      );
      
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Symbol ${symbol} not found in watchlist`,
        });
      }
      
      watchlistLogger.info(`Updated notes for ${symbol} in watchlist for user ${userId}`);
      
      return res.json({
        success: true,
        message: `Notes updated for ${symbol}`,
        watchlistItem: result[0]
      });
    } catch (error) {
      watchlistLogger.error(`Error updating notes for symbol in watchlist`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return res.status(500).json({
        success: false,
        message: "Failed to update notes",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Bulk add symbols to a user's watchlist
 * POST /api/market-data/watchlist/bulk-add
 */
router.post("/bulk-add", async (req, res) => {
  try {
    const body = req.body;
    const { userId, symbols } = body;
    
    if (!userId || !symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Required: userId and symbols array",
      });
    }
    
    watchlistLogger.info(`Bulk adding ${symbols.length} symbols to watchlist for user ${userId}`);
    
    const results = [];
    
    // Process each symbol
    for (const symbol of symbols) {
      const validSymbol = typeof symbol === 'string' ? symbol.toUpperCase() : null;
      
      if (!validSymbol) {
        results.push({
          symbol,
          status: 'error',
          message: 'Invalid symbol format'
        });
        continue;
      }
      
      try {
        // Check if symbol already exists for this user
        const existing = await selectWhere(
          userWatchlist,
          and(
            safeEq(userWatchlist.userId, userId),
            safeEq(userWatchlist.symbol, validSymbol)
          )
        );
        
        if (existing.length > 0) {
          // If it exists but is not active, reactivate it
          if (!existing[0].isActive) {
            const updated = await updateWhere(
              userWatchlist,
              { 
                isActive: true,
                addedAt: new Date()
              },
              and(
                safeEq(userWatchlist.userId, userId),
                safeEq(userWatchlist.symbol, validSymbol)
              )
            );
            
            results.push({
              symbol: validSymbol,
              status: 'reactivated',
              id: updated[0].id
            });
          } else {
            results.push({
              symbol: validSymbol,
              status: 'exists',
              id: existing[0].id
            });
          }
          continue;
        }
        
        // Insert the new watchlist item
        const result = await insertInto(
          userWatchlist,
          {
            userId,
            symbol: validSymbol,
            addedAt: new Date(),
            isActive: true
          }
        );
        
        results.push({
          symbol: validSymbol,
          status: 'added',
          id: result.id
        });
      } catch (error) {
        results.push({
          symbol: validSymbol,
          status: 'error',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Collect statistics
    const added = results.filter(r => r.status === 'added').length;
    const reactivated = results.filter(r => r.status === 'reactivated').length;
    const existed = results.filter(r => r.status === 'exists').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    watchlistLogger.info(`Bulk add complete. Added: ${added}, Reactivated: ${reactivated}, Already existed: ${existed}, Errors: ${errors}`);
    
    return res.json({
      success: true,
      message: `Processed ${symbols.length} symbols. Added: ${added}, Reactivated: ${reactivated}, Already existed: ${existed}, Errors: ${errors}`,
      results
    });
  } catch (error) {
    watchlistLogger.error("Error bulk adding symbols to watchlist", {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to bulk add symbols to watchlist",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Export the watchlist routes
export const watchlistRoutes = router; 
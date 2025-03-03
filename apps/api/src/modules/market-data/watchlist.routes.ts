import { Hono } from "hono";
import { logger } from "@repo/logger";
import { db } from "@repo/db";
import { userWatchlist } from "@repo/db/schema/index.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Create a module-specific logger
const watchlistLogger = logger.child({ module: "watchlist-routes" });

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

// Create a Hono app for the watchlist routes
const app = new Hono();

/**
 * Get all watchlist items for a user
 * GET /api/market-data/watchlist/user/:userId
 */
app.get("/user/:userId", zValidator("param", userIdParamSchema), async (c) => {
  try {
    const { userId } = c.req.valid("param");
    watchlistLogger.info(`Getting watchlist for user ${userId}`);
    
    const watchlistItems = await db
      .select()
      .from(userWatchlist)
      .where(and(
        eq(userWatchlist.userId, userId),
        eq(userWatchlist.isActive, true)
      ));
    
    return c.json({
      success: true,
      userId,
      watchlist: watchlistItems,
    });
  } catch (error) {
    watchlistLogger.error(`Error getting watchlist for user ${c.req.param("userId")}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return c.json({
      success: false,
      message: "Failed to get user watchlist",
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * Add a symbol to a user's watchlist
 * POST /api/market-data/watchlist/add
 */
app.post("/add", zValidator("json", addSymbolSchema), async (c) => {
  try {
    const { userId, symbol, notes } = await c.req.valid("json");
    watchlistLogger.info(`Adding ${symbol} to watchlist for user ${userId}`);
    
    // Check if symbol already exists for this user
    const existing = await db
      .select()
      .from(userWatchlist)
      .where(and(
        eq(userWatchlist.userId, userId),
        eq(userWatchlist.symbol, symbol)
      ));
    
    if (existing.length > 0) {
      // If it exists but is not active, reactivate it
      if (!existing[0].isActive) {
        await db
          .update(userWatchlist)
          .set({ 
            isActive: true,
            notes: notes || existing[0].notes,
            addedAt: new Date()
          })
          .where(and(
            eq(userWatchlist.userId, userId),
            eq(userWatchlist.symbol, symbol)
          ));
        
        watchlistLogger.info(`Reactivated ${symbol} in watchlist for user ${userId}`);
        
        return c.json({
          success: true,
          message: `Symbol ${symbol} reactivated in watchlist`,
          watchlistItem: {
            ...existing[0],
            isActive: true,
            notes: notes || existing[0].notes,
            addedAt: new Date()
          }
        });
      }
      
      return c.json({
        success: false,
        message: `Symbol ${symbol} already exists in watchlist`,
        watchlistItem: existing[0]
      }, 409);
    }
    
    // Insert the new watchlist item
    const result = await db
      .insert(userWatchlist)
      .values({
        userId,
        symbol,
        notes,
        addedAt: new Date(),
        isActive: true
      })
      .returning();
    
    watchlistLogger.info(`Added ${symbol} to watchlist for user ${userId}`);
    
    return c.json({
      success: true,
      message: `Symbol ${symbol} added to watchlist`,
      watchlistItem: result[0]
    });
  } catch (error) {
    watchlistLogger.error("Error adding symbol to watchlist", {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return c.json({
      success: false,
      message: "Failed to add symbol to watchlist",
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * Remove a symbol from a user's watchlist (soft delete)
 * DELETE /api/market-data/watchlist/user/:userId/symbol/:symbol
 */
app.delete(
  "/user/:userId/symbol/:symbol", 
  zValidator("param", userIdParamSchema),
  zValidator("param", symbolParamSchema),
  async (c) => {
    try {
      const { userId, symbol } = c.req.valid("param");
      watchlistLogger.info(`Removing ${symbol} from watchlist for user ${userId}`);
      
      // Soft delete by setting isActive to false
      const result = await db
        .update(userWatchlist)
        .set({ isActive: false })
        .where(and(
          eq(userWatchlist.userId, userId),
          eq(userWatchlist.symbol, symbol),
          eq(userWatchlist.isActive, true)
        ))
        .returning();
      
      if (result.length === 0) {
        return c.json({
          success: false,
          message: `Symbol ${symbol} not found in watchlist or already removed`,
        }, 404);
      }
      
      watchlistLogger.info(`Removed ${symbol} from watchlist for user ${userId}`);
      
      return c.json({
        success: true,
        message: `Symbol ${symbol} removed from watchlist`,
        watchlistItem: result[0]
      });
    } catch (error) {
      watchlistLogger.error(`Error removing symbol from watchlist`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return c.json({
        success: false,
        message: "Failed to remove symbol from watchlist",
        error: error instanceof Error ? error.message : String(error),
      }, 500);
    }
  }
);

/**
 * Update notes for a symbol in a user's watchlist
 * PATCH /api/market-data/watchlist/user/:userId/symbol/:symbol/notes
 */
app.patch(
  "/user/:userId/symbol/:symbol/notes",
  zValidator("param", userIdParamSchema),
  zValidator("param", symbolParamSchema),
  zValidator("json", updateNotesSchema),
  async (c) => {
    try {
      const { userId, symbol } = c.req.valid("param");
      const { notes } = await c.req.valid("json");
      
      watchlistLogger.info(`Updating notes for ${symbol} in watchlist for user ${userId}`);
      
      const result = await db
        .update(userWatchlist)
        .set({ notes })
        .where(and(
          eq(userWatchlist.userId, userId),
          eq(userWatchlist.symbol, symbol),
          eq(userWatchlist.isActive, true)
        ))
        .returning();
      
      if (result.length === 0) {
        return c.json({
          success: false,
          message: `Symbol ${symbol} not found in watchlist`,
        }, 404);
      }
      
      watchlistLogger.info(`Updated notes for ${symbol} in watchlist for user ${userId}`);
      
      return c.json({
        success: true,
        message: `Notes updated for ${symbol}`,
        watchlistItem: result[0]
      });
    } catch (error) {
      watchlistLogger.error(`Error updating notes for symbol in watchlist`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return c.json({
        success: false,
        message: "Failed to update notes for symbol",
        error: error instanceof Error ? error.message : String(error),
      }, 500);
    }
  }
);

/**
 * Bulk add symbols to a user's watchlist
 * POST /api/market-data/watchlist/bulk-add
 */
app.post("/bulk-add", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, symbols } = body;
    
    if (!userId || !symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return c.json({
        success: false,
        message: "Invalid request. Required: userId and symbols array",
      }, 400);
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
        const existing = await db
          .select()
          .from(userWatchlist)
          .where(and(
            eq(userWatchlist.userId, userId),
            eq(userWatchlist.symbol, validSymbol)
          ));
        
        if (existing.length > 0) {
          // If it exists but is not active, reactivate it
          if (!existing[0].isActive) {
            await db
              .update(userWatchlist)
              .set({ 
                isActive: true,
                addedAt: new Date()
              })
              .where(and(
                eq(userWatchlist.userId, userId),
                eq(userWatchlist.symbol, validSymbol)
              ));
            
            results.push({
              symbol: validSymbol,
              status: 'reactivated',
              id: existing[0].id
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
        const result = await db
          .insert(userWatchlist)
          .values({
            userId,
            symbol: validSymbol,
            addedAt: new Date(),
            isActive: true
          })
          .returning();
        
        results.push({
          symbol: validSymbol,
          status: 'added',
          id: result[0].id
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
    
    return c.json({
      success: true,
      message: `Processed ${symbols.length} symbols. Added: ${added}, Reactivated: ${reactivated}, Already existed: ${existed}, Errors: ${errors}`,
      results
    });
  } catch (error) {
    watchlistLogger.error("Error bulk adding symbols to watchlist", {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return c.json({
      success: false,
      message: "Failed to bulk add symbols to watchlist",
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

// Export the watchlist routes
export const watchlistRoutes = app; 
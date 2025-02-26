import { db, stockUpdates, NewStockUpdate } from "@repo/db";
import { generateId, IDPrefix } from "@repo/id";
import { logger } from "@repo/logger";
import { eq } from "drizzle-orm";

// Create a component-specific logger
const updateLogger = logger.child({ component: "updates-service" });

export const updatesService = {
  /**
   * Create a new stock update
   */
  async createStockUpdate(data: Omit<NewStockUpdate, "id" | "createdAt">): Promise<string> {
    try {
      updateLogger.info("Creating stock update", { ticker: data.ticker, eventType: data.eventType });
      
      const id = generateId(IDPrefix.STOCK_UPDATE);
      
      // Insert the stock update
      await db.insert(stockUpdates).values({
        id,
        ...data,
        createdAt: new Date(),
      });
      
      updateLogger.info("Created stock update", { id, ticker: data.ticker });
      
      return id;
    } catch (error) {
      updateLogger.error("Error creating stock update", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ticker: data.ticker 
      });
      
      throw error;
    }
  },
  
  /**
   * Get stock updates by ticker
   */
  async getStockUpdatesByTicker(ticker: string) {
    return db.select()
      .from(stockUpdates)
      .where(eq(stockUpdates.ticker, ticker))
      .orderBy(stockUpdates.createdAt);
  },
  
  /**
   * Get all stock updates (admin/testing purposes for Phase 1)
   */
  async getAllStockUpdates() {
    return db.select()
      .from(stockUpdates)
      .orderBy(stockUpdates.createdAt);
  },
}; 
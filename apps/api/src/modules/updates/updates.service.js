import { logger } from "@repo/logger";
import { generateId, IDPrefix } from "@repo/id";
import { db, stockUpdates } from "@repo/db";
import { eq } from "drizzle-orm";

// Create component logger
const serviceLogger = logger.child({ component: "updates-service" });

// Updates Service with mocked functions
export const updatesService = {
  /**
   * Create a stock update
   */
  async createStockUpdate(data) {
    serviceLogger.info("Creating stock update", { ticker: data.ticker, eventType: data.eventType });
    
    try {
      // Generate a unique ID
      const id = generateId(IDPrefix.UPDATE);
      const now = new Date();
      
      // Insert into database
      await db.insert(stockUpdates).values({
        id,
        ticker: data.ticker,
        eventType: data.eventType,
        title: data.title,
        content: data.content,
        details: data.details || null,
        source: data.source || null,
        createdAt: now,
      });
      
      serviceLogger.info("Successfully created stock update", { id, ticker: data.ticker });
      return id;
    } catch (error) {
      serviceLogger.error("Database error creating stock update", {
        error: error.message,
        stack: error.stack,
        ticker: data.ticker
      });
      throw error;
    }
  },
  
  /**
   * Get stock updates by ticker
   */
  async getStockUpdatesByTicker(ticker) {
    serviceLogger.info("Getting stock updates by ticker", { ticker });
    
    try {
      // Query database for updates matching the ticker
      const updates = await db
        .select()
        .from(stockUpdates)
        .where(eq(stockUpdates.ticker, ticker))
        .orderBy(stockUpdates.createdAt, "desc");
      
      serviceLogger.info(`Found ${updates.length} stock updates for ticker ${ticker}`);
      return updates;
    } catch (error) {
      serviceLogger.error("Database error fetching stock updates by ticker", {
        error: error.message,
        stack: error.stack,
        ticker
      });
      throw error;
    }
  },
  
  /**
   * Get all stock updates
   */
  async getAllStockUpdates() {
    serviceLogger.info("Getting all stock updates");
    
    try {
      // Query database for all updates, with a reasonable limit
      const updates = await db
        .select()
        .from(stockUpdates)
        .orderBy(stockUpdates.createdAt, "desc")
        .limit(100);
      
      serviceLogger.info(`Found ${updates.length} stock updates`);
      return updates;
    } catch (error) {
      serviceLogger.error("Database error fetching all stock updates", {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}; 
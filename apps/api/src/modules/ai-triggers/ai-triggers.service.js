import { logger } from "@repo/logger";
import { generateId, IDPrefix } from "@repo/id";
import { db, aiTriggers } from "@repo/db";
import { eq } from "drizzle-orm";

// Create component logger
const serviceLogger = logger.child({ component: "ai-triggers-service" });

// AI Triggers Service with mocked functions
export const aiTriggersService = {
  /**
   * Register an AI trigger event
   */
  async registerTrigger(data) {
    serviceLogger.info("Registering AI trigger", { ticker: data.ticker, eventType: data.event_type });
    
    try {
      // Generate a unique ID
      const id = generateId(IDPrefix.TRIGGER);
      const now = new Date();
      
      // Insert into database
      await db.insert(aiTriggers).values({
        id,
        ticker: data.ticker,
        eventType: data.event_type,
        details: data.details || null,
        source: data.source || null,
        timestamp: now,
        processed: "pending",
        processedAt: null,
      });
      
      serviceLogger.info("Successfully registered AI trigger", { id, ticker: data.ticker });
      return { id };
    } catch (error) {
      serviceLogger.error("Database error registering AI trigger", {
        error: error.message,
        stack: error.stack,
        ticker: data.ticker
      });
      throw error;
    }
  },
  
  /**
   * Get recent AI triggers by ticker
   */
  async getRecentTriggers(ticker) {
    serviceLogger.info("Getting recent triggers", { ticker });
    
    try {
      // Query database for triggers matching the ticker
      const triggers = await db
        .select()
        .from(aiTriggers)
        .where(eq(aiTriggers.ticker, ticker))
        .orderBy(aiTriggers.timestamp, "desc")
        .limit(20);
      
      serviceLogger.info(`Found ${triggers.length} AI triggers for ticker ${ticker}`);
      return triggers;
    } catch (error) {
      serviceLogger.error("Database error fetching AI triggers by ticker", {
        error: error.message,
        stack: error.stack,
        ticker
      });
      throw error;
    }
  },
  
  /**
   * Get all AI triggers
   */
  async getAllTriggers() {
    serviceLogger.info("Getting all triggers");
    
    try {
      // Query database for all triggers, with a reasonable limit
      const triggers = await db
        .select()
        .from(aiTriggers)
        .orderBy(aiTriggers.timestamp, "desc")
        .limit(50);
      
      serviceLogger.info(`Found ${triggers.length} AI triggers`);
      return triggers;
    } catch (error) {
      serviceLogger.error("Database error fetching all AI triggers", {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}; 
import { db, stockEvents, AITriggerPayload } from "@repo/db";
import { generateId, IDPrefix } from "@repo/id";
import { logger } from "@repo/logger";
import { notificationsService } from "../notifications/notifications.service";
import { eq } from "drizzle-orm";

// Create a component-specific logger
const triggerLogger = logger.child({ component: "ai-triggers-service" });

export const aiTriggersService = {
  /**
   * Process an AI trigger event
   */
  async processAITrigger(payload: AITriggerPayload, retries = 3): Promise<void> {
    try {
      triggerLogger.info("Processing AI trigger", { ticker: payload.ticker, eventType: payload.event_type });
      
      // Convert the AITriggerPayload to a StockEvent
      const { event_type: eventType, ticker, fund, shares, shares_value: sharesValue, investor, source, timestamp } = payload;
      
      // Insert the stock event
      await db.insert(stockEvents).values({
        id: generateId(IDPrefix.AI_TRIGGER),
        ticker,
        eventType,
        details: {
          fund,
          shares,
          sharesValue,
          investor,
          source,
        },
        source,
        timestamp: new Date(timestamp),
        processed: "pending",
      });
      
      // Find users who should be notified about this stock event
      // This is a placeholder for Phase 1 - will be expanded in Phase 2
      // For now, we just notify about all events
      await notificationsService.sendStockUpdateEmail(ticker, eventType, {
        fund,
        shares,
        sharesValue,
        investor,
        source,
        timestamp,
      });
      
      triggerLogger.info("AI trigger processed successfully", { ticker, eventType });
    } catch (error) {
      if (retries > 0) {
        const retryDelay = 1000 * (4 - retries); // Exponential backoff: 3s, 2s, 1s
        triggerLogger.warn(`Failed to process AI trigger, retrying in ${retryDelay/1000}s`, { 
          error: error instanceof Error ? error.message : String(error),
          payload, 
          retries 
        });
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.processAITrigger(payload, retries - 1);
      }
      
      triggerLogger.error("Failed to process AI trigger after multiple retries", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload 
      });
      
      throw error;
    }
  },
  
  /**
   * Get all AI triggers for a specific ticker
   */
  async getAITriggersByTicker(ticker: string) {
    return db.select().from(stockEvents).where(eq(stockEvents.ticker, ticker));
  },
}; 
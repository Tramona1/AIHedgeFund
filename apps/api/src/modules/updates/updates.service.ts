import { db } from "@repo/db";
import { generateId, IDPrefix } from "@repo/id";
import { createComponentLogger } from "@repo/logger";
import { selectWhere, insertInto, selectAll, safeEq } from "../../lib/db-helpers.js";

// Get the schema tables from the DB instance
const { stockUpdates } = db._.schema;

// Define the NewStockUpdate type locally
interface NewStockUpdate {
  id?: string;
  ticker: string;
  eventType: string;
  title: string;
  content: string;
  details?: any;
  source: string;
  createdAt?: Date;
  sentAt?: Date | null;
  symbol?: string;
}

// Create a component-specific logger
const updateLogger = createComponentLogger("updates-service");

export const updatesService = {
  /**
   * Create a new stock update and store it in the database
   */
  async createStockUpdate(data: Omit<NewStockUpdate, "id" | "createdAt">): Promise<string> {
    try {
      const id = generateId(IDPrefix.STOCK_UPDATE);
      const now = new Date();
      
      await insertInto(
        stockUpdates,
        {
          id,
          ...data,
          createdAt: now,
        }
      );
      
      updateLogger.info("Created stock update", { id, symbol: data.symbol });
      
      return id;
    } catch (error) {
      updateLogger.error("Error creating stock update", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        symbol: data.symbol 
      });
      
      throw error;
    }
  },
  
  /**
   * Get stock updates by ticker
   */
  async getStockUpdatesByTicker(ticker: string) {
    return selectWhere(
      stockUpdates,
      ticker ? safeEq(stockUpdates['symbol' as keyof typeof stockUpdates] as any, ticker) : undefined
    );
  },
  
  /**
   * Get all stock updates (admin/testing purposes for Phase 1)
   */
  async getAllStockUpdates() {
    return selectAll(stockUpdates);
  },
}; 
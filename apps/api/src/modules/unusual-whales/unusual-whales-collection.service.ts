import { logger } from "@repo/logger";
import { db } from "../../lib/db.js";
import { optionsFlow, darkPoolData } from "@repo/db/schema/unusual-whales.js";
import { sql, and, desc, eq, gte, lte, like } from "drizzle-orm";
import { DrizzleError } from "drizzle-orm";

// Create a module-specific logger
const whalesLogger = logger.child({ module: "unusual-whales-collection-service" });

// Filter interfaces
interface OptionsFlowFilter {
  minVolume?: number;
  ticker?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  dateFrom?: string;
  dateTo?: string;
}

interface DarkPoolFilter {
  minVolume?: number;
  ticker?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Response interfaces
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Service for accessing stored Unusual Whales data
 */
class UnusualWhalesCollectionService {
  /**
   * Get options flow data with pagination and filtering
   */
  async getOptionsFlow(
    page: number = 1,
    pageSize: number = 20,
    filter: OptionsFlowFilter = {}
  ): Promise<PaginatedResponse<typeof optionsFlow.$inferSelect>> {
    try {
      whalesLogger.info("Getting options flow data from database", { page, pageSize, filter });
      
      const offset = (page - 1) * pageSize;
      
      // Build the WHERE conditions based on filters
      const conditions = [];
      
      if (filter.minVolume) {
        conditions.push(gte(optionsFlow.volume, filter.minVolume));
      }
      
      if (filter.ticker) {
        conditions.push(like(optionsFlow.ticker, `%${filter.ticker.toUpperCase()}%`));
      }
      
      if (filter.sentiment) {
        conditions.push(eq(optionsFlow.sentiment, filter.sentiment));
      }
      
      if (filter.dateFrom) {
        conditions.push(gte(optionsFlow.timestamp, new Date(filter.dateFrom)));
      }
      
      if (filter.dateTo) {
        conditions.push(lte(optionsFlow.timestamp, new Date(filter.dateTo)));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      // Get total count for pagination
      const countResult = await db.select({
        count: sql<number>`count(*)`
      })
      .from(optionsFlow)
      .where(whereClause);
      
      const totalCount = countResult[0]?.count || 0;
      
      // Get data with pagination
      const data = await db.select()
        .from(optionsFlow)
        .where(whereClause)
        .orderBy(desc(optionsFlow.timestamp))
        .limit(pageSize)
        .offset(offset);
      
      return {
        data,
        totalCount,
        page,
        pageSize
      };
    } catch (error) {
      whalesLogger.error("Error getting options flow data from database", {
        error: error instanceof DrizzleError ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get dark pool data with pagination and filtering
   */
  async getDarkPoolData(
    page: number = 1,
    pageSize: number = 20,
    filter: DarkPoolFilter = {}
  ): Promise<PaginatedResponse<typeof darkPoolData.$inferSelect>> {
    try {
      whalesLogger.info("Getting dark pool data from database", { page, pageSize, filter });
      
      const offset = (page - 1) * pageSize;
      
      // Build the WHERE conditions based on filters
      const conditions = [];
      
      if (filter.minVolume) {
        conditions.push(gte(darkPoolData.volume, filter.minVolume));
      }
      
      if (filter.ticker) {
        conditions.push(like(darkPoolData.ticker, `%${filter.ticker.toUpperCase()}%`));
      }
      
      if (filter.dateFrom) {
        conditions.push(gte(darkPoolData.timestamp, new Date(filter.dateFrom)));
      }
      
      if (filter.dateTo) {
        conditions.push(lte(darkPoolData.timestamp, new Date(filter.dateTo)));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      // Get total count for pagination
      const countResult = await db.select({
        count: sql<number>`count(*)`
      })
      .from(darkPoolData)
      .where(whereClause);
      
      const totalCount = countResult[0]?.count || 0;
      
      // Get data with pagination
      const data = await db.select()
        .from(darkPoolData)
        .where(whereClause)
        .orderBy(desc(darkPoolData.timestamp))
        .limit(pageSize)
        .offset(offset);
      
      return {
        data,
        totalCount,
        page,
        pageSize
      };
    } catch (error) {
      whalesLogger.error("Error getting dark pool data from database", {
        error: error instanceof DrizzleError ? error.message : String(error)
      });
      throw error;
    }
  }
}

// Export as singleton
export const unusualWhalesCollectionService = new UnusualWhalesCollectionService(); 
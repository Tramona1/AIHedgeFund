import { db } from "@repo/db";
import { logger } from "@repo/logger";
import { 
  userPortfolio, 
  portfolioPosition, 
  portfolioTransaction, 
  portfolioPerformance,
  stockData
} from "@repo/db/schema/portfolio.js";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Create a module-specific logger
const portfolioLogger = logger.child({ module: "portfolio-service" });

/**
 * Service to manage user portfolios
 */
export class PortfolioService {
  /**
   * Get all portfolios for a user
   */
  async getUserPortfolios(userId: string) {
    try {
      portfolioLogger.info(`Fetching portfolios for user ${userId}`);
      
      const portfolios = await db
        .select()
        .from(userPortfolio)
        .where(and(
          eq(userPortfolio.userId, userId),
          eq(userPortfolio.isActive, true)
        ))
        .orderBy(desc(userPortfolio.updatedAt));
      
      return portfolios;
    } catch (error) {
      portfolioLogger.error(`Error fetching portfolios for user ${userId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get a single portfolio by ID
   */
  async getPortfolio(portfolioId: string) {
    try {
      portfolioLogger.info(`Fetching portfolio ${portfolioId}`);
      
      const [portfolio] = await db
        .select()
        .from(userPortfolio)
        .where(eq(userPortfolio.id, portfolioId));
      
      if (!portfolio) {
        throw new Error(`Portfolio ${portfolioId} not found`);
      }
      
      return portfolio;
    } catch (error) {
      portfolioLogger.error(`Error fetching portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Create a new portfolio for a user
   */
  async createPortfolio(userId: string, data: { name: string, description?: string, isDefault?: boolean }) {
    try {
      portfolioLogger.info(`Creating portfolio for user ${userId}`);
      
      // Check if this is the first portfolio - make it default if so
      const existingPortfolios = await this.getUserPortfolios(userId);
      const makeDefault = data.isDefault || existingPortfolios.length === 0;
      
      // If making this the default, unset any existing default
      if (makeDefault) {
        await db
          .update(userPortfolio)
          .set({ isDefault: false })
          .where(eq(userPortfolio.userId, userId));
      }
      
      const [portfolio] = await db
        .insert(userPortfolio)
        .values({
          userId,
          name: data.name,
          description: data.description || null,
          isDefault: makeDefault,
        })
        .returning();
      
      portfolioLogger.info(`Created portfolio ${portfolio.id} for user ${userId}`);
      
      return portfolio;
    } catch (error) {
      portfolioLogger.error(`Error creating portfolio for user ${userId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Update a portfolio
   */
  async updatePortfolio(portfolioId: string, data: { name?: string, description?: string, isDefault?: boolean }) {
    try {
      portfolioLogger.info(`Updating portfolio ${portfolioId}`);
      
      const portfolio = await this.getPortfolio(portfolioId);
      
      // If making this the default, unset any existing default
      if (data.isDefault) {
        await db
          .update(userPortfolio)
          .set({ isDefault: false })
          .where(eq(userPortfolio.userId, portfolio.userId));
      }
      
      const [updatedPortfolio] = await db
        .update(userPortfolio)
        .set({
          name: data.name || portfolio.name,
          description: data.description !== undefined ? data.description : portfolio.description,
          isDefault: data.isDefault !== undefined ? data.isDefault : portfolio.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(userPortfolio.id, portfolioId))
        .returning();
      
      portfolioLogger.info(`Updated portfolio ${portfolioId}`);
      
      return updatedPortfolio;
    } catch (error) {
      portfolioLogger.error(`Error updating portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Delete a portfolio
   */
  async deletePortfolio(portfolioId: string) {
    try {
      portfolioLogger.info(`Deleting portfolio ${portfolioId}`);
      
      const portfolio = await this.getPortfolio(portfolioId);
      
      // Soft delete - just mark as inactive
      const [deletedPortfolio] = await db
        .update(userPortfolio)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(userPortfolio.id, portfolioId))
        .returning();
      
      // If this was the default portfolio, set another one as default
      if (portfolio.isDefault) {
        const activePortfolios = await db
          .select()
          .from(userPortfolio)
          .where(and(
            eq(userPortfolio.userId, portfolio.userId),
            eq(userPortfolio.isActive, true)
          ));
        
        if (activePortfolios.length > 0) {
          await db
            .update(userPortfolio)
            .set({ isDefault: true })
            .where(eq(userPortfolio.id, activePortfolios[0].id));
        }
      }
      
      portfolioLogger.info(`Deleted portfolio ${portfolioId}`);
      
      return deletedPortfolio;
    } catch (error) {
      portfolioLogger.error(`Error deleting portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get positions for a portfolio
   */
  async getPortfolioPositions(portfolioId: string) {
    try {
      portfolioLogger.info(`Fetching positions for portfolio ${portfolioId}`);
      
      const positions = await db
        .select()
        .from(portfolioPosition)
        .where(and(
          eq(portfolioPosition.portfolioId, portfolioId),
          eq(portfolioPosition.isActive, true)
        ));
      
      return positions;
    } catch (error) {
      portfolioLogger.error(`Error fetching positions for portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get a single position by ID
   */
  async getPosition(positionId: string) {
    try {
      portfolioLogger.info(`Fetching position ${positionId}`);
      
      const [position] = await db
        .select()
        .from(portfolioPosition)
        .where(eq(portfolioPosition.id, positionId));
      
      if (!position) {
        throw new Error(`Position ${positionId} not found`);
      }
      
      return position;
    } catch (error) {
      portfolioLogger.error(`Error fetching position ${positionId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Add a position to a portfolio
   */
  async addPosition(portfolioId: string, data: { 
    symbol: string, 
    quantity: number, 
    averageCost: number,
    notes?: string
  }) {
    try {
      portfolioLogger.info(`Adding position to portfolio ${portfolioId}`);
      
      // Fetch current price
      const [stockPrice] = await db
        .select({
          price: stockData.price
        })
        .from(stockData)
        .where(eq(stockData.symbol, data.symbol.toUpperCase()));
      
      const currentPrice = stockPrice?.price || data.averageCost;
      const costBasis = data.quantity * data.averageCost;
      const currentValue = data.quantity * currentPrice;
      const unrealizedGain = currentValue - costBasis;
      const unrealizedGainPercent = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;
      
      const [position] = await db
        .insert(portfolioPosition)
        .values({
          portfolioId,
          symbol: data.symbol.toUpperCase(),
          quantity: data.quantity.toString(),
          averageCost: data.averageCost.toString(),
          currentPrice: currentPrice.toString(),
          currentValue: currentValue.toString(),
          costBasis: costBasis.toString(),
          unrealizedGain: unrealizedGain.toString(),
          unrealizedGainPercent: unrealizedGainPercent.toString(),
          notes: data.notes || null,
        })
        .returning();
      
      portfolioLogger.info(`Added position ${position.id} to portfolio ${portfolioId}`);
      
      // Record the transaction
      await this.recordTransaction({
        portfolioId,
        positionId: position.id,
        type: 'buy',
        symbol: data.symbol.toUpperCase(),
        quantity: data.quantity,
        price: data.averageCost,
      });
      
      // Update portfolio performance
      await this.updatePortfolioPerformance(portfolioId);
      
      return position;
    } catch (error) {
      portfolioLogger.error(`Error adding position to portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Update a position
   */
  async updatePosition(positionId: string, data: { 
    quantity?: number, 
    averageCost?: number,
    notes?: string
  }) {
    try {
      portfolioLogger.info(`Updating position ${positionId}`);
      
      const position = await this.getPosition(positionId);
      
      // Calculate new values
      const quantity = data.quantity !== undefined ? data.quantity : parseFloat(position.quantity.toString());
      const averageCost = data.averageCost !== undefined ? data.averageCost : parseFloat(position.averageCost.toString());
      
      // Fetch current price
      const [stockPrice] = await db
        .select({
          price: stockData.price
        })
        .from(stockData)
        .where(eq(stockData.symbol, position.symbol));
      
      const currentPrice = stockPrice?.price || averageCost;
      const costBasis = quantity * averageCost;
      const currentValue = quantity * currentPrice;
      const unrealizedGain = currentValue - costBasis;
      const unrealizedGainPercent = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;
      
      const [updatedPosition] = await db
        .update(portfolioPosition)
        .set({
          quantity: quantity.toString(),
          averageCost: averageCost.toString(),
          currentPrice: currentPrice.toString(),
          currentValue: currentValue.toString(),
          costBasis: costBasis.toString(),
          unrealizedGain: unrealizedGain.toString(),
          unrealizedGainPercent: unrealizedGainPercent.toString(),
          notes: data.notes !== undefined ? data.notes : position.notes,
          updatedAt: new Date(),
        })
        .where(eq(portfolioPosition.id, positionId))
        .returning();
      
      portfolioLogger.info(`Updated position ${positionId}`);
      
      // Update portfolio performance
      await this.updatePortfolioPerformance(position.portfolioId);
      
      return updatedPosition;
    } catch (error) {
      portfolioLogger.error(`Error updating position ${positionId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Remove a position from a portfolio
   */
  async removePosition(positionId: string) {
    try {
      portfolioLogger.info(`Removing position ${positionId}`);
      
      const position = await this.getPosition(positionId);
      
      // Soft delete - mark as inactive
      const [removedPosition] = await db
        .update(portfolioPosition)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(portfolioPosition.id, positionId))
        .returning();
      
      portfolioLogger.info(`Removed position ${positionId}`);
      
      // Record the sell transaction
      await this.recordTransaction({
        portfolioId: position.portfolioId,
        positionId,
        type: 'sell',
        symbol: position.symbol,
        quantity: parseFloat(position.quantity.toString()),
        price: parseFloat(position.currentPrice?.toString() || position.averageCost.toString()),
      });
      
      // Update portfolio performance
      await this.updatePortfolioPerformance(position.portfolioId);
      
      return removedPosition;
    } catch (error) {
      portfolioLogger.error(`Error removing position ${positionId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Record a transaction
   */
  async recordTransaction(data: { 
    portfolioId: string, 
    positionId: string,
    type: string, 
    symbol: string, 
    quantity: number, 
    price: number,
    fees?: number,
    notes?: string,
    transactionDate?: Date
  }) {
    try {
      const totalValue = data.quantity * data.price;
      
      const [transaction] = await db
        .insert(portfolioTransaction)
        .values({
          portfolioId: data.portfolioId,
          positionId: data.positionId,
          type: data.type,
          symbol: data.symbol,
          quantity: data.quantity.toString(),
          price: data.price.toString(),
          totalValue: totalValue.toString(),
          fees: data.fees?.toString() || "0",
          notes: data.notes || null,
          transactionDate: data.transactionDate || new Date(),
        })
        .returning();
      
      return transaction;
    } catch (error) {
      portfolioLogger.error(`Error recording transaction`, { 
        error: error instanceof Error ? error.message : String(error),
        data
      });
      
      throw error;
    }
  }
  
  /**
   * Get transactions for a portfolio
   */
  async getPortfolioTransactions(portfolioId: string) {
    try {
      portfolioLogger.info(`Fetching transactions for portfolio ${portfolioId}`);
      
      const transactions = await db
        .select()
        .from(portfolioTransaction)
        .where(eq(portfolioTransaction.portfolioId, portfolioId))
        .orderBy(desc(portfolioTransaction.transactionDate));
      
      return transactions;
    } catch (error) {
      portfolioLogger.error(`Error fetching transactions for portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Update current prices and performance metrics for all positions in a portfolio
   */
  async updatePortfolioPrices(portfolioId: string) {
    try {
      portfolioLogger.info(`Updating prices for portfolio ${portfolioId}`);
      
      const positions = await this.getPortfolioPositions(portfolioId);
      
      // Get all unique symbols
      const symbols = [...new Set(positions.map(p => p.symbol))];
      
      // Fetch current prices
      const stockPrices = await db
        .select({
          symbol: stockData.symbol,
          price: stockData.price
        })
        .from(stockData)
        .where(sql`${stockData.symbol} IN (${symbols.join(',')})`);
      
      // Create a map of symbols to prices
      const priceMap = new Map();
      stockPrices.forEach(sp => priceMap.set(sp.symbol, sp.price));
      
      // Update each position
      for (const position of positions) {
        const currentPrice = priceMap.get(position.symbol) || parseFloat(position.averageCost.toString());
        const quantity = parseFloat(position.quantity.toString());
        const averageCost = parseFloat(position.averageCost.toString());
        const costBasis = quantity * averageCost;
        const currentValue = quantity * currentPrice;
        const unrealizedGain = currentValue - costBasis;
        const unrealizedGainPercent = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;
        
        await db
          .update(portfolioPosition)
          .set({
            currentPrice: currentPrice.toString(),
            currentValue: currentValue.toString(),
            unrealizedGain: unrealizedGain.toString(),
            unrealizedGainPercent: unrealizedGainPercent.toString(),
            updatedAt: new Date(),
          })
          .where(eq(portfolioPosition.id, position.id));
      }
      
      portfolioLogger.info(`Updated prices for portfolio ${portfolioId}`);
      
      // Update portfolio performance
      await this.updatePortfolioPerformance(portfolioId);
      
      return true;
    } catch (error) {
      portfolioLogger.error(`Error updating prices for portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Update portfolio performance metrics
   */
  async updatePortfolioPerformance(portfolioId: string) {
    try {
      portfolioLogger.info(`Updating performance for portfolio ${portfolioId}`);
      
      const positions = await this.getPortfolioPositions(portfolioId);
      
      // Calculate total portfolio value and metrics
      let totalValue = 0;
      let costBasis = 0;
      
      positions.forEach(p => {
        const currentValue = parseFloat(p.currentValue?.toString() || "0");
        const positionCostBasis = parseFloat(p.costBasis?.toString() || "0");
        
        totalValue += currentValue;
        costBasis += positionCostBasis;
      });
      
      // Get previous day's performance
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const [prevPerformance] = await db
        .select()
        .from(portfolioPerformance)
        .where(and(
          eq(portfolioPerformance.portfolioId, portfolioId),
          sql`DATE(${portfolioPerformance.date}) = DATE(${yesterday})`
        ))
        .orderBy(desc(portfolioPerformance.createdAt))
        .limit(1);
      
      // Calculate day change
      const prevValue = prevPerformance ? parseFloat(prevPerformance.totalValue.toString()) : totalValue;
      const dayChange = totalValue - prevValue;
      const dayChangePercent = prevValue > 0 ? (dayChange / prevValue) * 100 : 0;
      
      // Calculate total gain
      const totalGain = totalValue - costBasis;
      const totalGainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;
      
      // Create performance record
      const [performance] = await db
        .insert(portfolioPerformance)
        .values({
          portfolioId,
          totalValue: totalValue.toString(),
          costBasis: costBasis.toString(),
          dayChange: dayChange.toString(),
          dayChangePercent: dayChangePercent.toString(),
          totalGain: totalGain.toString(),
          totalGainPercent: totalGainPercent.toString(),
          stockValue: totalValue.toString(),
          numPositions: positions.length,
        })
        .returning();
      
      portfolioLogger.info(`Updated performance for portfolio ${portfolioId}`);
      
      return performance;
    } catch (error) {
      portfolioLogger.error(`Error updating performance for portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Get performance history for a portfolio
   */
  async getPortfolioPerformanceHistory(portfolioId: string, days: number = 30) {
    try {
      portfolioLogger.info(`Fetching performance history for portfolio ${portfolioId}`);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const performances = await db
        .select()
        .from(portfolioPerformance)
        .where(and(
          eq(portfolioPerformance.portfolioId, portfolioId),
          sql`${portfolioPerformance.date} >= ${startDate}`
        ))
        .orderBy(desc(portfolioPerformance.date));
      
      return performances;
    } catch (error) {
      portfolioLogger.error(`Error fetching performance history for portfolio ${portfolioId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
}

// Export a singleton instance
export const portfolioService = new PortfolioService(); 
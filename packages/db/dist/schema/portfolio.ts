import { pgTable, text, uuid, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * User portfolio table - stores user portfolio information
 */
export const userPortfolio = pgTable("user_portfolio", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Portfolio position table - stores positions within portfolios
 */
export const portfolioPosition = pgTable("portfolio_position", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => userPortfolio.id).notNull(),
  symbol: text("symbol").notNull(),
  quantity: decimal("quantity").notNull(),
  averageCost: decimal("average_cost").notNull(),
  currentPrice: decimal("current_price"),
  currentValue: decimal("current_value"),
  costBasis: decimal("cost_basis"),
  unrealizedGain: decimal("unrealized_gain"),
  unrealizedGainPercent: decimal("unrealized_gain_percent"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Transaction history table - stores buy/sell transactions
 */
export const portfolioTransaction = pgTable("portfolio_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => userPortfolio.id).notNull(),
  positionId: uuid("position_id").references(() => portfolioPosition.id).notNull(),
  type: text("type").notNull(), // 'buy', 'sell', 'dividend', etc.
  symbol: text("symbol").notNull(),
  quantity: decimal("quantity").notNull(),
  price: decimal("price").notNull(),
  totalValue: decimal("total_value").notNull(),
  fees: decimal("fees").default("0").notNull(),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Portfolio performance table - stores snapshots of portfolio performance
 */
export const portfolioPerformance = pgTable("portfolio_performance", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id").references(() => userPortfolio.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  totalValue: decimal("total_value").notNull(),
  costBasis: decimal("cost_basis").notNull(), 
  dayChange: decimal("day_change"),
  dayChangePercent: decimal("day_change_percent"),
  totalGain: decimal("total_gain"),
  totalGainPercent: decimal("total_gain_percent"),
  cash: decimal("cash").default("0"),
  stockValue: decimal("stock_value"),
  numPositions: integer("num_positions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserPortfolioSchema = createInsertSchema(userPortfolio);
export const selectUserPortfolioSchema = createSelectSchema(userPortfolio);

export const insertPortfolioPositionSchema = createInsertSchema(portfolioPosition);
export const selectPortfolioPositionSchema = createSelectSchema(portfolioPosition);

export const insertPortfolioTransactionSchema = createInsertSchema(portfolioTransaction);
export const selectPortfolioTransactionSchema = createSelectSchema(portfolioTransaction);

export const insertPortfolioPerformanceSchema = createInsertSchema(portfolioPerformance);
export const selectPortfolioPerformanceSchema = createSelectSchema(portfolioPerformance); 
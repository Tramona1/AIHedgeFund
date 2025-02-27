import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define the stock updates table
export const stockUpdates = pgTable("stock_updates", {
  id: text("id").primaryKey(),
  ticker: text("ticker").notNull(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  details: jsonb("details"),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});

// Create Zod schemas for validation
export const insertStockUpdateSchema = createInsertSchema(stockUpdates, {
  eventType: z.enum([
    "hedge_fund_buy",
    "hedge_fund_sell",
    "investor_mention",
    "market_shift",
    "technical_signal",
    "option_flow",
    "dark_pool_buy",
    "politician_buy",
    "politician_sell"
  ]),
  details: z.record(z.string(), z.any()).optional(),
});

export const selectStockUpdateSchema = createSelectSchema(stockUpdates);

// Type definitions
export type StockUpdate = typeof stockUpdates.$inferSelect;
export type NewStockUpdate = typeof stockUpdates.$inferInsert; 
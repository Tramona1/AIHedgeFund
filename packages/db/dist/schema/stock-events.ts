import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define the stock events table for AI triggers
export const stockEvents = pgTable("stock_events", {
  id: text("id").primaryKey(),
  ticker: text("ticker").notNull(),
  eventType: text("event_type").notNull(),
  details: jsonb("details"),
  source: text("source"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processed: text("processed").default("pending").notNull(),
  processedAt: timestamp("processed_at"),
});

// Create Zod schemas for validation
export const insertStockEventSchema = createInsertSchema(stockEvents, {
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
  processed: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
});

export const selectStockEventSchema = createSelectSchema(stockEvents);

// Type definitions
export type StockEvent = typeof stockEvents.$inferSelect;
export type NewStockEvent = typeof stockEvents.$inferInsert; 
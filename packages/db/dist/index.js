var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// src/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  insertStockEventSchema: () => insertStockEventSchema,
  insertStockUpdateSchema: () => insertStockUpdateSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  selectStockEventSchema: () => selectStockEventSchema,
  selectStockUpdateSchema: () => selectStockUpdateSchema,
  selectUserPreferencesSchema: () => selectUserPreferencesSchema,
  stockEvents: () => stockEvents,
  stockUpdates: () => stockUpdates,
  userPreferences: () => userPreferences
});

// src/schema/user-preferences.ts
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
var userPreferences = pgTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  tickers: text("tickers").array(),
  sectors: text("sectors").array(),
  tradingStyle: text("trading_style"),
  updateFrequency: text("update_frequency").default("weekly").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  customTriggers: jsonb("custom_triggers")
});
var insertUserPreferencesSchema = createInsertSchema(userPreferences, {
  tickers: z.array(z.string()).optional(),
  sectors: z.array(z.string()).optional(),
  tradingStyle: z.string().optional(),
  updateFrequency: z.enum(["daily", "weekly", "realtime"]).default("weekly"),
  customTriggers: z.record(z.string(), z.any()).optional()
});
var selectUserPreferencesSchema = createSelectSchema(userPreferences);

// src/schema/stock-updates.ts
import { pgTable as pgTable2, text as text2, timestamp as timestamp2, jsonb as jsonb2 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema2, createSelectSchema as createSelectSchema2 } from "drizzle-zod";
import { z as z2 } from "zod";
var stockUpdates = pgTable2("stock_updates", {
  id: text2("id").primaryKey(),
  ticker: text2("ticker").notNull(),
  eventType: text2("event_type").notNull(),
  title: text2("title").notNull(),
  content: text2("content").notNull(),
  details: jsonb2("details"),
  source: text2("source"),
  createdAt: timestamp2("created_at").defaultNow().notNull(),
  sentAt: timestamp2("sent_at")
});
var insertStockUpdateSchema = createInsertSchema2(stockUpdates, {
  eventType: z2.enum([
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
  details: z2.record(z2.string(), z2.any()).optional()
});
var selectStockUpdateSchema = createSelectSchema2(stockUpdates);

// src/schema/stock-events.ts
import { pgTable as pgTable3, text as text3, timestamp as timestamp3, jsonb as jsonb3 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema3, createSelectSchema as createSelectSchema3 } from "drizzle-zod";
import { z as z3 } from "zod";
var stockEvents = pgTable3("stock_events", {
  id: text3("id").primaryKey(),
  ticker: text3("ticker").notNull(),
  eventType: text3("event_type").notNull(),
  details: jsonb3("details"),
  source: text3("source"),
  timestamp: timestamp3("timestamp").defaultNow().notNull(),
  processed: text3("processed").default("pending").notNull(),
  processedAt: timestamp3("processed_at")
});
var insertStockEventSchema = createInsertSchema3(stockEvents, {
  eventType: z3.enum([
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
  details: z3.record(z3.string(), z3.any()).optional(),
  processed: z3.enum(["pending", "processing", "completed", "failed"]).default("pending")
});
var selectStockEventSchema = createSelectSchema3(stockEvents);

// src/types.ts
import { z as z4 } from "zod";
var aiTriggerPayloadSchema = z4.object({
  event_type: z4.enum([
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
  ticker: z4.string(),
  fund: z4.string().optional(),
  shares: z4.number().int().optional(),
  shares_value: z4.number().optional(),
  investor: z4.string().optional(),
  source: z4.string().optional(),
  timestamp: z4.string().datetime(),
  details: z4.record(z4.string(), z4.any()).optional()
});

// src/index.ts
var client = postgres(process.env.DATABASE_URL || "");
var db = drizzle(client, { schema: schema_exports });
var index_default = db;
export {
  aiTriggerPayloadSchema,
  db,
  index_default as default,
  insertStockEventSchema,
  insertStockUpdateSchema,
  insertUserPreferencesSchema,
  selectStockEventSchema,
  selectStockUpdateSchema,
  selectUserPreferencesSchema,
  stockEvents,
  stockUpdates,
  userPreferences
};
//# sourceMappingURL=index.js.map
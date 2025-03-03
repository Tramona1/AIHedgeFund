import { pgTable, text, timestamp, numeric, jsonb, index, date, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Options Flow data from Unusual Whales API
 */
export const optionsFlow = pgTable(
  "options_flow",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol").notNull(),
    dateTime: timestamp("date_time").notNull(),
    strike: numeric("strike").notNull(),
    expirationDate: date("expiration_date").notNull(),
    volume: integer("volume").notNull(),
    openInterest: integer("open_interest"),
    premium: numeric("premium"),
    contractType: text("contract_type").notNull(), // 'CALL' or 'PUT'
    sentiment: text("sentiment"), // 'BULLISH', 'BEARISH', 'NEUTRAL'
    unusualScore: numeric("unusual_score"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      symbolIndex: index("options_flow_symbol_idx").on(table.symbol),
      dateTimeIndex: index("options_flow_date_time_idx").on(table.dateTime),
    };
  }
);

/**
 * Dark Pool data from Unusual Whales API
 */
export const darkPoolData = pgTable(
  "dark_pool_data",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol").notNull(),
    dateTime: timestamp("date_time").notNull(),
    volume: integer("volume").notNull(),
    price: numeric("price").notNull(),
    exchangeCode: text("exchange_code"),
    isBlockTrade: boolean("is_block_trade"),
    significance: numeric("significance"), // How significant the dark pool activity is
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      symbolIndex: index("dark_pool_symbol_idx").on(table.symbol),
      dateTimeIndex: index("dark_pool_date_time_idx").on(table.dateTime),
    };
  }
);

// Create zod schemas for type safety and validation
export const insertOptionsFlowSchema = createInsertSchema(optionsFlow);
export const selectOptionsFlowSchema = createSelectSchema(optionsFlow);

export const insertDarkPoolDataSchema = createInsertSchema(darkPoolData);
export const selectDarkPoolDataSchema = createSelectSchema(darkPoolData);

// Export types
export type OptionsFlow = typeof optionsFlow.$inferSelect;
export type NewOptionsFlow = typeof optionsFlow.$inferInsert;

export type DarkPoolData = typeof darkPoolData.$inferSelect;
export type NewDarkPoolData = typeof darkPoolData.$inferInsert;

// Backward compatibility aliases
export const darkPool = darkPoolData; 
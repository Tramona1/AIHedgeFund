"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectStockEventSchema = exports.insertStockEventSchema = exports.stockEvents = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// Define the stock events table for AI triggers
exports.stockEvents = (0, pg_core_1.pgTable)("stock_events", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    ticker: (0, pg_core_1.text)("ticker").notNull(),
    eventType: (0, pg_core_1.text)("event_type").notNull(),
    details: (0, pg_core_1.jsonb)("details"),
    source: (0, pg_core_1.text)("source"),
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
    processed: (0, pg_core_1.text)("processed").default("pending").notNull(),
    processedAt: (0, pg_core_1.timestamp)("processed_at"),
});
// Create Zod schemas for validation
exports.insertStockEventSchema = (0, drizzle_zod_1.createInsertSchema)(exports.stockEvents, {
    eventType: zod_1.z.enum([
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
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    processed: zod_1.z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
});
exports.selectStockEventSchema = (0, drizzle_zod_1.createSelectSchema)(exports.stockEvents);

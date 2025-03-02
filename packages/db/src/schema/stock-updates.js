"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectStockUpdateSchema = exports.insertStockUpdateSchema = exports.stockUpdates = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// Define the stock updates table
exports.stockUpdates = (0, pg_core_1.pgTable)("stock_updates", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    ticker: (0, pg_core_1.text)("ticker").notNull(),
    eventType: (0, pg_core_1.text)("event_type").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    details: (0, pg_core_1.jsonb)("details"),
    source: (0, pg_core_1.text)("source"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    sentAt: (0, pg_core_1.timestamp)("sent_at"),
});
// Create Zod schemas for validation
exports.insertStockUpdateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.stockUpdates, {
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
});
exports.selectStockUpdateSchema = (0, drizzle_zod_1.createSelectSchema)(exports.stockUpdates);

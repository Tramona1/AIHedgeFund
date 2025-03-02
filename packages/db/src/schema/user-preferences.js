"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectUserPreferencesSchema = exports.insertUserPreferencesSchema = exports.userPreferences = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// Define the user preferences table
exports.userPreferences = (0, pg_core_1.pgTable)("user_preferences", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull().unique(),
    email: (0, pg_core_1.text)("email").notNull(),
    tickers: (0, pg_core_1.text)("tickers").array(),
    sectors: (0, pg_core_1.text)("sectors").array(),
    tradingStyle: (0, pg_core_1.text)("trading_style"),
    updateFrequency: (0, pg_core_1.text)("update_frequency").default("weekly").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    customTriggers: (0, pg_core_1.jsonb)("custom_triggers"),
});
// Create Zod schemas for validation
exports.insertUserPreferencesSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userPreferences, {
    tickers: zod_1.z.array(zod_1.z.string()).optional(),
    sectors: zod_1.z.array(zod_1.z.string()).optional(),
    tradingStyle: zod_1.z.string().optional(),
    updateFrequency: zod_1.z.enum(["daily", "weekly", "realtime"]).default("weekly"),
    customTriggers: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.selectUserPreferencesSchema = (0, drizzle_zod_1.createSelectSchema)(exports.userPreferences);

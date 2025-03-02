"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  aiTriggerPayloadSchema: () => aiTriggerPayloadSchema,
  aiTriggers: () => aiTriggers,
  db: () => db,
  default: () => index_default,
  insertAiTriggerSchema: () => insertAiTriggerSchema,
  insertStockEventSchema: () => insertStockEventSchema,
  insertStockUpdateSchema: () => insertStockUpdateSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  selectAiTriggerSchema: () => selectAiTriggerSchema,
  selectStockEventSchema: () => selectStockEventSchema,
  selectStockUpdateSchema: () => selectStockUpdateSchema,
  selectUserPreferencesSchema: () => selectUserPreferencesSchema,
  stockEvents: () => stockEvents,
  stockUpdates: () => stockUpdates,
  userPreferences: () => userPreferences,
  users: () => users
});
module.exports = __toCommonJS(index_exports);
var import_postgres_js = require("drizzle-orm/postgres-js");
var import_postgres = __toESM(require("postgres"));

// src/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  aiTriggers: () => aiTriggers,
  insertAiTriggerSchema: () => insertAiTriggerSchema,
  insertStockEventSchema: () => insertStockEventSchema,
  insertStockUpdateSchema: () => insertStockUpdateSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  selectAiTriggerSchema: () => selectAiTriggerSchema,
  selectStockEventSchema: () => selectStockEventSchema,
  selectStockUpdateSchema: () => selectStockUpdateSchema,
  selectUserPreferencesSchema: () => selectUserPreferencesSchema,
  stockEvents: () => stockEvents,
  stockUpdates: () => stockUpdates,
  userPreferences: () => userPreferences,
  users: () => users
});

// src/schema/user-preferences.ts
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_zod = require("drizzle-zod");
var import_zod = require("zod");
var userPreferences = (0, import_pg_core.pgTable)("user_preferences", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull().unique(),
  email: (0, import_pg_core.text)("email").notNull(),
  tickers: (0, import_pg_core.text)("tickers").array(),
  sectors: (0, import_pg_core.text)("sectors").array(),
  tradingStyle: (0, import_pg_core.text)("trading_style"),
  updateFrequency: (0, import_pg_core.text)("update_frequency").default("weekly").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull(),
  customTriggers: (0, import_pg_core.jsonb)("custom_triggers")
});
var users = userPreferences;
var insertUserPreferencesSchema = (0, import_drizzle_zod.createInsertSchema)(userPreferences, {
  tickers: import_zod.z.array(import_zod.z.string()).optional(),
  sectors: import_zod.z.array(import_zod.z.string()).optional(),
  tradingStyle: import_zod.z.string().optional(),
  updateFrequency: import_zod.z.enum(["daily", "weekly", "realtime"]).default("weekly"),
  customTriggers: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).optional()
});
var selectUserPreferencesSchema = (0, import_drizzle_zod.createSelectSchema)(userPreferences);

// src/schema/stock-updates.ts
var import_pg_core2 = require("drizzle-orm/pg-core");
var import_drizzle_zod2 = require("drizzle-zod");
var import_zod2 = require("zod");
var stockUpdates = (0, import_pg_core2.pgTable)("stock_updates", {
  id: (0, import_pg_core2.text)("id").primaryKey(),
  ticker: (0, import_pg_core2.text)("ticker").notNull(),
  eventType: (0, import_pg_core2.text)("event_type").notNull(),
  title: (0, import_pg_core2.text)("title").notNull(),
  content: (0, import_pg_core2.text)("content").notNull(),
  details: (0, import_pg_core2.jsonb)("details"),
  source: (0, import_pg_core2.text)("source"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  sentAt: (0, import_pg_core2.timestamp)("sent_at")
});
var insertStockUpdateSchema = (0, import_drizzle_zod2.createInsertSchema)(stockUpdates, {
  eventType: import_zod2.z.enum([
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
  details: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.any()).optional()
});
var selectStockUpdateSchema = (0, import_drizzle_zod2.createSelectSchema)(stockUpdates);

// src/schema/stock-events.ts
var import_pg_core3 = require("drizzle-orm/pg-core");
var import_drizzle_zod3 = require("drizzle-zod");
var import_zod3 = require("zod");
var stockEvents = (0, import_pg_core3.pgTable)("stock_events", {
  id: (0, import_pg_core3.text)("id").primaryKey(),
  ticker: (0, import_pg_core3.text)("ticker").notNull(),
  eventType: (0, import_pg_core3.text)("event_type").notNull(),
  details: (0, import_pg_core3.jsonb)("details"),
  source: (0, import_pg_core3.text)("source"),
  timestamp: (0, import_pg_core3.timestamp)("timestamp").defaultNow().notNull(),
  processed: (0, import_pg_core3.text)("processed").default("pending").notNull(),
  processedAt: (0, import_pg_core3.timestamp)("processed_at")
});
var insertStockEventSchema = (0, import_drizzle_zod3.createInsertSchema)(stockEvents, {
  eventType: import_zod3.z.enum([
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
  details: import_zod3.z.record(import_zod3.z.string(), import_zod3.z.any()).optional(),
  processed: import_zod3.z.enum(["pending", "processing", "completed", "failed"]).default("pending")
});
var selectStockEventSchema = (0, import_drizzle_zod3.createSelectSchema)(stockEvents);

// src/schema/ai-triggers.ts
var import_pg_core4 = require("drizzle-orm/pg-core");
var import_drizzle_zod4 = require("drizzle-zod");
var import_zod4 = require("zod");
var aiTriggers = (0, import_pg_core4.pgTable)("ai_triggers", {
  id: (0, import_pg_core4.text)("id").primaryKey(),
  ticker: (0, import_pg_core4.text)("ticker").notNull(),
  eventType: (0, import_pg_core4.text)("event_type").notNull(),
  details: (0, import_pg_core4.jsonb)("details"),
  source: (0, import_pg_core4.text)("source"),
  timestamp: (0, import_pg_core4.timestamp)("timestamp").defaultNow().notNull(),
  processed: (0, import_pg_core4.text)("processed").default("pending").notNull(),
  processedAt: (0, import_pg_core4.timestamp)("processed_at")
});
var insertAiTriggerSchema = (0, import_drizzle_zod4.createInsertSchema)(aiTriggers, {
  details: import_zod4.z.record(import_zod4.z.string(), import_zod4.z.any()).optional()
});
var selectAiTriggerSchema = (0, import_drizzle_zod4.createSelectSchema)(aiTriggers);

// src/types.ts
var import_zod5 = require("zod");
var aiTriggerPayloadSchema = import_zod5.z.object({
  event_type: import_zod5.z.enum([
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
  ticker: import_zod5.z.string(),
  fund: import_zod5.z.string().optional(),
  shares: import_zod5.z.number().int().optional(),
  shares_value: import_zod5.z.number().optional(),
  investor: import_zod5.z.string().optional(),
  source: import_zod5.z.string().optional(),
  timestamp: import_zod5.z.string().datetime(),
  details: import_zod5.z.record(import_zod5.z.string(), import_zod5.z.any()).optional()
});

// src/index.ts
var databaseUrl = process.env.DATABASE_URL || "postgres://postgres@localhost:5432/ai_hedge_fund";
console.log("Initializing database connection with:", databaseUrl);
var client = (0, import_postgres.default)(databaseUrl, {
  connection: {
    search_path: "public"
  }
});
var db = (0, import_postgres_js.drizzle)(client, {
  schema: {
    ...schema_exports,
    // Also expose the tables directly
    userPreferences,
    users,
    stockUpdates,
    aiTriggers
  }
});
console.log("Database initialized successfully");
var index_default = db;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  aiTriggerPayloadSchema,
  aiTriggers,
  db,
  insertAiTriggerSchema,
  insertStockEventSchema,
  insertStockUpdateSchema,
  insertUserPreferencesSchema,
  selectAiTriggerSchema,
  selectStockEventSchema,
  selectStockUpdateSchema,
  selectUserPreferencesSchema,
  stockEvents,
  stockUpdates,
  userPreferences,
  users
});
//# sourceMappingURL=index.js.map
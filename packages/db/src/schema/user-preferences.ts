import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define the user preferences table
export const userPreferences = pgTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  tickers: text("tickers").array(),
  sectors: text("sectors").array(),
  tradingStyle: text("trading_style"),
  updateFrequency: text("update_frequency").default("weekly").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  customTriggers: jsonb("custom_triggers"),
});

// Create Zod schemas for validation
export const insertUserPreferencesSchema = createInsertSchema(userPreferences, {
  tickers: z.array(z.string()).optional(),
  sectors: z.array(z.string()).optional(),
  tradingStyle: z.string().optional(),
  updateFrequency: z.enum(["daily", "weekly", "realtime"]).default("weekly"),
  customTriggers: z.record(z.string(), z.any()).optional(),
});

export const selectUserPreferencesSchema = createSelectSchema(userPreferences);

// Type definitions
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert; 
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define the AI triggers table
export const aiTriggers = pgTable("ai_triggers", {
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
export const insertAiTriggerSchema = createInsertSchema(aiTriggers, {
  details: z.record(z.string(), z.any()).optional(),
});

export const selectAiTriggerSchema = createSelectSchema(aiTriggers);

// Type definitions
export type AiTrigger = typeof aiTriggers.$inferSelect;
export type NewAiTrigger = typeof aiTriggers.$inferInsert; 
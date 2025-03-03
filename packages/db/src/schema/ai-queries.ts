import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * AI Queries Schema
 * Stores user query history and responses from the AI system
 */
export const aiQueries = pgTable('ai_queries', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  query: text('query').notNull(),
  response: text('response').notNull(),
  data: jsonb('data'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Create Zod schemas for validation
export const insertAiQuerySchema = createInsertSchema(aiQueries, {
  metadata: z.record(z.string(), z.any()).optional(),
  data: z.record(z.string(), z.any()).optional(),
});

export const selectAiQuerySchema = createSelectSchema(aiQueries);

// Type definitions
export type AiQuery = typeof aiQueries.$inferSelect;
export type NewAiQuery = typeof aiQueries.$inferInsert; 
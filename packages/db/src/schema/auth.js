const { pgTable, text, timestamp } = require("drizzle-orm/pg-core");
const { createInsertSchema, createSelectSchema } = require("drizzle-zod");
const { z } = require("zod");

/**
 * Users table - represents the auth.users table from Supabase Auth
 */
exports.users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create Zod schemas for validation
exports.insertUserSchema = createInsertSchema(exports.users);
exports.selectUserSchema = createSelectSchema(exports.users); 
import { pgTable, text, uuid, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from './auth.js';

export const newsletterPreferences = pgTable(
  "newsletter_preferences",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull().references(() => users.id),
    email: text("email").notNull(),
    isSubscribed: boolean("is_subscribed").default(true).notNull(),
    
    // Interest areas
    stocks: boolean("stocks").default(true),
    options: boolean("options").default(false),
    crypto: boolean("crypto").default(false),
    forex: boolean("forex").default(false),
    commodities: boolean("commodities").default(false),
    
    // Newsletter preferences
    weeklyMarketSummary: boolean("weekly_market_summary").default(true),
    weeklyWatchlistUpdates: boolean("weekly_watchlist_updates").default(true),
    weeklyOptionsFlow: boolean("weekly_options_flow").default(false),
    weeklyDarkPoolActivity: boolean("weekly_dark_pool_activity").default(false),
    
    // Delivery preferences 
    frequency: text("frequency").default("weekly").notNull(),
    preferredDay: text("preferred_day").default("sunday").notNull(),
    lastDelivery: timestamp("last_delivery"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIndex: index("newsletter_preferences_user_id_idx").on(table.userId),
      emailIndex: index("newsletter_preferences_email_idx").on(table.email),
    };
  }
);

// Create zod schemas for type safety and validation
export const insertNewsletterPreferencesSchema = createInsertSchema(newsletterPreferences, {
  email: z.string().email(),
});
export const selectNewsletterPreferencesSchema = createSelectSchema(newsletterPreferences);

// Custom zod schemas for API operations
export const updateNewsletterPreferencesSchema = z.object({
  isSubscribed: z.boolean().optional(),
  stocks: z.boolean().optional(),
  options: z.boolean().optional(),
  crypto: z.boolean().optional(),
  forex: z.boolean().optional(),
  commodities: z.boolean().optional(),
  weeklyMarketSummary: z.boolean().optional(),
  weeklyWatchlistUpdates: z.boolean().optional(), 
  weeklyOptionsFlow: z.boolean().optional(),
  weeklyDarkPoolActivity: z.boolean().optional(),
  frequency: z.enum(['daily', 'twice-weekly', 'weekly', 'bi-weekly', 'monthly']).optional(),
  preferredDay: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']).optional(),
});

// Export types
export type NewsletterPreferences = typeof newsletterPreferences.$inferSelect;
export type NewNewsletterPreferences = typeof newsletterPreferences.$inferInsert;
export type UpdateNewsletterPreferences = z.infer<typeof updateNewsletterPreferencesSchema>; 
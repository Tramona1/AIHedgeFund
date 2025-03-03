import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { userPreferences } from "./schema/user-preferences.js";
import { stockUpdates } from "./schema/stock-updates.js";
import { stockEvents } from "./schema/stock-events.js";
import { aiTriggers } from "./schema/ai-triggers.js";

// Re-export all schema validators
export * from "./schema/user-preferences.js";
export * from "./schema/stock-updates.js";
export * from "./schema/stock-events.js";
export * from "./schema/ai-triggers.js";

// AI Trigger Payload Schema for API validation
export const aiTriggerPayloadSchema = z.object({
  event_type: z.enum([
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
  ticker: z.string(),
  fund: z.string().optional(),
  shares: z.number().int().optional(),
  shares_value: z.number().optional(),
  investor: z.string().optional(),
  source: z.string().optional(),
  timestamp: z.string().datetime(),
  details: z.record(z.string(), z.any()).optional(),
});

// Type definition for AI Trigger Payload
export type AITriggerPayload = z.infer<typeof aiTriggerPayloadSchema>; 
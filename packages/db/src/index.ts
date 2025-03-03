import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import { userPreferences } from "./schema/user-preferences.js";
import { stockUpdates } from "./schema/stock-updates.js";
import { aiTriggers } from "./schema/ai-triggers.js";
import { getEnv } from "./utils.js";
// Import unusual whales schema
import { optionsFlow, darkPoolData } from "./schema/unusual-whales.js";
// Import market data schema
import * as marketDataSchema from "./schema/market-data.js";
// Import stock updates schema
import * as stockUpdatesSchema from "./schema/stock-updates.js";

// Environment variables
const { DATABASE_URL, DATABASE_CONNECTION_POOL_URL, NODE_ENV } = getEnv();

// Connection string
const connectionString = NODE_ENV === "production" 
  ? DATABASE_URL 
  : DATABASE_CONNECTION_POOL_URL || DATABASE_URL;

// Configure postgres
const client = postgres(connectionString, { max: 10 });

// Create db instance
export const db = drizzle(client, { schema });

/**
 * Helper function to get schema tables
 * This provides a consistent way to access tables in the schema
 */
export const getSchema = () => {
  return schema;
};

// Export individual schema modules
export * from "./schema/index.js";
export * from "./types.js";

// Export specific tables and types that are commonly used
export {
  // User preferences
  userPreferences,
  
  // Stock updates
  stockUpdates,
  
  // AI triggers
  aiTriggers,
  
  // Market data schema
  marketDataSchema,
  
  // Stock updates schema
  stockUpdatesSchema,
  
  // Unusual whales data
  optionsFlow,
  darkPoolData,
}; 
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import { userPreferences, userPreferencesTable } from "./schema/user-preferences";
import { stockUpdates } from "./schema/stock-updates";
import { aiTriggers } from "./schema/ai-triggers";

// Get database URL with a fallback
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/ai_hedge_fund';

console.log("Initializing database connection with:", databaseUrl);

// Create a PostgreSQL client with minimal options - simplified based on successful tests
const client = postgres(databaseUrl, {
  connection: {
    search_path: 'public'
  }
});

// Create a drizzle ORM instance - explicitly including userPreferences in the schema
export const db = drizzle(client, { 
  schema: {
    ...schema,
    // Also expose the tables directly
    userPreferences,
    userPreferencesTable,
    stockUpdates,
    aiTriggers
  } 
});

// Log successful initialization
console.log("Database initialized successfully");

// Export schema for use in other modules
export * from "./schema/index";

// Export validators and types
export * from "./types";

// Default export
export default db; 
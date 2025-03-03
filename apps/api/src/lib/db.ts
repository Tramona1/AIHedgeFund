// Database connection setup
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "@repo/logger";
import { env } from "../env.js";

// Import schema for type safety
import * as schema from "@repo/db/schema";

// Get database connection string
const connectionString = env.DATABASE_URL;

// Create postgres connection
const client = postgres(connectionString, {
  max: 10, // Connection pool size
  ssl: env.NODE_ENV === "production", // Use SSL in production
});

logger.info("Database connection initialized", { 
  environment: env.NODE_ENV, 
  // Hide sensitive info from logs
  dbName: connectionString.split("/").pop()
});

// Initialize drizzle with the client and schema
export const db = drizzle(client, { schema });

// Export specific helpers and utilities
export { eq, and, or, desc, asc, sql } from "drizzle-orm"; 
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

// Create a PostgreSQL client
const client = postgres(process.env.DATABASE_URL || "");

// Create a drizzle ORM instance
export const db = drizzle(client, { schema });

// Export schema for use in other modules
export * from "./schema/index";

// Export validators and types
export * from "./types";

// Default export
export default db; 
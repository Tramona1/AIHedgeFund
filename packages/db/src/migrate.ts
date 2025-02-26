import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { logger } from "@repo/logger";

// Create a migration function
async function runMigration() {
  logger.info("Starting database migration");

  try {
    // Get database URL from environment variables
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create a PostgreSQL client for migration
    const migrationClient = postgres(databaseUrl, { max: 1 });
    
    // Create a Drizzle instance
    const db = drizzle(migrationClient);

    // Run migrations from the "migrations" folder
    await migrate(db, { migrationsFolder: "drizzle" });
    
    logger.info("Migration completed successfully");
    
    // Close the connection
    await migrationClient.end();
    
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed", { error });
    process.exit(1);
  }
}

// Run the migration
runMigration(); 
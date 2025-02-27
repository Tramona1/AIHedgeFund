import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Simple logging function instead of using @repo/logger
function log(level: 'info' | 'error', message: string, metadata?: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    component: 'db-migrate',
    message,
    metadata: metadata || {}
  }));
}

// Create a migration function
async function runMigration() {
  log('info', "Starting database migration");

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
    
    log('info', "Migration completed successfully");
    
    // Close the connection
    await migrationClient.end();
    
    process.exit(0);
  } catch (error) {
    log('error', "Migration failed", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration();
}

// Export for programmatic usage
export { runMigration }; 
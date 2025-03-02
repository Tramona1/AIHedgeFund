import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Simple logging function
const log = (level: string, message: string) => {
  console.log(`[${level.toUpperCase()}] ${message}`);
};

// Create a migration function
const runMigration = async () => {
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log('error', 'DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  log('info', 'Starting database migration...');
  
  // Create a PostgreSQL client for migrations
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  
  try {
    // Run migrations
    await migrate(drizzle(migrationClient), {
      migrationsFolder: path.resolve(__dirname, '../drizzle'),
    });
    
    log('info', 'Migration completed successfully');
  } catch (error) {
    log('error', `Migration failed: ${error}`);
    process.exit(1);
  } finally {
    // Close the client when done
    await migrationClient.end();
  }
};

// Run the migration
if (require.main === module) {
  runMigration();
}

// Export for programmatic usage
export { runMigration }; 
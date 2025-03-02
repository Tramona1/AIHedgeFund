import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
// Don't import schema, we'll use direct SQL queries

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Simple logging function
const log = (level: string, message: string) => {
  console.log(`[${level.toUpperCase()}] ${message}`);
};

async function createTables() {
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log('error', 'DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  log('info', 'Creating database tables...');
  
  // Create a PostgreSQL client
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    // Drop existing tables if they exist
    log('info', 'Dropping existing tables if they exist...');
    await client`DROP TABLE IF EXISTS stock_events`;
    await client`DROP TABLE IF EXISTS stock_updates`;
    await client`DROP TABLE IF EXISTS user_preferences`;
    await client`DROP TABLE IF EXISTS ai_triggers`;
    
    // Create tables using direct SQL
    log('info', 'Creating user_preferences table...');
    await client`
      CREATE TABLE "user_preferences" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL UNIQUE,
        "email" TEXT NOT NULL,
        "tickers" TEXT[],
        "sectors" TEXT[],
        "trading_style" TEXT,
        "update_frequency" TEXT NOT NULL DEFAULT 'weekly',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "custom_triggers" JSONB
      )
    `;
    
    log('info', 'Creating stock_updates table...');
    await client`
      CREATE TABLE "stock_updates" (
        "id" TEXT PRIMARY KEY,
        "ticker" TEXT NOT NULL,
        "event_type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "details" JSONB,
        "source" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "sent_at" TIMESTAMP
      )
    `;
    
    log('info', 'Creating stock_events table...');
    await client`
      CREATE TABLE "stock_events" (
        "id" TEXT PRIMARY KEY,
        "ticker" TEXT NOT NULL,
        "event_type" TEXT NOT NULL,
        "details" JSONB,
        "source" TEXT,
        "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
        "processed" TEXT DEFAULT 'pending' NOT NULL,
        "processed_at" TIMESTAMP
      )
    `;
    
    log('info', 'Creating ai_triggers table...');
    await client`
      CREATE TABLE "ai_triggers" (
        "id" TEXT PRIMARY KEY,
        "ticker" TEXT NOT NULL,
        "event_type" TEXT NOT NULL,
        "details" JSONB,
        "source" TEXT,
        "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
        "processed" TEXT DEFAULT 'pending' NOT NULL,
        "processed_at" TIMESTAMP
      )
    `;
    
    log('info', 'Tables created successfully');
  } catch (error) {
    log('error', `Failed to create tables: ${error}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  createTables().catch(err => {
    console.error('Error creating tables:', err);
    process.exit(1);
  });
}

export { createTables };
/**
 * Drizzle ORM direct test
 * This script tests Drizzle ORM's ability to connect to the database
 * and query the user_preferences table.
 */
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { pgTable, text, timestamp, jsonb } = require('drizzle-orm/pg-core');

// Create schema definition directly in this file to avoid import issues
const userPreferences = pgTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  tickers: text("tickers").array(),
  sectors: text("sectors").array(),
  tradingStyle: text("trading_style"),
  updateFrequency: text("update_frequency").default("weekly").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  customTriggers: jsonb("custom_triggers"),
});

// Get database URL with a fallback
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/ai_hedge_fund';

console.log('CONNECTION STRING:', databaseUrl);
console.log('TABLE NAME:', userPreferences.name);

async function runTest() {
  // Create a PostgreSQL client
  const client = postgres(databaseUrl, {
    connection: {
      search_path: 'public'
    }
  });
  
  // Create a Drizzle instance with our simple schema
  const db = drizzle(client, { schema: { userPreferences } });
  
  try {
    console.log('\n--- DIRECT SQL TEST ---');
    
    // Test direct SQL query first to verify connection
    const directResult = await client`SELECT * FROM user_preferences LIMIT 5`;
    console.log(`Direct query: Found ${directResult.length} rows in user_preferences table`);
    
    console.log('\n--- DRIZZLE ORM TEST ---');
    
    // Now test Drizzle query - this will likely fail if there's an issue
    console.log('Attempting Drizzle query...');
    const drizzleResult = await db.select().from(userPreferences).limit(5);
    console.log(`Drizzle query: Found ${drizzleResult.length} rows in user_preferences table`);
    
    // Close connection
    await client.end();
    console.log('Connection closed');
    
    return { success: true };
  } catch (error) {
    console.error('ERROR EXECUTING TEST:', error.message);
    console.error('STACK TRACE:', error.stack);
    
    // Try to end the connection even if there was an error
    try {
      await client.end();
      console.log('Connection closed after error');
    } catch (endError) {
      console.error('Error closing connection:', endError.message);
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
runTest()
  .then(result => {
    console.log('\nTEST RESULT:', result.success ? 'SUCCESS' : 'FAILURE');
    if (!result.success) {
      console.error('Error:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }); 
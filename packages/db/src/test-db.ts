/**
 * Simple script to test database connectivity
 */
import * as dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { userPreferences } from './schema/user-preferences';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Setting DATABASE_URL explicitly if not already set
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/ai_hedge_fund';

console.log('DATABASE_URL:', databaseUrl);

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Create a direct connection to the database
    const client = postgres(databaseUrl, {
      connection: {
        search_path: 'public'
      }
    });
    
    const db = drizzle(client, { schema: { userPreferences } });
    
    // Try to query the user_preferences table
    console.log('Checking if userPreferences table exists...');
    const result = await db.select().from(userPreferences);
    
    console.log('Successfully connected to database!');
    console.log(`Found ${result.length} records in userPreferences table.`);
    
    // Close the connection
    await client.end();
    
    return result;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('Database test completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database test failed:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection }; 
/**
 * Direct database test without Drizzle ORM
 */
const postgres = require('postgres');

// Connection string - same as used in the main app
const connectionString = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/ai_hedge_fund';

console.log('Connection string:', connectionString);

async function runTest() {
  // Create a direct postgres client
  const sql = postgres(connectionString, {
    connection: {
      search_path: 'public'
    }
  });

  try {
    console.log('Testing direct query to user_preferences table...');
    
    // Get table list from information_schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables in public schema:', tables.map(t => t.table_name).join(', '));
    
    // Try to directly query the user_preferences table
    console.log('\nQuerying user_preferences table directly:');
    const result = await sql`SELECT * FROM user_preferences LIMIT 5`;
    console.log(`Found ${result.length} rows in user_preferences table`);
    
    if (result.length > 0) {
      console.log('Sample row:', JSON.stringify(result[0], null, 2));
    } else {
      console.log('No rows found in user_preferences table');
    }
    
    // End the connection
    await sql.end();
    console.log('Connection closed');
    
    return { success: true };
  } catch (error) {
    console.error('Error executing direct database query:', error);
    
    // Try to end the connection even if there was an error
    try {
      await sql.end();
      console.log('Connection closed after error');
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return { success: false, error };
  }
}

// Run the test
runTest()
  .then(result => {
    console.log('Test completed with result:', result.success ? 'SUCCESS' : 'FAILURE');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 
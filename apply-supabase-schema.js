// Script to apply the SQL schema to Supabase
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

// Get Supabase connection details from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Supabase URL or key not set in environment variables');
  process.exit(1);
}

console.log(`✅ Found Supabase configuration`);
console.log(`URL: ${SUPABASE_URL.substring(0, 20)}...`);
console.log(`Key: ${SUPABASE_KEY.substring(0, 10)}...`);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read the SQL file
const sqlFile = 'supabase-setup-complete.sql';
console.log(`Reading SQL file: ${sqlFile}`);

let sql;
try {
  sql = fs.readFileSync(sqlFile, 'utf8');
} catch (err) {
  console.error(`❌ Error reading SQL file: ${err.message}`);
  process.exit(1);
}

// Split the SQL into separate statements
const statements = sql
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

console.log(`Found ${statements.length} SQL statements to execute`);

// Execute each statement
async function executeSQL() {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const firstLine = statement.split('\n')[0].trim();
    console.log(`\nExecuting statement ${i + 1}/${statements.length}: ${firstLine}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
      } else {
        console.log('✅ Statement executed successfully');
      }
    } catch (err) {
      console.error(`❌ Exception executing statement: ${err.message}`);
    }
  }
  
  console.log('\n✅ SQL execution complete');
}

// Execute the SQL
executeSQL().catch(err => {
  console.error(`❌ Fatal error: ${err.message}`);
  process.exit(1);
}); 
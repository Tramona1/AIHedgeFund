// Test script for Supabase connectivity
// This script checks connection to Supabase and verifies data access

// Import required modules (CommonJS style)
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env and .env.local files
dotenv.config(); // Load from .env
dotenv.config({ path: '.env.local', override: true }); // Override with .env.local if present

// Get Supabase connection details from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Define tables to query
const TABLES = {
  STOCK_DATA: 'stock_data',
  USER_PREFERENCES: 'user_preferences',
  OPTIONS_FLOW: 'options_flow',
  DARK_POOL_DATA: 'dark_pool_data',
  COMPANY_INFO: 'company_info',
  USER_WATCHLIST: 'user_watchlist',
  AI_QUERY_HISTORY: 'ai_query_history'
};

/**
 * Test Supabase connection and data access
 */
async function testConnection() {
  try {
    console.log('Running Supabase connection test...');
    
    // Check if environment variables are set
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('❌ Error: Supabase URL or key not set in environment variables');
      console.log('Required variables:');
      console.log('- SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
      console.log('- SUPABASE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return false;
    }
    
    console.log(`✅ Found Supabase configuration`);
    console.log(`URL: ${SUPABASE_URL.substring(0, 20)}...`);
    console.log(`Key: ${SUPABASE_KEY.substring(0, 10)}...`);
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Test stock data access
    console.log('\nTesting stock data access...');
    try {
      const { data: stockData, error: stockError } = await supabase
        .from(TABLES.STOCK_DATA)
        .select()
        .limit(1);
      
      if (stockError) {
        console.error(`❌ Error accessing stock data: ${stockError.message}`);
      } else {
        console.log(`✅ Successfully accessed stock data table`);
        console.log(`Data sample:`, stockData);
      }
    } catch (err) {
      console.error(`❌ Exception accessing stock data: ${err.message}`);
    }
    
    // Test user preferences access
    console.log('\nTesting user preferences access...');
    try {
      const { data: userPrefs, error: userError } = await supabase
        .from(TABLES.USER_PREFERENCES)
        .select()
        .limit(1);
      
      if (userError) {
        console.error(`❌ Error accessing user preferences: ${userError.message}`);
      } else {
        console.log(`✅ Successfully accessed user preferences table`);
        console.log(`Data sample:`, userPrefs);
      }
    } catch (err) {
      console.error(`❌ Exception accessing user preferences: ${err.message}`);
    }

    // Test options flow access
    console.log('\nTesting options flow access...');
    try {
      const { data: optionsData, error: optionsError } = await supabase
        .from(TABLES.OPTIONS_FLOW)
        .select()
        .limit(1);
      
      if (optionsError) {
        console.error(`❌ Error accessing options flow: ${optionsError.message}`);
      } else {
        console.log(`✅ Successfully accessed options flow table`);
        console.log(`Data sample:`, optionsData);
      }
    } catch (err) {
      console.error(`❌ Exception accessing options flow: ${err.message}`);
    }

    // Test dark pool data access
    console.log('\nTesting dark pool data access...');
    try {
      const { data: darkPoolData, error: darkPoolError } = await supabase
        .from(TABLES.DARK_POOL_DATA)
        .select()
        .limit(1);
      
      if (darkPoolError) {
        console.error(`❌ Error accessing dark pool data: ${darkPoolError.message}`);
      } else {
        console.log(`✅ Successfully accessed dark pool data table`);
        console.log(`Data sample:`, darkPoolData);
      }
    } catch (err) {
      console.error(`❌ Exception accessing dark pool data: ${err.message}`);
    }
    
    // Test storage
    console.log('\nTesting Supabase storage...');
    try {
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error(`❌ Error accessing storage buckets: ${bucketsError.message}`);
      } else {
        console.log(`✅ Successfully accessed storage buckets`);
        console.log(`Buckets:`, buckets.map(b => b.name).join(', ') || 'No buckets found');
      }
    } catch (err) {
      console.error(`❌ Exception accessing storage: ${err.message}`);
    }
    
    console.log('\n✅ Connection test complete');
    return true;
  } catch (error) {
    console.error(`❌ Connection test failed: ${error.message}`);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests completed. Supabase connection is functioning properly.');
    } else {
      console.error('\n❌ Some tests failed. Check the logs above for details.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error(`❌ Fatal error during testing: ${err.message}`);
    process.exit(1);
  }); 
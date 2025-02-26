import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for database operations only
let supabase = null;

// Only initialize if we have valid-looking URLs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if values seem valid (not placeholders) and create client
if (supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-url') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized for database operations');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    // Return a dummy client that logs errors instead of throwing
    supabase = {
      from: () => {
        console.error('Supabase client not properly initialized');
        return {
          select: () => Promise.resolve([]),
          insert: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
          update: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
          delete: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        };
      },
    };
  }
} else {
  console.warn('Supabase URL or API key not properly configured');
  // Return a dummy client that logs errors instead of throwing
  supabase = {
    from: () => {
      console.error('Supabase client not properly initialized');
      return {
        select: () => Promise.resolve([]),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
      };
    },
  };
}

export { supabase }; 
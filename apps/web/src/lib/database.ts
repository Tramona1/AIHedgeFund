import { createClient } from '@supabase/supabase-js';
import { logger } from '@repo/logger';

// Initialize Supabase client for database operations only
let supabase = null;

// Get environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Properly check environment variables and log issues
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl.includes('your-supabase-url') || 
    supabaseAnonKey.includes('your-supabase-anon-key')) {
  
  console.error('Supabase configuration missing or invalid:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey,
    isUrlDefault: supabaseUrl.includes('your-supabase-url'),
    isKeyDefault: supabaseAnonKey.includes('your-supabase-anon-key')
  });

  // Create a mock client with error responses
  supabase = {
    from: () => {
      console.error('Supabase client not properly initialized - using mock client');
      return {
        select: () => ({ data: null, error: new Error('Supabase not initialized') }),
        insert: () => ({ data: null, error: new Error('Supabase not initialized') }),
        update: () => ({ data: null, error: new Error('Supabase not initialized') }),
        delete: () => ({ data: null, error: new Error('Supabase not initialized') }),
        eq: () => ({ data: null, error: new Error('Supabase not initialized') }),
        single: () => ({ data: null, error: new Error('Supabase not initialized') }),
        order: () => ({ data: null, error: new Error('Supabase not initialized') }),
        limit: () => ({ data: null, error: new Error('Supabase not initialized') }),
      }
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
        getPublicUrl: () => ({ publicUrl: '', error: new Error('Supabase not initialized') })
      })
    }
  };
} else {
  try {
    // Attempt to create the Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized for database operations');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    
    // Create a mock client with error responses if initialization fails
    supabase = {
      from: () => {
        console.error('Supabase client failed to initialize - using mock client');
        return {
          select: () => ({ data: null, error: new Error('Supabase initialization failed') }),
          insert: () => ({ data: null, error: new Error('Supabase initialization failed') }),
          update: () => ({ data: null, error: new Error('Supabase initialization failed') }),
          delete: () => ({ data: null, error: new Error('Supabase initialization failed') }),
          eq: () => ({ data: null, error: new Error('Supabase initialization failed') }),
          single: () => ({ data: null, error: new Error('Supabase initialization failed') }),
          order: () => ({ data: null, error: new Error('Supabase initialization failed') }),
          limit: () => ({ data: null, error: new Error('Supabase initialization failed') }),
        }
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ error: new Error('Supabase initialization failed') }),
          getPublicUrl: () => ({ publicUrl: '', error: new Error('Supabase initialization failed') })
        })
      }
    };
  }
}

export { supabase }; 
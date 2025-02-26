// This file is kept for Supabase database operations only
// Authentication is now handled by Clerk directly

import { createClient } from '@supabase/supabase-js';

// Only initialize Supabase if URLs are valid
let supabase: ReturnType<typeof createClient> | null = null;

// Only attempt to create a Supabase client if both values are provided and look valid
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
  }
}

export { supabase };

// Types
export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
  } | null;
  session: any | null;
}

// Auth Service
export const authService = {
  /**
   * Sign up a new user
   */
  async signUp({ email, password }: UserCredentials) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { user: data.user, session: data.session };
  },

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: UserCredentials) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { user: data.user, session: data.session };
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Get the current session
   */
  async getSession() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(error.message);
    }

    return { 
      session: data.session,
      user: data.session?.user || null
    };
  },

  /**
   * Get the current user
   */
  async getUser() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(error.message);
    }

    return { user: data.user };
  },

  /**
   * Update user profile
   */
  async updateProfile(profile: any) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase.auth.updateUser(profile);
    
    if (error) {
      throw new Error(error.message);
    }

    return { user: data.user };
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }
}; 
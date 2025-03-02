// API service for interacting with the backend

/**
 * Next.js provides fetch globally in both client and server components.
 * If you encounter "fetch is not defined" errors:
 * 1. Check that you're using Next.js correctly
 * 2. Ensure you have the correct environment setup
 * 3. For non-Next.js environments, consider adding:
 *    import 'isomorphic-fetch'; or import 'cross-fetch';
 */

/**
 * Base API URL from environment variable or fallback to localhost in development
 */
const API_BASE_URL = (() => {
  // Use environment variable if defined
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser environment, detect the current URL and port
  if (typeof window !== 'undefined') {
    // Get the current hostname (allows for testing on other devices on the network)
    const hostname = window.location.hostname;
    // Always use the fixed API port in development
    return `http://${hostname}:3002`;
  }
  
  // Default fallback for server-side
  return 'http://localhost:3002';
})();

/**
 * Generic API fetcher with error handling
 */
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`Fetching from: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error ${response.status}` };
      }
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch from ${url}:`, error);
    // Add more context to the error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not connect to API at ${API_BASE_URL}. Please ensure the API server is running.`);
    }
    // Re-throw to allow components to handle the error
    throw error;
  }
}

/**
 * Types based on our backend models
 */

export interface StockUpdate {
  id: string;
  ticker: string;
  eventType: string;
  title: string;
  content: string;
  details?: Record<string, any>;
  source?: string;
  createdAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  email: string;
  tickers?: string[];
  sectors?: string[];
  tradingStyle?: string;
  updateFrequency: 'daily' | 'weekly' | 'realtime';
  customTriggers?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EconomicReport {
  id: string;
  source: string;
  filename: string;
  original_filename?: string;
  timestamp: string;
  subject?: string;
  url?: string;
  summary?: string;
  file_url: string;
  category: string;
  from_email?: string;
  processed_at: string;
}

export interface Interview {
  id: string;
  video_id: string;
  video_url: string;
  title?: string;
  speaker?: string;
  timestamp: string;
  summary?: string;
  highlights?: Record<string, any>;
  transcript_url?: string;
  processed_at: string;
}

/**
 * Stock Updates API
 */
export const stockUpdatesAPI = {
  /**
   * Get all stock updates
   */
  getAll: () => 
    fetchAPI<{ updates: StockUpdate[] }>('/api/updates'),
    
  /**
   * Get stock updates for a specific ticker
   */
  getByTicker: (ticker: string) => 
    fetchAPI<{ updates: StockUpdate[] }>(`/api/updates/ticker/${ticker}`),
    
  /**
   * Create a new stock update (admin only in production)
   */
  create: (data: Omit<StockUpdate, 'id' | 'createdAt'>) => 
    fetchAPI<{ id: string }>('/api/updates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/**
 * User Preferences API
 */
export const userPreferencesAPI = {
  async get(userId: string): Promise<{ userPreferences: UserPreferences | null }> {
    try {
      if (!userId) {
        console.warn('Attempted to fetch user preferences without a user ID');
        return { userPreferences: null };
      }
      
      return await fetchAPI<{ userPreferences: UserPreferences | null }>(`/api/users/${userId}/preferences`);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      
      // If it's a "User not found" error, this might be a new user
      if (error instanceof Error && error.message === 'User not found') {
        console.log('This appears to be a new user - returning empty preferences');
        // Return empty result for new users instead of propagating the error
        return { userPreferences: null };
      }
      
      // Return empty result for all errors instead of propagating
      return { userPreferences: null };
    }
  },
  
  async update(data: Partial<UserPreferences>): Promise<{ success: boolean; message?: string }> {
    try {
      // Add retry logic for when the server might be starting up
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await fetchAPI<{ success: boolean; message?: string }>(`/api/users/${data.userId}/preferences`, {
            method: 'POST',
            body: JSON.stringify(data),
          });
          return result;
        } catch (err) {
          console.log(`API call attempt ${attempt} failed:`, err);
          lastError = err;
          
          // Only retry on network errors, not on API errors
          if (!(err instanceof TypeError) || attempt === maxRetries) {
            throw err;
          }
          
          // Wait between retries (exponential backoff)
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
};

/**
 * AI Triggers API (for demonstration purposes - in production this would be restricted)
 */
export const aiTriggersAPI = {
  /**
   * Get AI triggers for a specific ticker
   */
  getByTicker: (ticker: string) => 
    fetchAPI<{ events: any[] }>(`/api/ai-triggers/${ticker}`),
    
  /**
   * Send a test notification (development only)
   */
  sendTestNotification: (data: {
    ticker: string;
    eventType: string;
    details?: Record<string, any>;
  }) => 
    fetchAPI<{ status: string }>('/api/notifications/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  /**
   * Create a test AI trigger (development/demo purposes only)
   */
  createTestTrigger: (data: {
    ticker: string;
    eventType: string;
    fund?: string;
    shares?: number;
    shares_value?: number;
    investor?: string;
    source?: string;
  }) => 
    fetchAPI<{ status: string; message: string; data: any }>('/api/ai-triggers/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/**
 * Economic Reports API
 */
export const economicReportsAPI = {
  /**
   * Get recent economic reports
   */
  getRecent: (limit = 10) => 
    fetchAPI<{ data: EconomicReport[] }>(`/api/economic-reports/recent?limit=${limit}`),
    
  /**
   * Get economic reports by source
   */
  getBySource: (source: string, limit = 10) => 
    fetchAPI<{ data: EconomicReport[] }>(`/api/economic-reports/recent?source=${source}&limit=${limit}`),
    
  /**
   * Get economic reports by category
   */
  getByCategory: (category: string, limit = 10) => 
    fetchAPI<{ data: EconomicReport[] }>(`/api/economic-reports/recent?category=${category}&limit=${limit}`),
    
  /**
   * Get available economic report sources
   */
  getSources: () => 
    fetchAPI<{ data: string[] }>('/api/economic-reports/sources'),
    
  /**
   * Get available economic report categories
   */
  getCategories: () => 
    fetchAPI<{ data: string[] }>('/api/economic-reports/categories'),
};

/**
 * Interviews API
 */
export const interviewsAPI = {
  /**
   * Get recent interviews
   */
  getRecent: (limit = 10) => 
    fetchAPI<{ data: Interview[] }>(`/api/interviews/recent?limit=${limit}`),
    
  /**
   * Get interviews by speaker
   */
  getBySpeaker: (speaker: string, limit = 10) => 
    fetchAPI<{ data: Interview[] }>(`/api/interviews/recent?speaker=${speaker}&limit=${limit}`),
    
  /**
   * Get available interview speakers
   */
  getSpeakers: () => 
    fetchAPI<{ data: string[] }>('/api/interviews/speakers'),
}; 
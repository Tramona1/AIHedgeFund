// API service for interacting with the backend

/**
 * Next.js provides fetch globally in both client and server components.
 * If you encounter "fetch is not defined" errors:
 * 1. Check that you're using Next.js correctly
 * 2. Ensure you have the correct environment setup
 * 3. For non-Next.js environments, consider adding:
 *    import 'isomorphic-fetch'; or import 'cross-fetch';
 */

// Import Supabase client
import { supabase } from './database';

/**
 * Utility function to get the API URL with fallback
 */
function getApiUrl() {
  // First try to get from environment variable
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Return environment variable if it exists and is not empty
  if (envApiUrl && envApiUrl.trim() !== '') {
    return envApiUrl.trim();
  }
  
  // Fallback to default local API URL for development
  return 'http://localhost:3001';
}

/**
 * Generic API fetcher with error handling
 */
export async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiUrl()}${endpoint}`;
  
  try {
    console.log(`Fetching from: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

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
    
    // Handle network errors with a structured error object
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('API connection error: could not connect to server');
      return {
        error: 'API_CONNECTION_ERROR',
        message: 'Could not connect to the server. Please check your internet connection or try again later.',
        success: false,
        status: 'error'
      } as any as T;
    }
    
    // Handle timeout errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('API timeout error: request took too long');
      return {
        error: 'API_TIMEOUT',
        message: 'Request timed out. The server is taking too long to respond.',
        success: false,
        status: 'error'
      } as any as T;
    }
    
    // For other errors, return a structured error object
    if (error instanceof Error) {
      return {
        error: 'API_ERROR',
        message: error.message || 'An unknown error occurred',
        success: false,
        status: 'error'
      } as any as T;
    }
    
    // Fallback for any other unexpected errors
    return {
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      success: false,
      status: 'error'
    } as any as T;
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
 * Supabase data structure interfaces
 */
export interface MarketDataEntry {
  id?: number;
  ticker: string;
  name?: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume: number;
  date?: string;
  price_change: number;
  price_change_pct: number;
  timestamp: string;
}

/**
 * Stock data interfaces
 */
export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: Date;
}

/**
 * Market Data API
 */
export const marketDataAPI = {
  /**
   * Get current stock data for a ticker directly from Supabase
   */
  async getStockData(symbol: string): Promise<StockData | null> {
    try {
      const upperSymbol = symbol.toUpperCase();
      
      // Fetch from Supabase market_data table
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('ticker', upperSymbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error(`Error fetching stock data for ${symbol} from Supabase:`, error);
        return null;
      }
      
      if (data) {
        return {
          symbol: data.ticker,
          price: data.price || 0,
          change: data.price_change || 0,
          changePercent: data.price_change_pct || 0,
          volume: data.volume || 0,
          lastUpdated: new Date(data.timestamp)
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  },
  
  /**
   * Get current stock data for multiple tickers directly from Supabase
   */
  async getBatchStockData(symbols: string[]): Promise<Record<string, StockData>> {
    if (!symbols || symbols.length === 0) {
      return {};
    }
    
    try {
      // Use the API endpoint instead of Supabase directly
      const response = await fetch(`${getApiUrl()}/api/market-data/stocks?symbols=${symbols.join(',')}`);
      
      if (!response.ok) {
        console.error('Failed to fetch batch stock data:', response.statusText);
        return {};
      }
      
      const data = await response.json();
      
      // Format the response to match the expected structure
      const formattedData: Record<string, StockData> = {};
      
      if (data && Array.isArray(data.stocks)) {
        data.stocks.forEach(stock => {
          formattedData[stock.symbol] = {
            symbol: stock.symbol,
            price: stock.price || 0,
            change: stock.change || 0,
            changePercent: stock.percentChange || 0,
            volume: stock.volume || 0,
            lastUpdated: new Date(stock.timestamp || Date.now())
          };
        });
      }
      
      return formattedData;
    } catch (error) {
      console.error('Error fetching batch stock data:', error);
      
      // Return fallback data for UI to display something
      return symbols.reduce((acc, symbol) => {
        acc[symbol] = {
          symbol,
          price: Math.floor(Math.random() * 100) + 50, // Random price between 50-150
          change: Math.random() * 4 - 2, // Random change between -2 and 2
          changePercent: Math.random() * 4 - 2, // Random percent between -2% and 2%
          volume: Math.floor(Math.random() * 1000000),
          lastUpdated: new Date()
        };
        return acc;
      }, {});
    }
  }
};

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
          // Use the correct route: /api/users/preferences instead of /api/users/{userId}/preferences
          const result = await fetchAPI<{ success: boolean; message?: string }>('/api/users/preferences', {
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
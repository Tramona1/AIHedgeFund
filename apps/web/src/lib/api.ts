// API service for interacting with the backend

/**
 * Base API URL from environment variable or fallback to localhost in development
 */
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Generic API fetcher with error handling
 */
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred while fetching the data.');
  }

  return response.json();
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
  /**
   * Get user preferences
   */
  get: (userId: string) => 
    fetchAPI<{ userPreferences: UserPreferences }>(`/api/users/${userId}/preferences`),
    
  /**
   * Create or update user preferences
   */
  update: (data: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>) => 
    fetchAPI<{ status: string }>('/api/users/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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
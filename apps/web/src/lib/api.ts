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
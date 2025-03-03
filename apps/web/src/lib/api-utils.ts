// API utility functions

/**
 * Type declarations for api-utils.ts
 */

/**
 * Base API URL for the application
 * Uses environment variable if available, otherwise defaults to localhost
 */
export const API_BASE_URL = (() => {
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
 * Generic function to fetch data from the API
 * @param endpoint - The API endpoint to fetch from
 * @param options - Fetch options
 * @returns The parsed JSON response
 * @throws Error if the request fails
 */
export async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  // Normalize endpoint
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;
  
  // Set default headers if not provided
  const headers = options.headers || {
    'Content-Type': 'application/json',
  };
  
  // Create a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const fullUrl = `${API_BASE_URL}${normalizedEndpoint}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Check if response is ok (status in the range 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Parse JSON response
    return await response.json() as T;
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again later.');
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if the API is available
 * @returns A promise that resolves to true if the API is available, false otherwise
 */
export async function isApiAvailable(): Promise<boolean> {
  try {
    // Try to fetch a health endpoint or a simple endpoint
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'HEAD',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.warn('API availability check failed:', error);
    return false;
  }
}

/**
 * Get mock data for an endpoint when the API is unavailable
 * @param endpoint - The API endpoint that was being requested
 * @returns Mock data for the endpoint
 */
export function getMockData<T>(endpoint: string): T {
  console.log(`Getting mock data for ${endpoint}`);
  
  // Simple mock data implementation
  // In a real app, you would have more comprehensive mock data
  
  // Fallback mock data response structure
  const mockResponse = {
    success: true,
    message: 'Mock data response',
    data: null
  } as unknown as T;
  
  return mockResponse;
} 
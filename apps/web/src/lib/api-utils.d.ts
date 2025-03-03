/**
 * Type declarations for api-utils.ts
 */

/**
 * Base API URL for the application
 */
export const API_BASE_URL: string;

/**
 * Generic function to fetch data from the API
 * @param endpoint - The API endpoint to fetch from
 * @param options - Fetch options
 * @returns The parsed JSON response
 * @throws Error if the request fails
 */
export function fetchAPI<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T>;

/**
 * Check if the API is available
 * @returns A promise that resolves to true if the API is available, false otherwise
 */
export function isApiAvailable(): Promise<boolean>;

/**
 * Get mock data for an endpoint when the API is unavailable
 * @param endpoint - The API endpoint that was being requested
 * @returns Mock data for the endpoint
 */
export function getMockData<T>(endpoint: string): T; 
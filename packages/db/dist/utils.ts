/**
 * Utility functions for the database package
 */

/**
 * Get environment variables with type safety
 */
export function getEnv() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_CONNECTION_POOL_URL: process.env.DATABASE_CONNECTION_POOL_URL,
    NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test" | undefined,
    API_KEY_ALPHA_VANTAGE: process.env.API_KEY_ALPHA_VANTAGE,
    API_KEY_UNUSUAL_WHALES: process.env.API_KEY_UNUSUAL_WHALES,
    API_KEY_FINNHUB: process.env.API_KEY_FINNHUB,
    API_KEY_FRED: process.env.API_KEY_FRED,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT
  };
} 
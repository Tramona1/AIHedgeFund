/**
 * Get environment variables with defaults
 */
export function getEnv() {
  return {
    DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/ai_hedge_fund',
    DATABASE_CONNECTION_POOL_URL: process.env.DATABASE_CONNECTION_POOL_URL,
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
} 
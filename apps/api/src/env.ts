// Environment variables for the API
import { z } from "zod";

// Define environment variable schema with validation
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3001"),
  DATABASE_URL: z.string(),
  API_KEY_ALPHA_VANTAGE: z.string().optional(),
  API_KEY_UNUSUAL_WHALES: z.string().optional(),
  API_KEY_FINNHUB: z.string().optional(),
  API_KEY_FRED: z.string().optional(),
  API_KEY_NEWS: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
});

// Parse environment variables with fallbacks for development
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/ai_hedge_fund",
  API_KEY_ALPHA_VANTAGE: process.env.API_KEY_ALPHA_VANTAGE,
  API_KEY_UNUSUAL_WHALES: process.env.API_KEY_UNUSUAL_WHALES,
  API_KEY_FINNHUB: process.env.API_KEY_FINNHUB,
  API_KEY_FRED: process.env.API_KEY_FRED,
  API_KEY_NEWS: process.env.API_KEY_NEWS,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
}); 
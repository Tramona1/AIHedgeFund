declare module '@repo/db' {
  import { PgDatabase } from 'drizzle-orm/pg-core';
  
  // Export DB instance
  export const db: PgDatabase<any>;
  
  // Export all schemas
  export * from '@repo/db/schema';
  
  // Export types for user preferences
  export interface NewUserPreferences {
    id?: string;
    userId: string;
    email: string;
    language?: string;
    theme?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketAlerts?: boolean;
    newsAlerts?: boolean;
    watchlistNotifications?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  // Export types for stock updates
  export interface NewStockUpdate {
    id?: string;
    symbol: string;
    companyName?: string;
    price: number;
    change?: number;
    percentChange?: number;
    volume?: number;
    avgVolume?: number;
    marketCap?: number;
    pe?: number;
    dividend?: number;
    yield?: number;
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  // Declare additional tables
  export const stockUpdates: any;
  export const userPreferences: any;
} 
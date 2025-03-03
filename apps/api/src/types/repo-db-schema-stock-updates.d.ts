declare module '@repo/db/schema/stock-updates' {
  import { AnyPgColumn } from 'drizzle-orm/pg-core';
  import { z } from 'zod';

  // Stock updates table
  export const stockUpdates: {
    id: AnyPgColumn;
    ticker: AnyPgColumn;
    eventType: AnyPgColumn;
    title: AnyPgColumn;
    content: AnyPgColumn;
    details: AnyPgColumn;
    source: AnyPgColumn;
    createdAt: AnyPgColumn;
    sentAt: AnyPgColumn;
    // Add property needed for compatibility with the service code
    symbol: AnyPgColumn;
    [key: string]: any;
  };

  // Zod schemas
  export const insertStockUpdateSchema: z.ZodType<any>;
  export const selectStockUpdateSchema: z.ZodType<any>;

  // Types
  export type StockUpdate = any;
  export type NewStockUpdate = {
    id?: string;
    ticker: string;
    eventType: string;
    title: string;
    content: string;
    details?: any;
    source: string;
    createdAt?: Date;
    sentAt?: Date | null;
    // Add property needed for compatibility with the service code
    symbol?: string;
  };
} 
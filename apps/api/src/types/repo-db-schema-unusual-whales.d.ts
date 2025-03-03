declare module '@repo/db/schema/unusual-whales' {
  import { AnyPgColumn } from 'drizzle-orm/pg-core';
  import { z } from 'zod';

  // Options flow table
  export const optionsFlow: {
    id: AnyPgColumn;
    symbol: AnyPgColumn;
    dateTime: AnyPgColumn;
    strike: AnyPgColumn;
    expirationDate: AnyPgColumn;
    volume: AnyPgColumn;
    openInterest: AnyPgColumn;
    premium: AnyPgColumn;
    contractType: AnyPgColumn;
    sentiment: AnyPgColumn;
    unusualScore: AnyPgColumn;
    metadata: AnyPgColumn;
    createdAt: AnyPgColumn;
    updatedAt: AnyPgColumn;
    [key: string]: any;
  };

  // Dark pool data table
  export const darkPoolData: {
    id: AnyPgColumn;
    symbol: AnyPgColumn;
    dateTime: AnyPgColumn;
    volume: AnyPgColumn;
    price: AnyPgColumn;
    exchangeCode: AnyPgColumn;
    isBlockTrade: AnyPgColumn;
    significance: AnyPgColumn;
    metadata: AnyPgColumn;
    createdAt: AnyPgColumn;
    updatedAt: AnyPgColumn;
    [key: string]: any;
  };

  // Alias for backwards compatibility
  export const darkPool: typeof darkPoolData;

  // Zod schemas
  export const insertOptionsFlowSchema: z.ZodType<any>;
  export const selectOptionsFlowSchema: z.ZodType<any>;

  export const insertDarkPoolDataSchema: z.ZodType<any>;
  export const selectDarkPoolDataSchema: z.ZodType<any>;

  // Types
  export type OptionsFlow = any;
  export type NewOptionsFlow = any;
  
  export type DarkPoolData = any;
  export type NewDarkPoolData = any;
} 
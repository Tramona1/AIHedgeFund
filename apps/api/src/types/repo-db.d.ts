// Redirect @repo/db imports to the correct filesystem paths
declare module "@repo/db" { 
  export * from "../../../../packages/db/src"; 
}

declare module "@repo/db/index.js" { 
  export * from "../../../../packages/db/src"; 
}

declare module "@repo/db/types.js" { 
  export * from "../../../../packages/db/src/types"; 
}

declare module "@repo/db/utils.js" { 
  export * from "../../../../packages/db/src/utils"; 
}

declare module '@repo/db' {
  import { PgDatabase } from 'drizzle-orm/pg-core';
  import * as userPreferencesSchema from '@repo/db/schema/user-preferences';
  import * as stockUpdatesSchema from '@repo/db/schema/stock-updates';
  import * as aiTriggersSchema from '@repo/db/schema/ai-triggers';
  import * as marketDataSchema from '@repo/db/schema/market-data';
  import * as unusualWhalesSchema from '@repo/db/schema/unusual-whales';

  // Consolidated schema - this is what the DB instance understands
  export const schema: {
    [key: string]: any;
  };

  // DB instance
  export const db: PgDatabase<typeof schema>;

  // Re-export schemas for direct use
  export import userPreferences = userPreferencesSchema.userPreferences;
  export import stockUpdates = stockUpdatesSchema.stockUpdates;
  export import aiTriggers = aiTriggersSchema.aiTriggers;
  
  // Market data schema
  export import companyInfo = marketDataSchema.companyInfo;
  export import stockData = marketDataSchema.stockData;
  export import balanceSheet = marketDataSchema.balanceSheet;
  export import incomeStatement = marketDataSchema.incomeStatement;
  export import technicalIndicators = marketDataSchema.technicalIndicators;
  export import userWatchlist = marketDataSchema.userWatchlist;

  // Unusual whales schema
  export import optionsFlow = unusualWhalesSchema.optionsFlow;
  export import darkPoolData = unusualWhalesSchema.darkPoolData;
  export import darkPool = unusualWhalesSchema.darkPool;

  // Types from user preferences
  export type UserPreferences = userPreferencesSchema.UserPreferences;
  export type NewUserPreferences = userPreferencesSchema.NewUserPreferences;

  // Types from stock updates
  export type StockUpdate = stockUpdatesSchema.StockUpdate;
  export type NewStockUpdate = stockUpdatesSchema.NewStockUpdate;
} 
declare module '@repo/db' {
  export * from '@repo/db/dist/index';
  
  // Explicitly export the db instance
  import { PgDatabase } from 'drizzle-orm/pg-core';
  export const db: PgDatabase;
} 
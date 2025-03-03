declare module '@repo/db' {
  import type { PgDatabase } from 'drizzle-orm/pg-core';
  
  // Export db instance
  export const db: PgDatabase<any>;
} 
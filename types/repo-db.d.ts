declare module '@repo/db' {
  import { PgDatabase } from 'drizzle-orm/pg-core';
  import * as schema from '../packages/db/src/schema/index';
  
  export const db: PgDatabase<typeof schema>;
} 
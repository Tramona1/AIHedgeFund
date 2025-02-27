/**
 * This declaration file helps resolve TypeScript conflicts between different versions
 * of drizzle-orm in the monorepo.
 */

declare module 'drizzle-orm' {
  export * from 'drizzle-orm/drizzle-orm';
}

declare module 'drizzle-orm/postgres-js' {
  import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
  export { PostgresJsDatabase };
  export function drizzle<TSchema extends Record<string, unknown>>(
    client: any,
    config?: { schema: TSchema }
  ): PostgresJsDatabase<TSchema>;
}

declare module 'drizzle-orm/postgres-js/migrator' {
  export function migrate(db: any, config: any): Promise<void>;
} 
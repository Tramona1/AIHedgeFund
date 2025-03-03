import { SQL } from "drizzle-orm";

/**
 * Type-safe equality check for SQL queries
 */
export function safeEq<T, U>(column: T, value: U): SQL;

/**
 * Query helper to select rows with a where clause
 */
export function selectWhere<T extends { name: string }>(
  table: T,
  whereClause: SQL
): Promise<any[]>; 
/**
 * Database utilities for common operations
 * This file contains simplified versions of utilities to avoid TypeScript errors
 */
import { SQL } from "drizzle-orm";
/**
 * Type-safe equality check for SQL queries
 */
export declare function safeEq<T, U>(column: T, value: U): SQL;
/**
 * Query helper to select rows with a where clause
 */
export declare function selectWhere<T extends {
    name: string;
}>(table: T, whereClause: SQL): Promise<any[]>;

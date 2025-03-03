/**
 * Database Helper Functions
 *
 * This file contains helper functions for working with the database
 * that handle type assertions internally, preventing the need
 * for excessive `as any` casts throughout the codebase.
 */
import { SQL } from "drizzle-orm";
/**
 * Alias type for any table to avoid TypeScript errors with Drizzle's PgTable
 */
export type AnyTable = any;
/**
 * Wrap a table with a safer interface for type-checking
 */
export declare function safeTable<T extends Record<string, any>>(table: AnyTable): T;
/**
 * Get a column from a table with the right type
 */
export declare function tableColumn<T>(table: AnyTable, columnName: string): T;
/**
 * Create a safe equals condition
 */
export declare function safeEq(field: any, value: any): SQL<unknown>;
/**
 * Create a safe AND condition
 */
export declare function safeAnd(...conditions: SQL<unknown>[]): SQL<unknown>;
/**
 * Create a safe OR condition
 */
export declare function safeOr(...conditions: SQL<unknown>[]): SQL<unknown>;
/**
 * Create a safe JOIN condition
 */
export declare function safeJoin(table: AnyTable, condition: SQL<unknown>): any;
/**
 * Create a safe ORDER BY DESC expression
 */
export declare function safeDesc(field: any): any;
/**
 * Create a safe ORDER BY ASC expression
 */
export declare function safeAsc(field: any): any;
/**
 * Select all rows from a table
 */
export declare function selectAll<T extends Record<string, any>>(table: AnyTable): Promise<T[]>;
/**
 * Select rows from a table with a where clause
 */
export declare function selectWhere<T extends Record<string, any>>(table: AnyTable, whereClause?: SQL<unknown>, orderBy?: any, limit?: number): Promise<T[]>;
/**
 * Select a single row by its ID
 */
export declare function selectById<T extends Record<string, any>>(table: AnyTable, idField: any, id: string | number): Promise<T | undefined>;
/**
 * Insert a row into a table
 */
export declare function insertInto<T extends Record<string, any>, U extends Record<string, any>>(table: AnyTable, data: U): Promise<T>;
/**
 * Insert multiple rows into a table
 * If the dataset is large, it will be chunked into smaller batches
 *
 * @param table The table to insert into
 * @param data The array of data to insert
 * @param batchSize The size of each batch (default: 100)
 * @param continueOnError Whether to continue processing batches if one fails (default: false)
 * @returns Array of inserted records
 */
export declare function batchInsert<T extends Record<string, any>, U extends Record<string, any>>(table: AnyTable, data: U[], batchSize?: number, continueOnError?: boolean): Promise<T[]>;
/**
 * Update rows in a table
 */
export declare function updateWhere<T extends Record<string, any>, U extends Record<string, any>>(table: AnyTable, data: U, whereClause: SQL<unknown>): Promise<T[]>;
/**
 * Delete rows from a table
 */
export declare function deleteWhere<T extends Record<string, any>>(table: AnyTable, whereClause: SQL<unknown>): Promise<T[]>;
/**
 * Run a raw SQL query
 */
export declare function rawQuery<T extends Record<string, any>>(query: SQL<unknown>): Promise<T[]>;
/**
 * Type assertion for PgTable
 * Use this when you need to pass a table to a function that expects a PgTable type
 */
export declare function asPgTable(table: any): any;
/**
 * Safely execute a transaction
 * @param callback Function that performs operations within the transaction
 */
export declare function transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;

/**
 * Database Helper Functions
 * 
 * This file contains helper functions for working with the database
 * that handle type assertions internally, preventing the need
 * for excessive `as any` casts throughout the codebase.
 */

import { db } from "@repo/db";
import { SQL, eq, and, or, desc, asc, sql } from "drizzle-orm";
import { logger } from "@repo/logger";

/**
 * Alias type for any table to avoid TypeScript errors with Drizzle's PgTable
 */
export type AnyTable = any;

/**
 * Wrap a table with a safer interface for type-checking
 */
export function safeTable<T extends Record<string, any>>(table: AnyTable): T {
  return new Proxy({} as T, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return (table as any)[prop];
      }
      return undefined;
    }
  });
}

/**
 * Get a column from a table with the right type
 */
export function tableColumn<T>(table: AnyTable, columnName: string): T {
  return (table as any)[columnName] as T;
}

/**
 * Create a safe equals condition
 */
export function safeEq(field: any, value: any): SQL<unknown> {
  return eq(field as any, value) as SQL<unknown>;
}

/**
 * Create a safe AND condition
 */
export function safeAnd(...conditions: SQL<unknown>[]): SQL<unknown> {
  return and(...conditions) as SQL<unknown>;
}

/**
 * Create a safe OR condition
 */
export function safeOr(...conditions: SQL<unknown>[]): SQL<unknown> {
  return or(...conditions) as SQL<unknown>;
}

/**
 * Create a safe JOIN condition
 */
export function safeJoin(table: AnyTable, condition: SQL<unknown>): any {
  return { table: table as any, on: condition };
}

/**
 * Create a safe ORDER BY DESC expression
 */
export function safeDesc(field: any): any {
  return desc(field as any);
}

/**
 * Create a safe ORDER BY ASC expression
 */
export function safeAsc(field: any): any {
  return asc(field as any);
}

/**
 * Select all rows from a table
 */
export async function selectAll<T extends Record<string, any>>(table: AnyTable): Promise<T[]> {
  try {
    const result = await db.select().from(table as any);
    return result as T[];
  } catch (error) {
    logger.error("Error in selectAll:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Select rows from a table with a where clause
 */
export async function selectWhere<T extends Record<string, any>>(
  table: AnyTable,
  whereClause?: SQL<unknown>,
  orderBy?: any,
  limit?: number
): Promise<T[]> {
  try {
    let query = db.select().from(table as any);
    
    if (whereClause) {
      query = query.where(whereClause as any) as any;
    }
    
    if (orderBy) {
      query = query.orderBy(orderBy) as any;
    }
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    const result = await query;
    return result as T[];
  } catch (error) {
    logger.error("Error in selectWhere:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Select a single row by its ID
 */
export async function selectById<T extends Record<string, any>>(
  table: AnyTable,
  idField: any,
  id: string | number
): Promise<T | undefined> {
  try {
    const results = await db.select()
      .from(table as any)
      .where(eq(idField as any, id) as any);
    
    return results[0] as T | undefined;
  } catch (error) {
    logger.error("Error in selectById:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Insert a row into a table
 */
export async function insertInto<T extends Record<string, any>, U extends Record<string, any>>(
  table: AnyTable,
  data: U
): Promise<T> {
  try {
    const results = await db.insert(table as any)
      .values(data as any)
      .returning();
    
    return results[0] as T;
  } catch (error) {
    logger.error("Error in insertInto:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

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
export async function batchInsert<T extends Record<string, any>, U extends Record<string, any>>(
  table: AnyTable,
  data: U[],
  batchSize: number = 100,
  continueOnError: boolean = false
): Promise<T[]> {
  if (!data || data.length === 0) {
    return [];
  }
  
  // Helper function to chunk array
  const chunkArray = <V>(arr: V[], size: number): V[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  };
  
  // Chunk the data into batches
  const batches = chunkArray(data, batchSize);
  logger.info(`Batch inserting ${data.length} records in ${batches.length} batches of size ${batchSize}`);
  
  const results: T[] = [];
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      logger.debug(`Processing batch ${i + 1}/${batches.length} (${batch.length} records)`);
      
      const batchResults = await db.insert(table as any)
        .values(batch as any)
        .returning();
      
      results.push(...(batchResults as T[]));
      
    } catch (error) {
      logger.error(`Error in batch ${i + 1}/${batches.length}:`, { 
        error: error instanceof Error ? error.message : String(error),
        batch: i + 1,
        totalBatches: batches.length
      });
      
      if (!continueOnError) {
        throw error;
      }
    }
  }
  
  logger.info(`Successfully inserted ${results.length}/${data.length} records`);
  return results;
}

/**
 * Update rows in a table
 */
export async function updateWhere<T extends Record<string, any>, U extends Record<string, any>>(
  table: AnyTable,
  data: U,
  whereClause: SQL<unknown>
): Promise<T[]> {
  try {
    const result = await db.update(table as any)
      .set(data as any)
      .where(whereClause as any)
      .returning();
      
    return result as T[];
  } catch (error) {
    logger.error("Error in updateWhere:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Delete rows from a table
 */
export async function deleteWhere<T extends Record<string, any>>(
  table: AnyTable,
  whereClause: SQL<unknown>
): Promise<T[]> {
  try {
    const result = await db.delete(table as any)
      .where(whereClause as any)
      .returning();
      
    return result as T[];
  } catch (error) {
    logger.error("Error in deleteWhere:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Run a raw SQL query
 */
export async function rawQuery<T extends Record<string, any>>(
  query: SQL<unknown>
): Promise<T[]> {
  try {
    const result = await db.execute(query as any);
    return result as T[];
  } catch (error) {
    logger.error("Error in rawQuery:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Type assertion for PgTable
 * Use this when you need to pass a table to a function that expects a PgTable type
 */
export function asPgTable(table: any): any {
  return table as any;
}

/**
 * Safely execute a transaction
 * @param callback Function that performs operations within the transaction
 */
export async function transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  try {
    return await db.transaction(async (tx) => {
      return await callback(tx);
    });
  } catch (error) {
    logger.error("Transaction error:", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
} 
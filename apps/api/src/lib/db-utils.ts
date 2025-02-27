import { db } from "@repo/db";

/**
 * Helper functions that wrap drizzle-orm operations to avoid type conflicts
 * when using multiple versions of drizzle-orm in a monorepo
 */

/**
 * Execute a SELECT query safely with proper typing
 */
export async function selectFrom(table: any) {
  return db.select().from(table);
}

/**
 * Perform a WHERE clause safely with proper typing
 */
export async function selectWhere(table: any, whereCondition: any, orderByColumn?: any) {
  // To bypass the type conflicts, we need to use 'any' and manually create the query
  const query = db.select().from(table);
  
  // Apply the WHERE condition using a custom condition object
  const result = query.where(() => whereCondition as any);
  
  // Apply orderBy if provided
  if (orderByColumn) {
    return result.orderBy(() => orderByColumn as any);
  }
  
  return result;
}

/**
 * Insert data into a table safely
 */
export async function insertInto(table: any, data: any) {
  return db.insert(table).values(data);
}

/**
 * Create a safe custom condition object
 * This bypasses the SQL type conflict by returning a simple object
 */
export function safeEq(column: any, value: any): any {
  // Return a condition object that can be used directly in the WHERE clause
  return {
    operator: "=",
    left: column,
    right: value,
    toSQL: () => ({ sql: `${column.name} = ?`, params: [value] })
  };
} 
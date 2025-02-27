/**
 * Helper functions that wrap drizzle-orm operations to avoid type conflicts
 * when using multiple versions of drizzle-orm in a monorepo
 */
/**
 * Execute a SELECT query safely with proper typing
 */
export declare function selectFrom(table: any): Promise<any>;
/**
 * Perform a WHERE clause safely with proper typing
 */
export declare function selectWhere(table: any, whereCondition: any, orderByColumn?: any): Promise<any>;
/**
 * Insert data into a table safely
 */
export declare function insertInto(table: any, data: any): Promise<any>;
/**
 * Create a safe custom condition object
 * This bypasses the SQL type conflict by returning a simple object
 */
export declare function safeEq(column: any, value: any): any;

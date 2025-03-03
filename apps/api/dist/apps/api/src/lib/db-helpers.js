/**
 * Database Helper Functions
 *
 * This file contains helper functions for working with the database
 * that handle type assertions internally, preventing the need
 * for excessive `as any` casts throughout the codebase.
 */
import { db } from "@repo/db";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { logger } from "@repo/logger";
/**
 * Wrap a table with a safer interface for type-checking
 */
export function safeTable(table) {
    return new Proxy({}, {
        get: (target, prop) => {
            if (typeof prop === 'string') {
                return table[prop];
            }
            return undefined;
        }
    });
}
/**
 * Get a column from a table with the right type
 */
export function tableColumn(table, columnName) {
    return table[columnName];
}
/**
 * Create a safe equals condition
 */
export function safeEq(field, value) {
    return eq(field, value);
}
/**
 * Create a safe AND condition
 */
export function safeAnd(...conditions) {
    return and(...conditions);
}
/**
 * Create a safe OR condition
 */
export function safeOr(...conditions) {
    return or(...conditions);
}
/**
 * Create a safe JOIN condition
 */
export function safeJoin(table, condition) {
    return { table: table, on: condition };
}
/**
 * Create a safe ORDER BY DESC expression
 */
export function safeDesc(field) {
    return desc(field);
}
/**
 * Create a safe ORDER BY ASC expression
 */
export function safeAsc(field) {
    return asc(field);
}
/**
 * Select all rows from a table
 */
export async function selectAll(table) {
    try {
        const result = await db.select().from(table);
        return result;
    }
    catch (error) {
        logger.error("Error in selectAll:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
/**
 * Select rows from a table with a where clause
 */
export async function selectWhere(table, whereClause, orderBy, limit) {
    try {
        let query = db.select().from(table);
        if (whereClause) {
            query = query.where(whereClause);
        }
        if (orderBy) {
            query = query.orderBy(orderBy);
        }
        if (limit) {
            query = query.limit(limit);
        }
        const result = await query;
        return result;
    }
    catch (error) {
        logger.error("Error in selectWhere:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
/**
 * Select a single row by its ID
 */
export async function selectById(table, idField, id) {
    try {
        const results = await db.select()
            .from(table)
            .where(eq(idField, id));
        return results[0];
    }
    catch (error) {
        logger.error("Error in selectById:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
/**
 * Insert a row into a table
 */
export async function insertInto(table, data) {
    try {
        const results = await db.insert(table)
            .values(data)
            .returning();
        return results[0];
    }
    catch (error) {
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
export async function batchInsert(table, data, batchSize = 100, continueOnError = false) {
    if (!data || data.length === 0) {
        return [];
    }
    // Helper function to chunk array
    const chunkArray = (arr, size) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
    };
    // Chunk the data into batches
    const batches = chunkArray(data, batchSize);
    logger.info(`Batch inserting ${data.length} records in ${batches.length} batches of size ${batchSize}`);
    const results = [];
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
            logger.debug(`Processing batch ${i + 1}/${batches.length} (${batch.length} records)`);
            const batchResults = await db.insert(table)
                .values(batch)
                .returning();
            results.push(...batchResults);
        }
        catch (error) {
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
export async function updateWhere(table, data, whereClause) {
    try {
        const result = await db.update(table)
            .set(data)
            .where(whereClause)
            .returning();
        return result;
    }
    catch (error) {
        logger.error("Error in updateWhere:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
/**
 * Delete rows from a table
 */
export async function deleteWhere(table, whereClause) {
    try {
        const result = await db.delete(table)
            .where(whereClause)
            .returning();
        return result;
    }
    catch (error) {
        logger.error("Error in deleteWhere:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
/**
 * Run a raw SQL query
 */
export async function rawQuery(query) {
    try {
        const result = await db.execute(query);
        return result;
    }
    catch (error) {
        logger.error("Error in rawQuery:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
/**
 * Type assertion for PgTable
 * Use this when you need to pass a table to a function that expects a PgTable type
 */
export function asPgTable(table) {
    return table;
}
/**
 * Safely execute a transaction
 * @param callback Function that performs operations within the transaction
 */
export async function transaction(callback) {
    try {
        return await db.transaction(async (tx) => {
            return await callback(tx);
        });
    }
    catch (error) {
        logger.error("Transaction error:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
//# sourceMappingURL=db-helpers.js.map
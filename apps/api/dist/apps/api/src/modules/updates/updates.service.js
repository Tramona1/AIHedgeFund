import { db } from "@repo/db";
import { generateId, IDPrefix } from "@repo/id";
import { createComponentLogger } from "@repo/logger";
import { selectWhere, insertInto, selectAll, safeEq } from "../../lib/db-helpers.js";
// Get the schema tables from the DB instance
const { stockUpdates } = db._.schema;
// Create a component-specific logger
const updateLogger = createComponentLogger("updates-service");
export const updatesService = {
    /**
     * Create a new stock update and store it in the database
     */
    async createStockUpdate(data) {
        try {
            const id = generateId(IDPrefix.STOCK_UPDATE);
            const now = new Date();
            await insertInto(stockUpdates, {
                id,
                ...data,
                createdAt: now,
            });
            updateLogger.info("Created stock update", { id, symbol: data.symbol });
            return id;
        }
        catch (error) {
            updateLogger.error("Error creating stock update", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                symbol: data.symbol
            });
            throw error;
        }
    },
    /**
     * Get stock updates by ticker
     */
    async getStockUpdatesByTicker(ticker) {
        return selectWhere(stockUpdates, ticker ? safeEq(stockUpdates['symbol'], ticker) : undefined);
    },
    /**
     * Get all stock updates (admin/testing purposes for Phase 1)
     */
    async getAllStockUpdates() {
        return selectAll(stockUpdates);
    },
};
//# sourceMappingURL=updates.service.js.map
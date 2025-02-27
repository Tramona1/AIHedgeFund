import { db, stockUpdates } from "@repo/db";
import { generateId, IDPrefix } from "@repo/id";
import { createComponentLogger } from "@repo/logger";
import { safeEq, selectWhere } from "../../lib/db-utils";
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
            await db.insert(stockUpdates).values({
                id,
                ...data,
                createdAt: now,
            });
            updateLogger.info("Created stock update", { id, ticker: data.ticker });
            return id;
        }
        catch (error) {
            updateLogger.error("Error creating stock update", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                ticker: data.ticker
            });
            throw error;
        }
    },
    /**
     * Get stock updates by ticker
     */
    async getStockUpdatesByTicker(ticker) {
        return selectWhere(stockUpdates, safeEq(stockUpdates.ticker, ticker), stockUpdates.createdAt);
    },
    /**
     * Get all stock updates (admin/testing purposes for Phase 1)
     */
    async getAllStockUpdates() {
        return db.select()
            .from(stockUpdates)
            .orderBy(stockUpdates.createdAt);
    },
};
//# sourceMappingURL=updates.service.js.map
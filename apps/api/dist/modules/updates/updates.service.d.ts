import { type NewStockUpdate } from "@repo/db";
export declare const updatesService: {
    /**
     * Create a new stock update and store it in the database
     */
    createStockUpdate(data: Omit<NewStockUpdate, "id" | "createdAt">): Promise<string>;
    /**
     * Get stock updates by ticker
     */
    getStockUpdatesByTicker(ticker: string): Promise<any>;
    /**
     * Get all stock updates (admin/testing purposes for Phase 1)
     */
    getAllStockUpdates(): Promise<any>;
};

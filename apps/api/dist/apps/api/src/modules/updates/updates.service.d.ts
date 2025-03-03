interface NewStockUpdate {
    id?: string;
    ticker: string;
    eventType: string;
    title: string;
    content: string;
    details?: any;
    source: string;
    createdAt?: Date;
    sentAt?: Date | null;
    symbol?: string;
}
export declare const updatesService: {
    /**
     * Create a new stock update and store it in the database
     */
    createStockUpdate(data: Omit<NewStockUpdate, "id" | "createdAt">): Promise<string>;
    /**
     * Get stock updates by ticker
     */
    getStockUpdatesByTicker(ticker: string): Promise<Record<string, any>[]>;
    /**
     * Get all stock updates (admin/testing purposes for Phase 1)
     */
    getAllStockUpdates(): Promise<Record<string, any>[]>;
};
export {};

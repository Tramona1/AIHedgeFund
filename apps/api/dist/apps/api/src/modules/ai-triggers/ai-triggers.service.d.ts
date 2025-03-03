export declare const aiTriggersService: {
    /**
     * Register an AI trigger event
     */
    registerTrigger(data: {
        ticker: string;
        event_type: string;
        details?: any;
    }): Promise<{
        id: string;
    }>;
    /**
     * Get recent AI triggers by ticker
     */
    getRecentTriggers(ticker: string): Promise<any[]>;
    /**
     * Get all AI triggers
     */
    getAllTriggers(): Promise<any[]>;
};

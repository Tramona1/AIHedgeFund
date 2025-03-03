import { logger } from "@repo/logger";
// Create component logger
const serviceLogger = logger.child({ component: "ai-triggers-service" });
// AI Triggers Service with mocked functions
export const aiTriggersService = {
    /**
     * Register an AI trigger event
     */
    async registerTrigger(data) {
        serviceLogger.info("Registering AI trigger", { ticker: data.ticker, eventType: data.event_type });
        // Return a mock response
        return {
            id: `trigger_${Date.now()}`
        };
    },
    /**
     * Get recent AI triggers by ticker
     */
    async getRecentTriggers(ticker) {
        serviceLogger.info("Getting recent triggers", { ticker });
        // Return mock data
        return [];
    },
    /**
     * Get all AI triggers
     */
    async getAllTriggers() {
        serviceLogger.info("Getting all triggers");
        // Return mock data
        return [];
    }
};
//# sourceMappingURL=ai-triggers.service.js.map
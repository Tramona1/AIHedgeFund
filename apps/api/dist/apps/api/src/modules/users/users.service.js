import { generateId, IDPrefix } from "@repo/id";
import { createComponentLogger } from "@repo/logger";
// Create a component-specific logger
const userLogger = createComponentLogger("users-service");
// In-memory storage for testing
const userPreferencesStore = new Map();
export const usersService = {
    /**
     * Create or update user preferences
     */
    async createOrUpdateUserPreferences(data) {
        try {
            userLogger.info("Handling user preferences update", { userId: data.userId });
            const now = new Date();
            // Store in memory
            userPreferencesStore.set(data.userId, {
                id: generateId(IDPrefix.USER),
                ...data,
                createdAt: now,
                updatedAt: now
            });
            userLogger.info("Successfully handled user preferences", { userId: data.userId });
        }
        catch (error) {
            userLogger.error("Error handling user preferences", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: data.userId
            });
            throw error;
        }
    },
    /**
     * Get user preferences by user ID
     */
    async getUserPreferences(userId) {
        userLogger.info("Getting user preferences", { userId });
        const preferences = userPreferencesStore.get(userId);
        return preferences ? [preferences] : [];
    },
    /**
     * Get all users (admin/testing purposes for Phase 1)
     */
    async getAllUsers() {
        try {
            userLogger.info("Getting all users");
            return Array.from(userPreferencesStore.values());
        }
        catch (error) {
            userLogger.error("Error fetching users", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            return [];
        }
    },
};
//# sourceMappingURL=users.service.js.map
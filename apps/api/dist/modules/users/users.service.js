import { db, userPreferences } from "@repo/db";
import { generateId, IDPrefix } from "@repo/id";
import { createComponentLogger } from "@repo/logger";
import { safeEq, selectWhere } from "../../lib/db-utils";
// Create a component-specific logger
const userLogger = createComponentLogger("users-service");
export const usersService = {
    /**
     * Create or update user preferences
     */
    async createOrUpdateUserPreferences(data) {
        try {
            userLogger.info("Handling user preferences update", { userId: data.userId });
            // Check if user exists
            const existingUser = await selectWhere(userPreferences, safeEq(userPreferences.userId, data.userId));
            if (existingUser.length > 0) {
                // Update existing user preferences
                userLogger.info("Updating existing user preferences", { userId: data.userId });
                await db.update(userPreferences)
                    .set({
                    ...data,
                    updatedAt: new Date(),
                })
                    .where(safeEq(userPreferences.userId, data.userId));
            }
            else {
                // Create new user preferences
                userLogger.info("Creating new user preferences", { userId: data.userId });
                const id = generateId(IDPrefix.USER);
                const now = new Date();
                await db.insert(userPreferences).values({
                    id,
                    ...data,
                    createdAt: now,
                    updatedAt: now,
                });
            }
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
        return selectWhere(userPreferences, safeEq(userPreferences.userId, userId));
    },
    /**
     * Get all users (admin/testing purposes for Phase 1)
     */
    async getAllUsers() {
        return db.select().from(userPreferences);
    },
};
//# sourceMappingURL=users.service.js.map
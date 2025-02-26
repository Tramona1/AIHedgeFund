import { db, userPreferences, NewUserPreferences } from "@repo/db";
import { generateId, IDPrefix } from "@repo/id";
import { logger } from "@repo/logger";
import { eq } from "drizzle-orm";

// Create a component-specific logger
const userLogger = logger.child({ component: "users-service" });

export const usersService = {
  /**
   * Create or update user preferences
   */
  async createOrUpdateUserPreferences(data: Omit<NewUserPreferences, "id">): Promise<void> {
    try {
      userLogger.info("Creating/updating user preferences", { userId: data.userId });
      
      // Check if user exists
      const existingUser = await db.select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, data.userId))
        .limit(1);
      
      if (existingUser.length > 0) {
        // Update existing user
        await db.update(userPreferences)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, data.userId));
          
        userLogger.info("Updated user preferences", { userId: data.userId });
      } else {
        // Create new user
        await db.insert(userPreferences).values({
          id: generateId(IDPrefix.USER),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        userLogger.info("Created new user preferences", { userId: data.userId });
      }
    } catch (error) {
      userLogger.error("Error creating/updating user preferences", { 
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
  async getUserPreferences(userId: string) {
    return db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
  },
  
  /**
   * Get all users (primarily for admin/testing purposes in Phase 1)
   */
  async getAllUsers() {
    return db.select().from(userPreferences);
  },
}; 
import { type NewUserPreferences } from "@repo/db";
export declare const usersService: {
    /**
     * Create or update user preferences
     */
    createOrUpdateUserPreferences(data: Omit<NewUserPreferences, "id">): Promise<void>;
    /**
     * Get user preferences by user ID
     */
    getUserPreferences(userId: string): Promise<any[]>;
    /**
     * Get all users (admin/testing purposes for Phase 1)
     */
    getAllUsers(): Promise<any[]>;
};

export declare class NewsletterService {
    /**
     * Get a user's newsletter preferences
     * @param userId User ID
     * @returns Newsletter preferences or null if not found
     */
    getUserPreferences(userId: string): Promise<Record<string, any>>;
    /**
     * Create or update a user's newsletter preferences
     * @param userId User ID
     * @param email User email
     * @param preferences Newsletter preferences object
     * @returns The created or updated preferences
     */
    upsertPreferences(userId: string, email: string, preferences: any): Promise<Record<string, any>>;
    /**
     * Toggle a user's newsletter subscription status
     * @param userId User ID
     * @param isSubscribed Whether the user is subscribed
     * @returns The updated preferences
     */
    toggleSubscription(userId: string, isSubscribed: boolean): Promise<Record<string, any>>;
    /**
     * Get all users subscribed to the newsletter
     * @returns List of subscribed users
     */
    getAllSubscribedUsers(): Promise<Record<string, any>[]>;
    /**
     * Record a newsletter delivery to a user
     * @param userId User ID
     * @returns The updated preferences
     */
    recordDelivery(userId: string): Promise<Record<string, any>>;
}
export declare const newsletterService: NewsletterService;

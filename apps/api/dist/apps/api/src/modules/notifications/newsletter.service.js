// @ts-ignore: Module resolution will be handled through declaration files
import { db } from "@repo/db";
import { logger } from "@repo/logger";
import { selectWhere, insertInto, updateWhere, safeEq, safeTable } from "../../lib/db-helpers.js";
// Get schema tables directly from the DB instance
const { newsletterPreferences } = db._.schema;
// Create type-safe table proxy
const safeNewsletterPreferences = safeTable(newsletterPreferences);
const newsletterLogger = logger.child({ module: 'newsletter-service' });
export class NewsletterService {
    /**
     * Get a user's newsletter preferences
     * @param userId User ID
     * @returns Newsletter preferences or null if not found
     */
    async getUserPreferences(userId) {
        try {
            newsletterLogger.debug('Fetching user newsletter preferences', { userId });
            const [preferences] = await selectWhere(newsletterPreferences, safeEq(safeNewsletterPreferences.userId, userId));
            return preferences || null;
        }
        catch (error) {
            newsletterLogger.error('Error fetching user newsletter preferences', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to fetch newsletter preferences');
        }
    }
    /**
     * Create or update a user's newsletter preferences
     * @param userId User ID
     * @param email User email
     * @param preferences Newsletter preferences object
     * @returns The created or updated preferences
     */
    async upsertPreferences(userId, email, preferences) {
        try {
            newsletterLogger.info('Upserting newsletter preferences', { userId });
            // Check if user has existing preferences
            const existing = await this.getUserPreferences(userId);
            if (existing) {
                // Update existing preferences
                const [updated] = await updateWhere(newsletterPreferences, {
                    email,
                    preferences: JSON.stringify(preferences),
                    updatedAt: new Date()
                }, safeEq(safeNewsletterPreferences.userId, userId));
                newsletterLogger.info('Updated newsletter preferences', { userId });
                return updated;
            }
            else {
                // Create new preferences
                const created = await insertInto(newsletterPreferences, {
                    userId,
                    email,
                    preferences: JSON.stringify(preferences),
                    isSubscribed: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                newsletterLogger.info('Created newsletter preferences', { userId });
                return created;
            }
        }
        catch (error) {
            newsletterLogger.error('Error upserting newsletter preferences', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to update newsletter preferences');
        }
    }
    /**
     * Toggle a user's newsletter subscription status
     * @param userId User ID
     * @param isSubscribed Whether the user is subscribed
     * @returns The updated preferences
     */
    async toggleSubscription(userId, isSubscribed) {
        try {
            newsletterLogger.info('Toggling newsletter subscription', { userId, isSubscribed });
            // Check if user has existing preferences
            const existing = await this.getUserPreferences(userId);
            if (!existing) {
                throw new Error('User has no newsletter preferences');
            }
            // Update subscription status
            const [updated] = await updateWhere(newsletterPreferences, {
                isSubscribed,
                updatedAt: new Date()
            }, safeEq(safeNewsletterPreferences.userId, userId));
            newsletterLogger.info('Toggled newsletter subscription', {
                userId,
                isSubscribed
            });
            return updated;
        }
        catch (error) {
            newsletterLogger.error('Error toggling newsletter subscription', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to toggle newsletter subscription');
        }
    }
    /**
     * Get all users subscribed to the newsletter
     * @returns List of subscribed users
     */
    async getAllSubscribedUsers() {
        try {
            newsletterLogger.debug('Fetching all subscribed users');
            const subscribers = await selectWhere(newsletterPreferences, safeEq(safeNewsletterPreferences.isSubscribed, true));
            newsletterLogger.info('Fetched subscribed users', {
                count: subscribers.length
            });
            return subscribers;
        }
        catch (error) {
            newsletterLogger.error('Error fetching subscribed users', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to fetch subscribed users');
        }
    }
    /**
     * Record a newsletter delivery to a user
     * @param userId User ID
     * @returns The updated preferences
     */
    async recordDelivery(userId) {
        try {
            newsletterLogger.debug('Recording newsletter delivery', { userId });
            const [updated] = await updateWhere(newsletterPreferences, {
                lastDelivery: new Date(),
                updatedAt: new Date()
            }, safeEq(safeNewsletterPreferences.userId, userId));
            newsletterLogger.info('Recorded newsletter delivery', { userId });
            return updated;
        }
        catch (error) {
            newsletterLogger.error('Error recording newsletter delivery', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to record newsletter delivery');
        }
    }
}
// Export a singleton instance
export const newsletterService = new NewsletterService();
//# sourceMappingURL=newsletter.service.js.map
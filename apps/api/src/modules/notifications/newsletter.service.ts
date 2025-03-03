// @ts-ignore: Module resolution will be handled through declaration files
import { db } from "@repo/db";
// @ts-ignore: Module resolution will be handled through declaration files
import { newsletterPreferences } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@repo/logger";

const newsletterLogger = logger.child({ module: 'newsletter-service' });

export class NewsletterService {
  /**
   * Get a user's newsletter preferences
   * @param userId User ID
   * @returns Newsletter preferences or null if not found
   */
  async getUserPreferences(userId: string) {
    try {
      const [preferences] = await db
        .select()
        .from(newsletterPreferences)
        .where(eq(newsletterPreferences.userId, userId) as any);
      
      return preferences || null;
    } catch (error) {
      newsletterLogger.error('Error fetching user newsletter preferences', { userId, error });
      throw new Error('Failed to fetch newsletter preferences');
    }
  }

  /**
   * Create or update a user's newsletter preferences
   * @param userId User ID
   * @param email User email
   * @param preferences Newsletter preferences to update
   * @returns Updated preferences
   */
  async upsertPreferences(userId: string, email: string, preferences: any) {
    try {
      // Check if preferences exist
      const existing = await this.getUserPreferences(userId);
      
      if (existing) {
        // Update existing preferences
        const [updated] = await db
          .update(newsletterPreferences)
          .set({
            ...preferences,
            updatedAt: new Date(),
          })
          .where(eq(newsletterPreferences.userId, userId) as any)
          .returning();
        
        newsletterLogger.info('Updated newsletter preferences', { userId });
        return updated;
      } else {
        // Create new preferences
        const [created] = await db
          .insert(newsletterPreferences)
          .values({
            userId,
            email,
            ...preferences,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        newsletterLogger.info('Created newsletter preferences', { userId });
        return created;
      }
    } catch (error) {
      newsletterLogger.error('Error updating newsletter preferences', { userId, error });
      throw new Error('Failed to update newsletter preferences');
    }
  }

  /**
   * Toggle a user's subscription status
   * @param userId User ID
   * @param isSubscribed Whether the user is subscribed
   * @returns Updated preferences
   */
  async toggleSubscription(userId: string, isSubscribed: boolean) {
    try {
      const [updated] = await db
        .update(newsletterPreferences)
        .set({ 
          isSubscribed,
          updatedAt: new Date(),
        })
        .where(eq(newsletterPreferences.userId, userId) as any)
        .returning();
      
      if (!updated) {
        throw new Error('No preferences found for user');
      }
      
      newsletterLogger.info(`User ${isSubscribed ? 'subscribed to' : 'unsubscribed from'} newsletter`, { userId });
      return updated;
    } catch (error) {
      newsletterLogger.error('Error toggling newsletter subscription', { userId, error });
      throw new Error('Failed to update subscription status');
    }
  }

  /**
   * Get all subscribed users
   * @returns Array of subscribed users with their preferences
   */
  async getAllSubscribedUsers() {
    try {
      const subscribers = await db
        .select()
        .from(newsletterPreferences)
        .where(eq(newsletterPreferences.isSubscribed, true));
      
      newsletterLogger.info(`Found ${subscribers.length} newsletter subscribers`);
      return subscribers;
    } catch (error) {
      newsletterLogger.error('Error fetching newsletter subscribers', { error });
      throw new Error('Failed to fetch newsletter subscribers');
    }
  }

  /**
   * Record that a newsletter was sent to a user
   * @param userId User ID
   * @returns Updated preferences
   */
  async recordDelivery(userId: string) {
    try {
      const [updated] = await db
        .update(newsletterPreferences)
        .set({ 
          lastDelivery: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(newsletterPreferences.userId, userId) as any)
        .returning();
      
      if (!updated) {
        throw new Error('No preferences found for user');
      }
      
      newsletterLogger.info('Recorded newsletter delivery', { userId });
      return updated;
    } catch (error) {
      newsletterLogger.error('Error recording newsletter delivery', { userId, error });
      throw new Error('Failed to record newsletter delivery');
    }
  }
}

// Export singleton instance
export const newsletterService = new NewsletterService(); 
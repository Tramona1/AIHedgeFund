/**
 * Type declarations for notifications.service.js
 */

export interface NotificationsService {
  /**
   * Send stock update email to users who are interested in the ticker
   */
  sendStockUpdateEmail(
    ticker: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void>;

  /**
   * Generate email content based on event type
   */
  generateEmailContent(
    ticker: string,
    eventType: string,
    details: Record<string, any>
  ): { subject: string; content: string };
}

export const notificationsService: NotificationsService; 
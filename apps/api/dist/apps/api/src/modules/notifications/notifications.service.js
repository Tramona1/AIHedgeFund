import { db, userPreferences, stockEvents } from "@repo/db";
import { logger } from "@repo/logger";
import { sql } from "drizzle-orm";
import sgMail from '@sendgrid/mail';
// Create a component-specific logger
const notificationLogger = logger.child({ component: "notifications-service" });
// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
export const notificationsService = {
    /**
     * Send stock update email to users who are interested in the ticker
     */
    async sendStockUpdateEmail(ticker, eventType, details) {
        try {
            // Check if SendGrid is properly configured
            if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
                notificationLogger.warn("SendGrid not configured. Skipping email notifications.", {
                    missingEnv: !process.env.SENDGRID_API_KEY ? "SENDGRID_API_KEY" : "SENDGRID_FROM_EMAIL"
                });
                return;
            }
            // Find users who should receive this notification based on preferences
            notificationLogger.info(`Looking for users interested in ${ticker}`);
            try {
                // Use raw SQL for array contains operation
                const arrayContainsQuery = sql `${userPreferences.tickers} @> ARRAY[${ticker}]::text[]`;
                const usersToNotify = await db
                    .select()
                    .from(userPreferences)
                    .where(arrayContainsQuery);
                notificationLogger.info(`Found ${usersToNotify.length} users to notify about ${ticker} ${eventType}`);
                // If no users to notify, exit early
                if (usersToNotify.length === 0) {
                    notificationLogger.info(`No users found with interest in ${ticker}`);
                    return;
                }
                // Generate email content
                const { subject, content } = this.generateEmailContent(ticker, eventType, details);
                // Send emails to each user
                const emailPromises = usersToNotify.map(async (user) => {
                    // Skip users who don't want this frequency
                    // For Phase 1, we just send everything
                    // In Phase 2, we'll respect frequency preferences more granularly
                    const msg = {
                        to: user.email,
                        from: process.env.SENDGRID_FROM_EMAIL,
                        subject,
                        text: content, // Plain text version
                        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                     <h2 style="color: #333;">${subject}</h2>
                     <p>${content.replace(/\n/g, '<br>')}</p>
                     <hr style="border: 1px solid #eee; margin: 20px 0;" />
                     <p style="color: #666; font-size: 12px;">
                       This is an automated update from AI Hedge Fund based on your preferences.
                       <br>You can adjust your notification settings in your 
                       <a href="${process.env.NEXT_PUBLIC_WEB_URL || 'https://aihedgefund.com'}/preferences">account preferences</a>.
                     </p>
                   </div>`,
                    };
                    try {
                        await sgMail.send(msg);
                        notificationLogger.info(`Email sent to ${user.email} about ${ticker}`);
                    }
                    catch (emailError) {
                        notificationLogger.error(`Failed to send email to ${user.email}`, {
                            error: emailError instanceof Error ? emailError.message : String(emailError)
                        });
                    }
                });
                // Wait for all emails to be sent
                await Promise.all(emailPromises);
                notificationLogger.info(`Completed sending ${usersToNotify.length} emails for ${ticker} ${eventType}`);
            }
            catch (dbError) {
                notificationLogger.error("Database error while finding users to notify", {
                    error: dbError instanceof Error ? dbError.message : String(dbError),
                    stack: dbError instanceof Error ? dbError.stack : undefined,
                    ticker
                });
            }
        }
        catch (error) {
            notificationLogger.error("Error sending stock update emails", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                ticker,
                eventType
            });
            throw error;
        }
    },
    /**
     * Generate email content based on event type
     */
    generateEmailContent(ticker, eventType, details) {
        let subject = "";
        let content = "";
        // Format the content based on event type
        switch (eventType) {
            case "hedge_fund_buy":
                {
                    const fund = details.fund || "A major hedge fund";
                    const shares = details.shares ? Number(details.shares).toLocaleString() : "a significant number of";
                    const value = details.sharesValue ? `$${Number(details.sharesValue).toLocaleString()}` : "undisclosed amount";
                    subject = `${fund} just bought ${ticker} shares`;
                    content = `${fund} has purchased ${shares} shares of ${ticker} worth approximately ${value}.\n\n`;
                    if (details.source) {
                        content += `Source: ${details.source}\n`;
                    }
                    content += `\nThis could indicate institutional confidence in ${ticker}. Remember to conduct your own research before making investment decisions.`;
                }
                break;
            case "hedge_fund_sell":
                {
                    const fund = details.fund || "A major hedge fund";
                    const shares = details.shares ? Number(details.shares).toLocaleString() : "a significant number of";
                    const value = details.sharesValue ? `$${Number(details.sharesValue).toLocaleString()}` : "undisclosed amount";
                    subject = `${fund} just sold ${ticker} shares`;
                    content = `${fund} has sold ${shares} shares of ${ticker} worth approximately ${value}.\n\n`;
                    if (details.source) {
                        content += `Source: ${details.source}\n`;
                    }
                    content += `\nThis could indicate reduced institutional confidence in ${ticker}. Remember to conduct your own research before making investment decisions.`;
                }
                break;
            case "investor_mention":
                {
                    const investor = details.investor || "A notable investor";
                    subject = `${investor} mentioned ${ticker}`;
                    content = `${investor} has mentioned ${ticker} recently.\n\n`;
                    if (details.source) {
                        content += `Source: ${details.source}\n`;
                    }
                    content += `\nThis could be worth noting as part of your research on ${ticker}.`;
                }
                break;
            case "politician_buy":
                {
                    const politician = details.investor || "A member of Congress";
                    const shares = details.shares ? Number(details.shares).toLocaleString() : "an undisclosed number of";
                    const value = details.sharesValue ? `$${Number(details.sharesValue).toLocaleString()}` : "undisclosed amount";
                    subject = `${politician} purchased ${ticker} shares`;
                    content = `${politician} has reported buying ${shares} shares of ${ticker} worth approximately ${value}.\n\n`;
                    if (details.source) {
                        content += `Source: ${details.source}\n`;
                    }
                    content += `\nCongressional trading activity can be significant as lawmakers may have access to information not available to the public. Remember to conduct your own research before making investment decisions.`;
                }
                break;
            case "politician_sell":
                {
                    const politician = details.investor || "A member of Congress";
                    const shares = details.shares ? Number(details.shares).toLocaleString() : "an undisclosed number of";
                    const value = details.sharesValue ? `$${Number(details.sharesValue).toLocaleString()}` : "undisclosed amount";
                    subject = `${politician} sold ${ticker} shares`;
                    content = `${politician} has reported selling ${shares} shares of ${ticker} worth approximately ${value}.\n\n`;
                    if (details.source) {
                        content += `Source: ${details.source}\n`;
                    }
                    content += `\nCongressional trading activity can be significant as lawmakers may have access to information not available to the public. Remember to conduct your own research before making investment decisions.`;
                }
                break;
            default:
                subject = `New alert for ${ticker}: ${eventType.replace(/_/g, ' ')}`;
                content = `There's a new update for ${ticker} regarding ${eventType.replace(/_/g, ' ')}.\n\n`;
                if (details.source) {
                    content += `Source: ${details.source}\n`;
                }
        }
        // Add a common footer
        content += "\n\n---\nThis automated update is based on your AI Hedge Fund preferences.";
        return { subject, content };
    },
};
//# sourceMappingURL=notifications.service.js.map
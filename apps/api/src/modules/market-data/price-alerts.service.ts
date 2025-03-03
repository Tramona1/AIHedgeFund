import { logger } from "@repo/logger";
import { db } from "@repo/db";
import { stockData, userWatchlist } from "@repo/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

// Create a module-specific logger
const alertsLogger = logger.child({ module: "price-alerts-service" });

/**
 * Price alert types
 */
export enum PriceAlertType {
  PRICE_THRESHOLD = "price_threshold",
  PRICE_CHANGE_PERCENT = "price_change_percent",
  VOLUME_SPIKE = "volume_spike",
  RSI_OVERBOUGHT = "rsi_overbought",
  RSI_OVERSOLD = "rsi_oversold",
}

/**
 * Service to handle price-based alerts and notifications
 */
export class PriceAlertsService {
  /**
   * Check for significant price changes and notify users
   */
  async checkPriceChanges(thresholdPercent: number = 5) {
    try {
      alertsLogger.info(`Checking for price changes above ${thresholdPercent}%`);
      
      // Get all stocks with significant price changes (positive or negative)
      const significantChanges = await db
        .select({
          symbol: stockData.symbol,
          price: stockData.price,
          changePercent: stockData.changePercent,
          previousClose: stockData.previousClose
        })
        .from(stockData)
        .where(
          sql`ABS(${stockData.changePercent}) >= ${thresholdPercent}`
        );
      
      alertsLogger.info(`Found ${significantChanges.length} stocks with significant price changes`);
      
      if (significantChanges.length === 0) {
        return { processed: 0, notified: 0 };
      }
      
      // Get symbols with significant changes
      const symbols = significantChanges.map(stock => stock.symbol);
      
      // Find users watching these stocks
      const watchlistItems = await db
        .select({
          userId: userWatchlist.userId,
          symbol: userWatchlist.symbol
        })
        .from(userWatchlist)
        .where(
          and(
            eq(userWatchlist.isActive, true),
            sql`${userWatchlist.symbol} IN (${symbols.join(',')})` 
          )
        );
      
      // Group watchlist items by user
      const userWatchlists = watchlistItems.reduce((acc, item) => {
        if (!acc[item.userId]) {
          acc[item.userId] = [];
        }
        acc[item.userId].push(item.symbol);
        return acc;
      }, {} as Record<string, string[]>);
      
      // Prepare and send notifications
      let notificationCount = 0;
      
      for (const [userId, userSymbols] of Object.entries(userWatchlists)) {
        const userAlerts = significantChanges.filter(change => 
          userSymbols.includes(change.symbol)
        );
        
        if (userAlerts.length > 0) {
          await this.sendPriceAlertEmail(userId, userAlerts);
          notificationCount++;
        }
      }
      
      alertsLogger.info(`Sent ${notificationCount} price alert notifications`);
      
      return {
        processed: significantChanges.length,
        notified: notificationCount
      };
    } catch (error) {
      alertsLogger.error("Error checking price changes", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Check for price threshold alerts
   */
  async checkPriceThresholds() {
    try {
      alertsLogger.info("Checking price threshold alerts");
      
      // In a real implementation, we would have a price_alerts table
      // where users could set specific thresholds for specific stocks
      // For this demo, we're skipping the DB schema for simplicity
      
      return { processed: 0, notified: 0 };
    } catch (error) {
      alertsLogger.error("Error checking price thresholds", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Check for volume spikes
   */
  async checkVolumeSurges(volumeMultiple: number = 2) {
    try {
      alertsLogger.info(`Checking for volume surges (${volumeMultiple}x average)`);
      
      // In a real implementation, we would compare current volume
      // to average volume for each stock over the past few days
      // For this demo, we're using a simplified approach
      
      return { processed: 0, notified: 0 };
    } catch (error) {
      alertsLogger.error("Error checking volume surges", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Check for RSI overbought/oversold conditions
   */
  async checkRSIAlerts() {
    try {
      alertsLogger.info("Checking RSI alerts");
      
      // In a real implementation, we would check RSI values
      // for overbought (>70) and oversold (<30) conditions
      // For this demo, we're skipping the implementation
      
      return { processed: 0, notified: 0 };
    } catch (error) {
      alertsLogger.error("Error checking RSI alerts", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
  
  /**
   * Send a price alert email to a user
   */
  private async sendPriceAlertEmail(userId: string, alerts: any[]) {
    try {
      // In a real implementation, we would fetch the user's email from the database
      // For this demo, we'll use a placeholder
      const userEmail = "user@example.com"; // Replace with actual user lookup
      
      // Format the alerts for the email
      const alertItems = alerts.map(alert => {
        const direction = alert.changePercent > 0 ? "up" : "down";
        const emoji = alert.changePercent > 0 ? "🔺" : "🔻";
        
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <strong>${alert.symbol}</strong>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              $${alert.price.toFixed(2)}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; color: ${alert.changePercent > 0 ? '#16a34a' : '#dc2626'}">
              ${emoji} ${Math.abs(alert.changePercent).toFixed(2)}% ${direction}
            </td>
          </tr>
        `;
      }).join("");
      
      // Construct the email
      const msg = {
        to: userEmail,
        from: "alerts@aihedgefund.com", // Replace with your verified sender
        subject: `🚨 Price Alert: Significant movements in ${alerts.length} of your watchlist stocks`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0;">Stock Price Alerts</h1>
            </div>
            
            <div style="padding: 24px;">
              <p>We've detected significant price movements in the following stocks on your watchlist:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                <tr style="background-color: #f8fafc;">
                  <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd;">Symbol</th>
                  <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd;">Current Price</th>
                  <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd;">Change</th>
                </tr>
                ${alertItems}
              </table>
              
              <p>
                <a href="https://aihedgefund.com/watchlist" style="display: inline-block; background-color: #1e40af; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px;">
                  View Your Watchlist
                </a>
              </p>
              
              <p style="color: #64748b; font-size: 0.875rem; margin-top: 24px;">
                You're receiving this email because you have enabled price alerts for stocks in your watchlist.
                <br>
                <a href="https://aihedgefund.com/preferences" style="color: #1e40af;">Manage notification preferences</a>
              </p>
            </div>
          </div>
        `
      };
      
      // Skip actual sending in development to avoid using SendGrid quota
      if (process.env.NODE_ENV === "production") {
        await sgMail.send(msg);
        alertsLogger.info(`Sent price alert email to user ${userId}`);
      } else {
        alertsLogger.info(`[DEV] Would send price alert email to user ${userId}`, { emailContent: msg });
      }
      
      return true;
    } catch (error) {
      alertsLogger.error(`Error sending price alert email to user ${userId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return false;
    }
  }
  
  /**
   * Run all price alert checks
   */
  async runAllAlertChecks() {
    try {
      alertsLogger.info("Running all price alert checks");
      
      const results = {
        priceChanges: await this.checkPriceChanges(),
        priceThresholds: await this.checkPriceThresholds(),
        volumeSurges: await this.checkVolumeSurges(),
        rsiAlerts: await this.checkRSIAlerts()
      };
      
      const totalProcessed = 
        results.priceChanges.processed + 
        results.priceThresholds.processed + 
        results.volumeSurges.processed + 
        results.rsiAlerts.processed;
        
      const totalNotified = 
        results.priceChanges.notified + 
        results.priceThresholds.notified + 
        results.volumeSurges.notified + 
        results.rsiAlerts.notified;
      
      alertsLogger.info(`Completed all price alert checks. Processed: ${totalProcessed}, Notified: ${totalNotified}`);
      
      return {
        ...results,
        totalProcessed,
        totalNotified
      };
    } catch (error) {
      alertsLogger.error("Error running all price alert checks", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }
}

// Export a singleton instance
export const priceAlertsService = new PriceAlertsService(); 
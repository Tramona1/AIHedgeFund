import { db } from '@repo/db';
import { logger } from '@repo/logger';
import sgMail from '@sendgrid/mail';
import { newsletterService } from './newsletter.service.js';
import { eq, desc, sql } from 'drizzle-orm';
import { stockData, companyInfo, userWatchlist, optionsFlow, darkPoolData, newsletterPreferences } from '@repo/db/schema';

const newsletterLogger = logger.child({ module: 'weekly-newsletter-service' });

// Configure SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Define interfaces for newsletter content
interface MarketIndex {
  name: string;
  currentValue: number;
  change: number;
  percentChange: number;
}

interface NewsletterContent {
  marketSummary: {
    indices: MarketIndex[];
    marketTrend: string;
    recentNews: any[];
  };
  watchlistUpdates: {
    stocks: {
      companyName: any;
      sector: any;
    }[];
  };
  optionsFlowInsights: {
    recentActivity: Record<string, any>[];
    insights: any[];
  };
  darkPoolActivity: {
    largeBlocks: Record<string, any>[];
    insights: any[];
  };
  recommendations?: any[];
}

// Define proper types for options data
interface OptionsData {
  ticker: string;
  [key: string]: any;
}

// Define proper types for dark pool data
interface DarkPoolTrade {
  volume: number;
  [key: string]: any;
}

class WeeklyNewsletterService {
  /**
   * Generate and send newsletters to all subscribed users
   * @returns Object with counts of sent emails and errors
   */
  async generateAndSendNewsletters() {
    newsletterLogger.info('Starting newsletter generation');
    
    // Get all users with preferences who have subscribed to updates
    const subscribedUsers = await this.getSubscribedUsers();
    
    newsletterLogger.info(`Found ${subscribedUsers.length} subscribed users`);
    
    let sentCount = 0;
    let errorCount = 0;
    
    // Generate and send newsletter for each user
    for (const user of subscribedUsers) {
      try {
        // Check if this user should receive a newsletter based on their frequency and last delivery date
        if (!this.shouldSendNewsletter(user)) {
          continue;
        }
        
        await this.generateAndSendUserNewsletter(user);
        sentCount++;
        
        // Record that we sent a newsletter to this user
        await newsletterService.recordDelivery(user.userId);
      } catch (error) {
        newsletterLogger.error('Error sending newsletter', { userId: user.userId, error });
        errorCount++;
      }
    }
    
    newsletterLogger.info('Completed newsletter generation', { sentCount, errorCount });
    
    return { sentCount, errorCount };
  }

  /**
   * Check if a user should receive a newsletter based on their frequency and last delivery date
   * @param user User with newsletter preferences
   * @returns Boolean indicating if user should receive a newsletter
   */
  private shouldSendNewsletter(user) {
    // If this is their first newsletter, always send it
    if (!user.lastDelivery) {
      return true;
    }

    const now = new Date();
    const lastDelivery = new Date(user.lastDelivery);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const preferredDay = this.getDayNumber(user.preferredDay);
    
    // Check if today is their preferred day
    if (dayOfWeek !== preferredDay) {
      return false;
    }
    
    // Check based on frequency
    const daysSinceLastDelivery = Math.floor((now.getTime() - lastDelivery.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (user.frequency) {
      case 'daily':
        return daysSinceLastDelivery >= 1;
      case 'twice-weekly':
        // For twice weekly, we'll use Monday and Thursday
        return (dayOfWeek === 1 || dayOfWeek === 4) && daysSinceLastDelivery >= 3;
      case 'weekly':
        return daysSinceLastDelivery >= 6;
      case 'bi-weekly':
        return daysSinceLastDelivery >= 13;
      case 'monthly':
        return daysSinceLastDelivery >= 27;
      default:
        return daysSinceLastDelivery >= 6; // Default to weekly
    }
  }
  
  /**
   * Convert day name to number
   * @param dayName Day name (sunday, monday, etc.)
   * @returns Day number (0-6)
   */
  private getDayNumber(dayName) {
    const days = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
    return days[dayName.toLowerCase()] || 0;
  }

  /**
   * Get all users who have subscribed to newsletters
   * @returns Array of users with their preferences
   */
  private async getSubscribedUsers() {
    try {
      return await newsletterService.getAllSubscribedUsers();
    } catch (error) {
      newsletterLogger.error('Error fetching subscribed users', { error });
      return [];
    }
  }

  /**
   * Generate and send a newsletter to a specific user
   * @param user User with newsletter preferences
   */
  private async generateAndSendUserNewsletter(user) {
    try {
      // Generate content based on user preferences
      const content = await this.generateNewsletterContent(user);
      
      // Format the email HTML
      const emailHtml = this.formatEmailHtml(content, user);
      
      // Determine email subject based on frequency
      let frequency = '';
      switch (user.frequency) {
        case 'daily':
          frequency = 'Daily';
          break;
        case 'twice-weekly':
          frequency = 'Bi-Weekly';
          break;
        case 'weekly':
          frequency = 'Weekly';
          break;
        case 'bi-weekly':
          frequency = 'Bi-Weekly';
          break;
        case 'monthly':
          frequency = 'Monthly';
          break;
        default:
          frequency = 'Weekly';
      }
      
      // Send the email
      const msg = {
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'info@aihedgefund.com',
        subject: `Your ${frequency} AI Hedge Fund Market Digest`,
        html: emailHtml,
      };
      
      await sgMail.send(msg);
      newsletterLogger.info('Sent newsletter', { userId: user.userId });
    } catch (error) {
      newsletterLogger.error('Error generating or sending newsletter', { userId: user.userId, error });
      throw error;
    }
  }

  /**
   * Generate newsletter content for a specific user
   */
  private async generateNewsletterContent(user: any): Promise<NewsletterContent> {
    // Create base content object
    const content: NewsletterContent = {
      marketSummary: {
        indices: [],
        marketTrend: '',
        recentNews: []
      },
      watchlistUpdates: {
        stocks: []
      },
      optionsFlowInsights: {
        recentActivity: [],
        insights: []
      },
      darkPoolActivity: {
        largeBlocks: [],
        insights: []
      }
    };
    
    // Get market summary
    content.marketSummary = await this.getMarketSummary();
    
    // Get watchlist updates if user has stocks
    content.watchlistUpdates = await this.getWatchlistUpdates(user.userId);
    
    // Get options flow insights
    content.optionsFlowInsights = await this.getOptionsFlowInsights();
    
    // Get dark pool activity
    content.darkPoolActivity = await this.getDarkPoolActivity();
    
    // Add recommendations based on interests
    const recommendations = await this.getTradingRecommendations(user);
    content.recommendations = recommendations;
    
    return content;
  }

  /**
   * Get a summary of recent market activity
   * @returns Market summary data
   */
  private async getMarketSummary() {
    try {
      // Fetch market indices (e.g., S&P 500, Nasdaq, Dow)
      const indices = ['SPY', 'QQQ', 'DIA'];
      const indexData = await db
        .select()
        .from(stockData)
        .where(sql`${stockData.symbol} IN (${indices.join(',')})`)
        .orderBy(desc(stockData.timestamp));
      
      // Format the data
      const summary = {
        indices: indexData,
        marketTrend: this.analyzeMarketTrend(indexData),
        recentNews: [] // Would be populated from a news API
      };
      
      return summary;
    } catch (error) {
      newsletterLogger.error('Error getting market summary', { error });
      return { indices: [], marketTrend: 'neutral', recentNews: [] };
    }
  }

  /**
   * Get updates for stocks in the user's watchlist
   * @param userId User ID
   * @returns Watchlist updates
   */
  private async getWatchlistUpdates(userId) {
    try {
      // Get user's watchlist
      const watchlist = await db
        .select()
        .from(userWatchlist)
        .where(eq(userWatchlist.userId, userId));
      
      // If empty watchlist, return empty result
      if (!watchlist.length) {
        return { stocks: [] };
      }
      
      // Get symbols from watchlist
      const symbols = watchlist.map(item => item.symbol);
      
      // Fetch recent data for these symbols
      const stocksData = await db
        .select()
        .from(stockData)
        .where(sql`${stockData.symbol} IN (${symbols.join(',')})`)
        .orderBy(desc(stockData.timestamp));
      
      // Fetch company info
      const companiesData = await db
        .select()
        .from(companyInfo)
        .where(sql`${companyInfo.symbol} IN (${symbols.join(',')})`);
      
      // Combine data
      const stocks = stocksData.map(stock => {
        const company = companiesData.find(c => c.symbol === stock.symbol);
        return {
          ...stock,
          companyName: company ? company.name : stock.symbol,
          sector: company ? company.sector : null
        };
      });
      
      return { stocks };
    } catch (error) {
      newsletterLogger.error('Error getting watchlist updates', { userId, error });
      return { stocks: [] };
    }
  }

  /**
   * Get recent options flow insights
   * @returns Options flow data
   */
  private async getOptionsFlowInsights() {
    try {
      // Get recent unusual options activity
      const recentOptions = await db
        .select()
        .from(optionsFlow)
        .orderBy(desc(optionsFlow.timestamp))
        .limit(10);
      
      // Analyze for patterns or notable activity
      const insights = this.analyzeOptionsFlow(recentOptions);
      
      return {
        recentActivity: recentOptions,
        insights
      };
    } catch (error) {
      newsletterLogger.error('Error getting options flow insights', { error });
      return { recentActivity: [], insights: [] };
    }
  }

  /**
   * Get recent dark pool trading activity
   * @returns Dark pool data
   */
  private async getDarkPoolActivity() {
    try {
      // Get recent dark pool activity
      const recentActivity = await db
        .select()
        .from(darkPoolData)
        .orderBy(desc(darkPoolData.timestamp))
        .limit(10);
      
      // Analyze for patterns or notable activity
      const insights = this.analyzeDarkPoolActivity(recentActivity);
      
      return {
        recentActivity,
        insights
      };
    } catch (error) {
      newsletterLogger.error('Error getting dark pool activity', { error });
      return { recentActivity: [], insights: [] };
    }
  }

  /**
   * Get trading recommendations based on user interests
   * @param user User with preferences
   * @returns Trading recommendations
   */
  private async getTradingRecommendations(user) {
    try {
      const recommendations = [];
      
      // Add recommendations based on interests
      if (user.stocks) {
        // Get stock recommendations
        recommendations.push(...await this.getStockRecommendations());
      }
      
      if (user.crypto) {
        // Would add crypto recommendations if we had crypto data
        recommendations.push({
          type: 'crypto',
          message: 'Cryptocurrency markets have been volatile. Consider stable coins for safety.'
        });
      }
      
      // Add similar recommendation logic for other interests
      
      return recommendations;
    } catch (error) {
      newsletterLogger.error('Error getting trading recommendations', { error });
      return [];
    }
  }

  /**
   * Get stock recommendations
   * @returns Array of stock recommendations
   */
  private async getStockRecommendations() {
    // This would be more sophisticated in a real implementation
    return [
      {
        type: 'stock',
        symbol: 'AAPL',
        message: 'Apple shows strong technical indicators with recent product announcements.'
      },
      {
        type: 'stock',
        symbol: 'MSFT',
        message: 'Microsoft continues to benefit from cloud growth and AI investments.'
      }
    ];
  }

  /**
   * Analyze market trend from index data
   * @param indexData Array of index stock data
   * @returns Trend description
   */
  private analyzeMarketTrend(indexData) {
    // Simple analysis - could be more sophisticated
    const spy = indexData.find(i => i.symbol === 'SPY');
    if (!spy) return 'neutral';
    
    if (spy.changePercent > 1) return 'strongly bullish';
    if (spy.changePercent > 0) return 'bullish';
    if (spy.changePercent < -1) return 'strongly bearish';
    if (spy.changePercent < 0) return 'bearish';
    return 'neutral';
  }

  /**
   * Analyze options flow data
   */
  private analyzeOptionsFlow(optionsData: OptionsData[]): any[] {
    const insights: any[] = [];
    
    // Group by ticker
    const byTicker: Record<string, OptionsData[]> = {};
    
    (optionsData as OptionsData[]).forEach(option => {
      if (!byTicker[option.ticker]) {
        byTicker[option.ticker] = [];
      }
      byTicker[option.ticker].push(option);
    });
    
    // Look for patterns
    for (const [ticker, options] of Object.entries(byTicker)) {
      // If multiple contracts for same ticker
      if (options.length > 1) {
        insights.push({
          ticker,
          message: `Unusual options activity detected for ${ticker} with ${options.length} notable trades.`
        });
      }
    }
    
    return insights;
  }

  /**
   * Analyze dark pool activity
   */
  private analyzeDarkPoolActivity(darkPoolData: DarkPoolTrade[]): any[] {
    const insights: any[] = [];
    
    // Group by ticker
    const byTicker: Record<string, DarkPoolTrade[]> = {};
    
    (darkPoolData as DarkPoolTrade[]).forEach(trade => {
      if (!byTicker[trade.ticker]) {
        byTicker[trade.ticker] = [];
      }
      byTicker[trade.ticker].push(trade);
    });
    
    // Look for patterns
    for (const [ticker, trades] of Object.entries(byTicker)) {
      const totalVolume = trades.reduce((sum, trade) => sum + trade.volume, 0);
      
      // If significant volume
      if (totalVolume > 100000) {
        insights.push({
          ticker,
          message: `Large dark pool volume detected for ${ticker} with ${totalVolume.toLocaleString()} shares.`
        });
      }
    }
    
    return insights;
  }

  /**
   * Format newsletter content into HTML email
   * @param content Newsletter content
   * @param user User data
   * @returns HTML string
   */
  private formatEmailHtml(content, user) {
    // Start with header
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          h1, h2, h3 { color: #0056b3; }
          .header { background-color: #0056b3; color: white; padding: 20px; text-align: center; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 0.8em; }
          .stock-item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
          .positive { color: green; }
          .negative { color: red; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AI Hedge Fund Market Digest</h1>
          <p>Your personalized market insights for ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Hello${user.name ? ` ${user.name}` : ''},</p>
        <p>Here's your customized market digest based on your preferences:</p>
    `;
    
    // Add market summary section if present
    if (content.marketSummary) {
      html += `
        <div class="section">
          <h2>Market Summary</h2>
          <p>Current market trend: <strong>${content.marketSummary.marketTrend}</strong></p>
          <h3>Major Indices</h3>
          <ul>
      `;
      
      content.marketSummary.indices.forEach(index => {
        const changeClass = index.changePercent >= 0 ? 'positive' : 'negative';
        html += `
          <li>
            <strong>${index.symbol}:</strong> ${index.price.toFixed(2)} 
            <span class="${changeClass}">
              ${index.changePercent >= 0 ? '+' : ''}${index.changePercent.toFixed(2)}%
            </span>
          </li>
        `;
      });
      
      html += `
          </ul>
        </div>
      `;
    }
    
    // Add watchlist section if present
    if (content.watchlistUpdates && content.watchlistUpdates.stocks.length > 0) {
      html += `
        <div class="section">
          <h2>Your Watchlist Updates</h2>
      `;
      
      content.watchlistUpdates.stocks.forEach(stock => {
        const changeClass = stock.changePercent >= 0 ? 'positive' : 'negative';
        html += `
          <div class="stock-item">
            <h3>${stock.companyName} (${stock.symbol})</h3>
            <p>
              Price: $${stock.price.toFixed(2)} 
              <span class="${changeClass}">
                ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
              </span>
            </p>
            <p>Volume: ${stock.volume.toLocaleString()}</p>
            ${stock.sector ? `<p>Sector: ${stock.sector}</p>` : ''}
          </div>
        `;
      });
      
      html += `
        </div>
      `;
    }
    
    // Add options flow section if present
    if (content.optionsFlowInsights && content.optionsFlowInsights.insights.length > 0) {
      html += `
        <div class="section">
          <h2>Options Flow Insights</h2>
          <ul>
      `;
      
      content.optionsFlowInsights.insights.forEach(insight => {
        html += `
          <li>
            <strong>${insight.ticker}:</strong> ${insight.message}
          </li>
        `;
      });
      
      html += `
          </ul>
        </div>
      `;
    }
    
    // Add dark pool section if present
    if (content.darkPoolActivity && content.darkPoolActivity.insights.length > 0) {
      html += `
        <div class="section">
          <h2>Dark Pool Activity</h2>
          <ul>
      `;
      
      content.darkPoolActivity.insights.forEach(insight => {
        html += `
          <li>
            <strong>${insight.ticker}:</strong> ${insight.message}
          </li>
        `;
      });
      
      html += `
          </ul>
        </div>
      `;
    }
    
    // Add recommendations section
    if (content.recommendations && content.recommendations.length > 0) {
      html += `
        <div class="section">
          <h2>Personalized Recommendations</h2>
          <ul>
      `;
      
      content.recommendations.forEach(rec => {
        html += `
          <li>
            ${rec.symbol ? `<strong>${rec.symbol}:</strong> ` : ''}${rec.message}
          </li>
        `;
      });
      
      html += `
          </ul>
        </div>
      `;
    }
    
    // Add footer
    html += `
        <div class="footer">
          <p>This newsletter is personalized based on your preferences. <a href="https://aihedgefund.com/settings/newsletter">Update your preferences</a>.</p>
          <p>AI Hedge Fund - Institutional-Grade Market Intelligence</p>
          <p><small>If you no longer wish to receive these emails, <a href="https://aihedgefund.com/unsubscribe?email=${user.email}">unsubscribe here</a>.</small></p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }
}

// Export singleton instance
export const weeklyNewsletterService = new WeeklyNewsletterService(); 
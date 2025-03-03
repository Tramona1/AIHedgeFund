declare class WeeklyNewsletterService {
    /**
     * Generate and send newsletters to all subscribed users
     * @returns Object with counts of sent emails and errors
     */
    generateAndSendNewsletters(): Promise<{
        sentCount: number;
        errorCount: number;
    }>;
    /**
     * Check if a user should receive a newsletter based on their frequency and last delivery date
     * @param user User with newsletter preferences
     * @returns Boolean indicating if user should receive a newsletter
     */
    private shouldSendNewsletter;
    /**
     * Convert day name to number
     * @param dayName Day name (sunday, monday, etc.)
     * @returns Day number (0-6)
     */
    private getDayNumber;
    /**
     * Get all users who have subscribed to newsletters
     * @returns Array of users with their preferences
     */
    private getSubscribedUsers;
    /**
     * Generate and send a newsletter to a specific user
     * @param user User with newsletter preferences
     */
    private generateAndSendUserNewsletter;
    /**
     * Generate newsletter content for a specific user
     */
    private generateNewsletterContent;
    /**
     * Get a summary of recent market activity
     * @returns Market summary data
     */
    private getMarketSummary;
    /**
     * Get updates for stocks in the user's watchlist
     * @param userId User ID
     * @returns Watchlist updates
     */
    private getWatchlistUpdates;
    /**
     * Get recent options flow insights
     * @returns Options flow data
     */
    private getOptionsFlowInsights;
    /**
     * Get recent dark pool trading activity
     * @returns Dark pool data
     */
    private getDarkPoolActivity;
    /**
     * Get trading recommendations based on user interests
     * @param user User with preferences
     * @returns Trading recommendations
     */
    private getTradingRecommendations;
    /**
     * Get stock recommendations
     * @returns Array of stock recommendations
     */
    private getStockRecommendations;
    /**
     * Analyze market trend from index data
     * @param indexData Array of index stock data
     * @returns Trend description
     */
    private analyzeMarketTrend;
    /**
     * Analyze options flow data
     */
    private analyzeOptionsFlow;
    /**
     * Analyze dark pool activity
     */
    private analyzeDarkPoolActivity;
    /**
     * Format newsletter content into HTML email
     * @param content Newsletter content
     * @param user User data
     * @returns HTML string
     */
    private formatEmailHtml;
}
export declare const weeklyNewsletterService: WeeklyNewsletterService;
export {};

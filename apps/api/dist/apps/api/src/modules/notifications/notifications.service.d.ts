export namespace notificationsService {
    /**
     * Send stock update email to users who are interested in the ticker
     */
    function sendStockUpdateEmail(ticker: any, eventType: any, details: any): Promise<void>;
    /**
     * Generate email content based on event type
     */
    function generateEmailContent(ticker: any, eventType: any, details: any): {
        subject: string;
        content: string;
    };
}

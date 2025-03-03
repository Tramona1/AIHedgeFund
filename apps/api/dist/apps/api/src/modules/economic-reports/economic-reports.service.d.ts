export namespace economicReportsService {
    /**
     * Get recent economic reports
     */
    function getRecentReports(limit?: number, source?: any, category?: any): Promise<{
        id: string;
        source: string;
        filename: string;
        original_filename: string;
        timestamp: string;
        subject: string;
        url: string;
        summary: string;
        file_url: string;
        category: string;
        from_email: string;
        processed_at: string;
    }[]>;
    /**
     * Get available economic report sources
     */
    function getSources(): Promise<string[]>;
    /**
     * Get available economic report categories
     */
    function getCategories(): Promise<string[]>;
}

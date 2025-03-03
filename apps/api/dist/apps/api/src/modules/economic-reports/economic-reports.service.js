import { logger } from "@repo/logger";
import { generateId, IDPrefix } from "@repo/id";
// Create component logger
const serviceLogger = logger.child({ component: "economic-reports-service" });
// Sample mock data for economic reports
const mockReports = [
    {
        id: generateId(IDPrefix.REPORT),
        source: "Federal Reserve",
        filename: "fomc-minutes-march-2023.pdf",
        original_filename: "FOMC_Minutes_March_2023.pdf",
        timestamp: new Date().toISOString(),
        subject: "Federal Open Market Committee Minutes",
        url: "https://www.federalreserve.gov/monetarypolicy/files/fomcminutes20230322.pdf",
        summary: "The FOMC discussed current economic conditions and decided to maintain the target range for the federal funds rate at 4.75 to 5 percent.",
        file_url: "https://asset.cloudinary.com/demo/raw/upload/v1/fomc-minutes-march-2023.pdf",
        category: "Monetary Policy",
        from_email: "press@federalreserve.gov",
        processed_at: new Date().toISOString()
    },
    {
        id: generateId(IDPrefix.REPORT),
        source: "Bureau of Labor Statistics",
        filename: "employment-situation-april-2023.pdf",
        original_filename: "empsit_04_2023.pdf",
        timestamp: new Date().toISOString(),
        subject: "Employment Situation Summary",
        url: "https://www.bls.gov/news.release/empsit.nr0.htm",
        summary: "Total nonfarm payroll employment increased by 253,000 in April, and the unemployment rate changed little at 3.4 percent, the U.S. Bureau of Labor Statistics reported today.",
        file_url: "https://asset.cloudinary.com/demo/raw/upload/v1/employment-situation-april-2023.pdf",
        category: "Employment",
        from_email: "data@bls.gov",
        processed_at: new Date().toISOString()
    },
    {
        id: generateId(IDPrefix.REPORT),
        source: "Bureau of Economic Analysis",
        filename: "gdp-first-quarter-2023.pdf",
        original_filename: "gdp1q23_adv.pdf",
        timestamp: new Date().toISOString(),
        subject: "Gross Domestic Product, First Quarter 2023",
        url: "https://www.bea.gov/news/2023/gross-domestic-product-first-quarter-2023-advance-estimate",
        summary: "Real gross domestic product (GDP) increased at an annual rate of 1.1 percent in the first quarter of 2023, following an increase of 2.6 percent in the fourth quarter of 2022.",
        file_url: "https://asset.cloudinary.com/demo/raw/upload/v1/gdp-first-quarter-2023.pdf",
        category: "GDP",
        from_email: "gdpniwd@bea.gov",
        processed_at: new Date().toISOString()
    }
];
// Economic Reports Service with mock data
export const economicReportsService = {
    /**
     * Get recent economic reports
     */
    async getRecentReports(limit = 10, source = null, category = null) {
        serviceLogger.info("Getting recent economic reports", { limit, source, category });
        try {
            // Filter by source and category if provided
            let filtered = [...mockReports];
            if (source) {
                filtered = filtered.filter(report => report.source.toLowerCase() === source.toLowerCase());
            }
            if (category) {
                filtered = filtered.filter(report => report.category.toLowerCase() === category.toLowerCase());
            }
            // Sort by timestamp (newest first) and limit results
            const reports = filtered
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
            serviceLogger.info(`Found ${reports.length} economic reports`);
            return reports;
        }
        catch (error) {
            serviceLogger.error("Error getting economic reports", {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    },
    /**
     * Get available economic report sources
     */
    async getSources() {
        serviceLogger.info("Getting economic report sources");
        try {
            // Extract unique sources from mock data
            const sources = [...new Set(mockReports.map(report => report.source))];
            serviceLogger.info(`Found ${sources.length} economic report sources`);
            return sources;
        }
        catch (error) {
            serviceLogger.error("Error getting economic report sources", {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    },
    /**
     * Get available economic report categories
     */
    async getCategories() {
        serviceLogger.info("Getting economic report categories");
        try {
            // Extract unique categories from mock data
            const categories = [...new Set(mockReports.map(report => report.category))];
            serviceLogger.info(`Found ${categories.length} economic report categories`);
            return categories;
        }
        catch (error) {
            serviceLogger.error("Error getting economic report categories", {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
};
//# sourceMappingURL=economic-reports.service.js.map
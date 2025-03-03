export interface EconomicReport {
  id: string;
  source: string;
  filename: string;
  original_filename?: string;
  timestamp: string;
  subject?: string;
  url?: string;
  summary?: string;
  file_url: string;
  category: string;
  from_email?: string;
  processed_at: string;
}

export interface EconomicReportsService {
  /**
   * Get recent economic reports
   */
  getRecentReports(
    limit?: number, 
    source?: string | null, 
    category?: string | null
  ): Promise<EconomicReport[]>;

  /**
   * Get available sources
   */
  getSources(): Promise<string[]>;

  /**
   * Get available categories
   */
  getCategories(): Promise<string[]>;
}

export const economicReportsService: EconomicReportsService; 
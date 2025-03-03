/**
 * AI Query Service
 * Handles natural language queries about stocks and translates them to database queries
 */
/**
 * Interface for AI Query results
 */
export interface AIQueryResult {
    response: string;
    data?: any;
    error?: string;
}
/**
 * AI Query Service for handling natural language financial queries
 */
export declare class AIQueryService {
    /**
     * Process a natural language query
     */
    processQuery(query: string): Promise<AIQueryResult>;
    /**
     * Parse a natural language query into structured parameters
     * This is a simplified version - in production, this would use an LLM
     */
    private parseQuery;
    /**
     * Parse numeric values from strings, handling various formats
     */
    private parseNumericValue;
    /**
     * Extract JSON data from text response
     */
    private extractJsonFromText;
    /**
     * Fetch data based on parsed query
     */
    private fetchData;
    /**
     * Generate a response using Gemini LLM
     */
    private generateResponse;
    /**
     * Save query for future reference
     */
    saveQuery(userId: string, query: string, result: AIQueryResult): Promise<void>;
    /**
     * Get user's query history
     */
    getQueryHistory(userId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * Get total count of user's queries
     */
    getQueryCount(userId: string): Promise<number>;
    getUserQueries(userId: string): Promise<any[]>;
}
export declare const aiQueryService: AIQueryService;

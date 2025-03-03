/**
 * AI Query Service
 * Handles natural language queries about stocks and translates them to database queries
 */

import { db } from "@repo/db";
import { eq, and, lte, gte, like, not, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import { randomUUID } from "crypto";

// We import these directly to avoid TypeScript errors with drizzle-orm
const { stockData, companyInfo, balanceSheet, incomeStatement, technicalIndicators } = db._.schema;
const { aiQueries } = db._.schema;

/**
 * Interface for AI Query results
 */
export interface AIQueryResult {
  response: string;
  data?: any;
  error?: string;
}

// Interface for Gemini service (minimal implementation since we're accessing it via API)
interface GeminiService {
  sendMessage(message: string, context?: string): Promise<{ text: string; error?: string }>;
}

// Simplified Gemini service client for API use
const geminiService: GeminiService = {
  async sendMessage(message: string, context?: string): Promise<{ text: string; error?: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error(`Error calling Gemini API: ${response.statusText}`);
      }

      const data = await response.json();
      return { text: data.text };
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      return { text: 'Failed to process query with AI', error: error.message };
    }
  }
};

/**
 * Service for handling AI-powered stock queries
 */
export class AIQueryService {
  /**
   * Process a natural language query about stocks
   */
  async processQuery(query: string): Promise<AIQueryResult> {
    try {
      // Step 1: Parse the query to identify key parameters
      const parsedQuery = await this.parseQuery(query);
      
      // Step 2: Fetch data based on parsed parameters
      const data = await this.fetchData(parsedQuery);
      
      // Step 3: Generate response using Gemini LLM
      const response = await this.generateResponse(query, data);
      
      return { response, data };
    } catch (error: any) {
      console.error("Error processing AI query:", error);
      return { 
        response: "Sorry, I encountered an error processing your query.", 
        error: error.message 
      };
    }
  }

  /**
   * Parse a natural language query to identify query intent and parameters
   * This is a simple implementation - could be enhanced with more sophisticated NLP
   */
  private async parseQuery(query: string): Promise<any> {
    // Extract query parameters using simple rule-based parsing
    // In a more advanced implementation, this could use NLP techniques

    const parsed: any = {
      queryType: "",
      parameters: {}
    };

    // Identify query type
    if (/market cap|market capitalization/i.test(query)) {
      parsed.queryType = "marketCap";
    }
    if (/revenue|sales/i.test(query)) {
      parsed.queryType = parsed.queryType ? `${parsed.queryType}+revenue` : "revenue";
    }
    if (/profit|earnings|income|net income/i.test(query)) {
      parsed.queryType = parsed.queryType ? `${parsed.queryType}+income` : "income";
    }
    if (/pe ratio|p\/e|price.earnings/i.test(query)) {
      parsed.queryType = parsed.queryType ? `${parsed.queryType}+peRatio` : "peRatio";
    }
    if (/small cap/i.test(query)) {
      parsed.parameters.marketCapMax = 2000000000; // $2B is typical small cap ceiling
    }
    if (/mid cap/i.test(query)) {
      parsed.parameters.marketCapMin = 2000000000;
      parsed.parameters.marketCapMax = 10000000000; // $10B is typical mid cap ceiling
    }
    if (/large cap/i.test(query)) {
      parsed.parameters.marketCapMin = 10000000000; // $10B is typical large cap floor
    }

    // Extract numeric values with units
    const numericMatches = query.match(/(\$?\d+(\.\d+)?)\s*(million|billion|trillion|M|B|T)?/g);
    if (numericMatches) {
      numericMatches.forEach(match => {
        const value = this.parseNumericValue(match);
        
        // Determine what this value refers to
        if (/market cap|market capitalization/i.test(query) && /less than|under|below|max/i.test(query)) {
          parsed.parameters.marketCapMax = value;
        } else if (/market cap|market capitalization/i.test(query) && /more than|over|above|min/i.test(query)) {
          parsed.parameters.marketCapMin = value;
        } else if (/revenue|sales/i.test(query) && /less than|under|below|max/i.test(query)) {
          parsed.parameters.revenueMax = value;
        } else if (/revenue|sales/i.test(query) && /more than|over|above|min/i.test(query)) {
          parsed.parameters.revenueMin = value;
        }
      });
    }

    // For complex queries, we can use Gemini itself to help extract parameters
    if (Object.keys(parsed.parameters).length === 0 || !parsed.queryType) {
      const prompt = `
        Extract the key parameters from this financial query:
        "${query}"
        
        Return a JSON object with the following structure:
        {
          "queryType": "marketCap", // or revenue, income, etc.
          "parameters": {
            "marketCapMin": 1000000000, // numeric values only, no formatting
            "marketCapMax": 5000000000,
            "revenueMin": 100000000,
            "revenueMax": 1000000000,
            "sector": "Technology", // if specified
            "industry": "Software" // if specified
          }
        }
        
        Only include parameters that are explicitly or implicitly mentioned in the query.
        Convert all values to raw numbers (no currency symbols, commas, or abbreviations).
      `;
      
      try {
        const geminiResponse = await geminiService.sendMessage(prompt);
        if (geminiResponse.text) {
          const extractedJson = this.extractJsonFromText(geminiResponse.text);
          if (extractedJson) {
            // Merge the extracted parameters with any we already identified
            parsed.queryType = parsed.queryType || extractedJson.queryType;
            parsed.parameters = { ...parsed.parameters, ...extractedJson.parameters };
          }
        }
      } catch (error) {
        console.error("Error using Gemini to parse query:", error);
        // Continue with what we have if Gemini parsing fails
      }
    }

    return parsed;
  }

  /**
   * Parse numeric values from strings like "$300 million" to actual numbers
   */
  private parseNumericValue(valueString: string): number {
    // Remove $ and commas
    let cleaned = valueString.replace(/[$,]/g, '');
    
    // Extract the numeric part and unit
    const match = cleaned.match(/(\d+(\.\d+)?)\s*(million|billion|trillion|M|B|T)?/i);
    if (!match) return 0;
    
    let value = parseFloat(match[1]);
    const unit = match[3]?.toLowerCase();
    
    // Apply multiplier based on unit
    if (unit === 'million' || unit === 'm') {
      value *= 1000000;
    } else if (unit === 'billion' || unit === 'b') {
      value *= 1000000000;
    } else if (unit === 'trillion' || unit === 't') {
      value *= 1000000000000;
    }
    
    return value;
  }

  /**
   * Extract JSON from response text
   */
  private extractJsonFromText(text: string): any {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse JSON from text:", e);
        return null;
      }
    }
    return null;
  }

  /**
   * Fetch data from database based on parsed query
   */
  private async fetchData(parsedQuery: any): Promise<any> {
    const { queryType, parameters } = parsedQuery;
    let result;

    try {
      // If we need market cap or general company information
      if (queryType.includes("marketCap") || queryType.includes("peRatio")) {
        let query = db.select().from(companyInfo);
        
        // Apply filters
        if (parameters.marketCapMin) {
          query = query.$dynamic().where(gte(companyInfo.marketCap, parameters.marketCapMin));
        }
        if (parameters.marketCapMax) {
          query = query.$dynamic().where(lte(companyInfo.marketCap, parameters.marketCapMax));
        }
        if (parameters.sector) {
          query = query.$dynamic().where(like(companyInfo.sector, `%${parameters.sector}%`));
        }
        if (parameters.industry) {
          query = query.$dynamic().where(like(companyInfo.industry, `%${parameters.industry}%`));
        }
        
        // Add basic company data
        result = await query.execute();
      }

      // If we need revenue or income data
      if (queryType.includes("revenue") || queryType.includes("income")) {
        // Safe SQL query for recent income statements
        const incomeData = await db.execute(sql`
          SELECT * FROM income_statement 
          WHERE fiscal_date_ending IN (
            SELECT DISTINCT fiscal_date_ending 
            FROM income_statement 
            ORDER BY fiscal_date_ending DESC 
            LIMIT 1
          )
        `);
        
        if (incomeData && incomeData.length > 0) {
          // If we already have company data, merge it
          if (result) {
            const combinedResults = [];
            for (const company of result) {
              const matchingIncome = incomeData.find((inc: any) => inc.symbol === company.symbol);
              if (matchingIncome) {
                combinedResults.push({
                  ...company,
                  revenue: matchingIncome.totalRevenue,
                  netIncome: matchingIncome.netIncome,
                  fiscalDateEnding: matchingIncome.fiscalDateEnding
                });
              }
            }
            result = combinedResults;
          } else {
            // Otherwise just filter the income data
            result = incomeData;
            
            // Apply filters directly to income data
            if (parameters.revenueMin) {
              result = result.filter((item: any) => item.totalRevenue >= parameters.revenueMin);
            }
            if (parameters.revenueMax) {
              result = result.filter((item: any) => item.totalRevenue <= parameters.revenueMax);
            }
          }
        }
      }

      // If we don't have results yet, return empty array
      if (!result) {
        result = [];
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      result = [];
    }

    return result;
  }

  /**
   * Generate a response using Gemini LLM
   */
  private async generateResponse(query: string, data: any): Promise<string> {
    const formattedData = JSON.stringify(data, null, 2);
    
    const prompt = `
      Here is financial data that answers the following query: "${query}"
      
      DATA:
      ${formattedData}
      
      Please analyze this data and provide a clear, concise answer to the query.
      Include relevant statistics and insights from the data.
      If the data is empty or doesn't fully answer the query, explain what information is missing.
      Format your response in a professional, easy-to-understand manner suitable for financial analysis.
      Don't include raw JSON in your response, but extract and present the key information.
      
      If companies are found, include a bulleted list with their:
      - Name and symbol
      - Key financials (relevant to the query)
      - Brief description if available
      
      Keep your response concise and focused on directly answering the user's query.
    `;
    
    const response = await geminiService.sendMessage(prompt);
    return response.text || "Sorry, I couldn't generate a response based on the available data.";
  }

  /**
   * Save query for future reference
   */
  async saveQuery(userId: string, query: string, result: AIQueryResult): Promise<void> {
    try {
      await db.insert(aiQueries).values({
        id: randomUUID(),
        userId,
        query,
        response: result.response,
        data: result.data ? result.data : null,
        metadata: {
          timestamp: new Date().toISOString(),
          success: !result.error,
        },
      });
    } catch (error) {
      console.error('Error saving query to database:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get query history for a user
   */
  async getQueryHistory(userId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      // Using more SQL-safe methods to avoid type errors
      const history = await db.execute(sql`
        SELECT * FROM ai_queries 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      
      return history;
    } catch (error) {
      console.error('Error retrieving query history:', error);
      return [];
    }
  }

  /**
   * Get total count of queries for a user
   */
  async getQueryCount(userId: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM ai_queries WHERE user_id = ${userId}
      `);
      
      return result[0]?.count as number || 0;
    } catch (error) {
      console.error('Error getting query count:', error);
      return 0;
    }
  }
}

export const aiQueryService = new AIQueryService(); 
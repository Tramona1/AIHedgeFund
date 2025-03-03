/**
 * AI Query Service
 * Handles natural language queries about stocks and translates them to database queries
 */

import { db } from "@repo/db";
import { eq, and, lte, gte, like, not, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import { randomUUID } from "crypto";
import { selectWhere, insertInto, safeEq, tableColumn, safeTable, asPgTable } from "../../lib/db-helpers.js";

// Get the schema objects directly from the DB instance
const { stockData, companyInfo, balanceSheet, incomeStatement, technicalIndicators, aiQueries } = db._.schema;

// Create type-safe table proxies
const safeCompanyInfo = safeTable<{
  marketCap: any;
  sector: any;
  industry: any;
}>(companyInfo);

const safeAiQueries = safeTable<{
  userId: any;
  query: any;
  result: any;
  createdAt: any;
}>(aiQueries);

/**
 * Interface for AI Query results
 */
export interface AIQueryResult {
  response: string;
  data?: any;
  error?: string;
}

// Mock Gemini service for prototype
const geminiService: GeminiService = {
  async sendMessage(message: string, context?: string): Promise<{ text: string; error?: string }> {
    try {
      // In production, this would call the Gemini API
      // For now, just return a mock response
      return {
        text: `Here is my analysis of the data for your query "${message.substring(0, 50)}...":
        
        Based on the data provided, I found 3 companies that match your criteria.
        
        * Apple Inc (AAPL)
          - Market Cap: $2.8T
          - Revenue: $394.3B
          - Brief: Leading technology company with strong consumer products
        
        * Microsoft Corp (MSFT)
          - Market Cap: $2.7T
          - Revenue: $211.9B
          - Brief: Diversified technology company with strong cloud services
        
        * Alphabet Inc (GOOGL)
          - Market Cap: $1.7T
          - Revenue: $307.4B
          - Brief: Internet services and digital advertising leader
        
        These companies stand out for their strong financial performance and market position.`,
      };
    } catch (error) {
      return {
        text: "I encountered an error processing your request.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

interface GeminiService {
  sendMessage(message: string, context?: string): Promise<{ text: string; error?: string }>;
}

/**
 * AI Query Service for handling natural language financial queries
 */
export class AIQueryService {
  /**
   * Process a natural language query
   */
  async processQuery(query: string): Promise<AIQueryResult> {
    try {
      // Step 1: Parse the query to extract parameters
      const parsedQuery = await this.parseQuery(query);
      
      // Step 2: Fetch relevant data based on parsed query
      const data = await this.fetchData(parsedQuery);
      
      // Step 3: Generate a response using LLM
      const response = await this.generateResponse(query, data);
      
      return {
        response,
        data,
      };
    } catch (error) {
      return {
        response: "I'm sorry, I couldn't process your query successfully.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Parse a natural language query into structured parameters
   * This is a simplified version - in production, this would use an LLM
   */
  private async parseQuery(query: string): Promise<any> {
    // Convert query to lowercase for easier pattern matching
    const lowerQuery = query.toLowerCase();
    
    // Default parameters
    const parameters: any = {
      limit: 10,
    };
    
    // Determine query type based on keywords
    let queryType = [];
    
    // Check for market cap related queries
    if (lowerQuery.includes("market cap") || lowerQuery.includes("largest companies") || lowerQuery.includes("biggest companies")) {
      queryType.push("marketCap");
      
      // Extract potential market cap ranges
      if (lowerQuery.includes("over") || lowerQuery.includes("above") || lowerQuery.includes("more than")) {
        const match = lowerQuery.match(/(over|above|more than)\s+\$?(\d+(?:\.\d+)?)\s*(billion|million|trillion|B|M|T)?/i);
        if (match) {
          const value = this.parseNumericValue(match[2]);
          const unit = match[3]?.toLowerCase();
          
          let multiplier = 1;
          if (unit) {
            if (unit.startsWith('b')) multiplier = 1e9;
            else if (unit.startsWith('m')) multiplier = 1e6;
            else if (unit.startsWith('t')) multiplier = 1e12;
          }
          
          parameters.marketCapMin = value * multiplier;
        }
      }
      
      if (lowerQuery.includes("under") || lowerQuery.includes("below") || lowerQuery.includes("less than")) {
        const match = lowerQuery.match(/(under|below|less than)\s+\$?(\d+(?:\.\d+)?)\s*(billion|million|trillion|B|M|T)?/i);
        if (match) {
          const value = this.parseNumericValue(match[2]);
          const unit = match[3]?.toLowerCase();
          
          let multiplier = 1;
          if (unit) {
            if (unit.startsWith('b')) multiplier = 1e9;
            else if (unit.startsWith('m')) multiplier = 1e6;
            else if (unit.startsWith('t')) multiplier = 1e12;
          }
          
          parameters.marketCapMax = value * multiplier;
        }
      }
    }
    
    // Check for revenue related queries
    if (lowerQuery.includes("revenue") || lowerQuery.includes("sales")) {
      queryType.push("revenue");
      
      // Similar pattern for revenue ranges
      if (lowerQuery.includes("over") || lowerQuery.includes("above") || lowerQuery.includes("more than")) {
        const match = lowerQuery.match(/(over|above|more than)\s+\$?(\d+(?:\.\d+)?)\s*(billion|million|trillion|B|M|T)?/i);
        if (match) {
          const value = this.parseNumericValue(match[2]);
          const unit = match[3]?.toLowerCase();
          
          let multiplier = 1;
          if (unit) {
            if (unit.startsWith('b')) multiplier = 1e9;
            else if (unit.startsWith('m')) multiplier = 1e6;
            else if (unit.startsWith('t')) multiplier = 1e12;
          }
          
          parameters.revenueMin = value * multiplier;
        }
      }
    }
    
    // Check for sector/industry
    if (lowerQuery.includes("sector") || lowerQuery.includes("industry")) {
      // Extract sector/industry information
      const sectorMatches = [
        "technology", "healthcare", "financial", "consumer", "industrial",
        "energy", "materials", "utilities", "real estate", "communication"
      ];
      
      for (const sector of sectorMatches) {
        if (lowerQuery.includes(sector)) {
          parameters.sector = sector;
          break;
        }
      }
      
      // Extract specific industries if mentioned
      const industryMatches = [
        "software", "hardware", "semiconductor", "biotech", "pharmaceutical",
        "banking", "insurance", "retail", "automotive", "telecom"
      ];
      
      for (const industry of industryMatches) {
        if (lowerQuery.includes(industry)) {
          parameters.industry = industry;
          break;
        }
      }
    }
    
    // If no specific query type was identified, default to general company info
    if (queryType.length === 0) {
      queryType.push("companyInfo");
    }
    
    return {
      queryType,
      parameters,
      originalQuery: query
    };
  }
  
  /**
   * Parse numeric values from strings, handling various formats
   */
  private parseNumericValue(valueString: string): number {
    // Remove any commas and convert to number
    return parseFloat(valueString.replace(/,/g, ''));
  }
  
  /**
   * Extract JSON data from text response
   */
  private extractJsonFromText(text: string): any {
    try {
      // Look for JSON-like patterns in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error("Error extracting JSON:", error);
      return null;
    }
  }

  /**
   * Fetch data based on parsed query
   */
  private async fetchData(parsedQuery: any): Promise<any> {
    const { queryType, parameters } = parsedQuery;
    let result;

    try {
      // If we need market cap or general company information
      if (queryType.includes("marketCap") || queryType.includes("peRatio")) {
        // Start with a base query
        const conditions = [];
        
        // Add conditions based on parameters
        if (parameters.marketCapMin) {
          conditions.push(safeEq(safeCompanyInfo.marketCap, parameters.marketCapMin));
        }
        if (parameters.marketCapMax) {
          conditions.push(safeEq(safeCompanyInfo.marketCap, parameters.marketCapMax));
        }
        if (parameters.sector) {
          conditions.push(safeEq(safeCompanyInfo.sector, `%${parameters.sector}%`));
        }
        if (parameters.industry) {
          conditions.push(safeEq(safeCompanyInfo.industry, `%${parameters.industry}%`));
        }
        
        // Execute the query with all conditions
        result = await selectWhere(companyInfo, and(...conditions));
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
      await insertInto(aiQueries, {
        id: randomUUID(),
        userId,
        query,
        result: JSON.stringify(result),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving query:", error);
    }
  }

  /**
   * Get user's query history
   */
  async getQueryHistory(userId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      const history = await selectWhere(
        aiQueries,
        safeEq(safeAiQueries.userId, userId)
      );
      
      // Sort by timestamp (newest first) and paginate
      return history
        .sort((a, b) => 
          new Date(((b as any).createdAt) || 0).getTime() - 
          new Date(((a as any).createdAt) || 0).getTime()
        )
        .slice(offset, offset + limit);
    } catch (error) {
      console.error("Error fetching query history:", error);
      return [];
    }
  }

  /**
   * Get total count of user's queries
   */
  async getQueryCount(userId: string): Promise<number> {
    try {
      const history = await selectWhere(
        aiQueries,
        safeEq(safeAiQueries.userId, userId)
      );
      return history.length;
    } catch (error) {
      console.error("Error counting queries:", error);
      return 0;
    }
  }

  async getUserQueries(userId: string): Promise<any[]> {
    try {
      return await selectWhere(
        aiQueries,
        safeEq(safeAiQueries.userId, userId)
      );
    } catch (error) {
      console.error("Error getting user queries:", error);
      return [];
    }
  }
}

export const aiQueryService = new AIQueryService(); 
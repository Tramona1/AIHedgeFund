// @ts-nocheck - Fix for multiple versions of drizzle-orm
import { logger } from "@repo/logger";
import { db } from "@repo/db";
import { alphaVantageService } from "./alpha-vantage.service.js";
import { eq } from "drizzle-orm";

// Get schema tables directly from the DB instance
const { stockData, companyInfo, balanceSheet, incomeStatement, technicalIndicators, userWatchlist } = db._.schema;

// Create a module-specific logger
const collectionLogger = logger.child({ module: "market-data-collection" });

/**
 * Service to handle collection of market data from external APIs
 * and storing it in the database
 */
export class DataCollectionService {
  /**
   * Collects current stock quote for a given symbol and stores it in the database
   */
  async collectStockQuote(symbol: string) {
    try {
      collectionLogger.info(`Collecting stock quote for ${symbol}`);
      
      // Fetch data from Alpha Vantage
      const quoteData = await alphaVantageService.getStockQuote(symbol);
      
      if (!quoteData) {
        throw new Error(`No quote data returned for ${symbol}`);
      }
      
      // Extract values from the response
      const price = parseFloat(quoteData["05. price"]);
      const open = parseFloat(quoteData["02. open"]);
      const high = parseFloat(quoteData["03. high"]);
      const low = parseFloat(quoteData["04. low"]);
      const volume = parseFloat(quoteData["06. volume"]);
      const previousClose = parseFloat(quoteData["08. previous close"]);
      const change = parseFloat(quoteData["09. change"]);
      const changePercent = parseFloat(quoteData["10. change percent"].replace("%", ""));
      
      // Store in database
      const result = await db.insert(stockData).values({
        symbol,
        price,
        openPrice: open,
        highPrice: high,
        lowPrice: low,
        volume,
        previousClose,
        change,
        changePercent,
        dataSource: "alpha_vantage",
        metaData: quoteData
      }).onConflictDoUpdate({
        target: [stockData.symbol],
        set: {
          price,
          openPrice: open,
          highPrice: high,
          lowPrice: low,
          volume,
          previousClose,
          change,
          changePercent,
          timestamp: new Date(),
          metaData: quoteData
        }
      });
      
      collectionLogger.info(`Successfully stored stock quote for ${symbol}`);
      return result;
    } catch (error) {
      collectionLogger.error(`Error collecting stock quote for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * Collects company information for a given symbol and stores it in the database
   */
  async collectCompanyInfo(symbol: string) {
    try {
      collectionLogger.info(`Collecting company info for ${symbol}`);
      
      // Fetch data from Alpha Vantage
      const companyData = await alphaVantageService.getCompanyOverview(symbol);
      
      if (!companyData) {
        throw new Error(`No company data returned for ${symbol}`);
      }
      
      // Extract values
      const {
        Name: name,
        Description: description,
        Sector: sector,
        Industry: industry,
        MarketCapitalization: marketCapStr,
        PERatio: peRatioStr,
        DividendYield: dividendYieldStr,
        EPS: epsStr,
        Beta: betaStr,
        "52WeekHigh": fiftyTwoWeekHighStr,
        "52WeekLow": fiftyTwoWeekLowStr,
        SharesOutstanding: sharesOutstandingStr
      } = companyData;
      
      // Convert numeric strings to numbers
      const marketCap = marketCapStr ? parseFloat(marketCapStr) : null;
      const peRatio = peRatioStr ? parseFloat(peRatioStr) : null;
      const dividendYield = dividendYieldStr ? parseFloat(dividendYieldStr) : null;
      const eps = epsStr ? parseFloat(epsStr) : null;
      const beta = betaStr ? parseFloat(betaStr) : null;
      const fiftyTwoWeekHigh = fiftyTwoWeekHighStr ? parseFloat(fiftyTwoWeekHighStr) : null;
      const fiftyTwoWeekLow = fiftyTwoWeekLowStr ? parseFloat(fiftyTwoWeekLowStr) : null;
      const sharesOutstanding = sharesOutstandingStr ? parseFloat(sharesOutstandingStr) : null;
      
      // Store in database
      const result = await db.insert(companyInfo).values({
        symbol,
        name,
        description,
        sector,
        industry,
        marketCap,
        peRatio,
        dividendYield,
        eps,
        beta,
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
        sharesOutstanding,
        dataSource: "alpha_vantage",
        metaData: companyData
      }).onConflictDoUpdate({
        target: [companyInfo.symbol],
        set: {
          name,
          description,
          sector,
          industry,
          marketCap,
          peRatio,
          dividendYield,
          eps,
          beta,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
          sharesOutstanding,
          lastUpdated: new Date(),
          metaData: companyData
        }
      });
      
      collectionLogger.info(`Successfully stored company info for ${symbol}`);
      return result;
    } catch (error) {
      collectionLogger.error(`Error collecting company info for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * Collects balance sheet data for a given symbol and stores it in the database
   */
  async collectBalanceSheet(symbol: string) {
    try {
      collectionLogger.info(`Collecting balance sheet for ${symbol}`);
      
      // Fetch data from Alpha Vantage
      const data = await alphaVantageService.getBalanceSheet(symbol);
      
      if (!data || !data.annualReports || data.annualReports.length === 0) {
        throw new Error(`No balance sheet data returned for ${symbol}`);
      }
      
      // Process annual reports
      for (const report of data.annualReports) {
        const {
          fiscalDateEnding,
          reportedCurrency,
          totalAssets,
          totalCurrentAssets,
          cashAndCashEquivalentsAtCarryingValue,
          inventory,
          totalLiabilities,
          totalCurrentLiabilities,
          totalShareholderEquity,
          retainedEarnings,
          commonStock
        } = report;
        
        // Store in database
        await db.insert(balanceSheet).values({
          symbol,
          fiscalDateEnding,
          reportedCurrency,
          totalAssets: totalAssets ? parseFloat(totalAssets) : null,
          totalCurrentAssets: totalCurrentAssets ? parseFloat(totalCurrentAssets) : null,
          cashAndCashEquivalents: cashAndCashEquivalentsAtCarryingValue ? parseFloat(cashAndCashEquivalentsAtCarryingValue) : null,
          inventory: inventory ? parseFloat(inventory) : null,
          totalLiabilities: totalLiabilities ? parseFloat(totalLiabilities) : null,
          totalCurrentLiabilities: totalCurrentLiabilities ? parseFloat(totalCurrentLiabilities) : null,
          totalShareholderEquity: totalShareholderEquity ? parseFloat(totalShareholderEquity) : null,
          retainedEarnings: retainedEarnings ? parseFloat(retainedEarnings) : null,
          commonStock: commonStock ? parseFloat(commonStock) : null,
          isQuarterly: false,
          dataSource: "alpha_vantage",
          fullData: report
        }).onConflictDoUpdate({
          target: [balanceSheet.symbol, balanceSheet.fiscalDateEnding],
          set: {
            reportedCurrency,
            totalAssets: totalAssets ? parseFloat(totalAssets) : null,
            totalCurrentAssets: totalCurrentAssets ? parseFloat(totalCurrentAssets) : null,
            cashAndCashEquivalents: cashAndCashEquivalentsAtCarryingValue ? parseFloat(cashAndCashEquivalentsAtCarryingValue) : null,
            inventory: inventory ? parseFloat(inventory) : null,
            totalLiabilities: totalLiabilities ? parseFloat(totalLiabilities) : null,
            totalCurrentLiabilities: totalCurrentLiabilities ? parseFloat(totalCurrentLiabilities) : null,
            totalShareholderEquity: totalShareholderEquity ? parseFloat(totalShareholderEquity) : null,
            retainedEarnings: retainedEarnings ? parseFloat(retainedEarnings) : null,
            commonStock: commonStock ? parseFloat(commonStock) : null,
            lastUpdated: new Date(),
            fullData: report
          }
        });
      }
      
      // Also process quarterly reports if available
      if (data.quarterlyReports && data.quarterlyReports.length > 0) {
        for (const report of data.quarterlyReports) {
          const {
            fiscalDateEnding,
            reportedCurrency,
            totalAssets,
            totalCurrentAssets,
            cashAndCashEquivalentsAtCarryingValue,
            inventory,
            totalLiabilities,
            totalCurrentLiabilities,
            totalShareholderEquity,
            retainedEarnings,
            commonStock
          } = report;
          
          // Store in database
          await db.insert(balanceSheet).values({
            symbol,
            fiscalDateEnding,
            reportedCurrency,
            totalAssets: totalAssets ? parseFloat(totalAssets) : null,
            totalCurrentAssets: totalCurrentAssets ? parseFloat(totalCurrentAssets) : null,
            cashAndCashEquivalents: cashAndCashEquivalentsAtCarryingValue ? parseFloat(cashAndCashEquivalentsAtCarryingValue) : null,
            inventory: inventory ? parseFloat(inventory) : null,
            totalLiabilities: totalLiabilities ? parseFloat(totalLiabilities) : null,
            totalCurrentLiabilities: totalCurrentLiabilities ? parseFloat(totalCurrentLiabilities) : null,
            totalShareholderEquity: totalShareholderEquity ? parseFloat(totalShareholderEquity) : null,
            retainedEarnings: retainedEarnings ? parseFloat(retainedEarnings) : null,
            commonStock: commonStock ? parseFloat(commonStock) : null,
            isQuarterly: true,
            dataSource: "alpha_vantage",
            fullData: report
          }).onConflictDoUpdate({
            target: [balanceSheet.symbol, balanceSheet.fiscalDateEnding],
            set: {
              reportedCurrency,
              totalAssets: totalAssets ? parseFloat(totalAssets) : null,
              totalCurrentAssets: totalCurrentAssets ? parseFloat(totalCurrentAssets) : null,
              cashAndCashEquivalents: cashAndCashEquivalentsAtCarryingValue ? parseFloat(cashAndCashEquivalentsAtCarryingValue) : null,
              inventory: inventory ? parseFloat(inventory) : null,
              totalLiabilities: totalLiabilities ? parseFloat(totalLiabilities) : null,
              totalCurrentLiabilities: totalCurrentLiabilities ? parseFloat(totalCurrentLiabilities) : null,
              totalShareholderEquity: totalShareholderEquity ? parseFloat(totalShareholderEquity) : null,
              retainedEarnings: retainedEarnings ? parseFloat(retainedEarnings) : null,
              commonStock: commonStock ? parseFloat(commonStock) : null,
              isQuarterly: true,
              lastUpdated: new Date(),
              fullData: report
            }
          });
        }
      }
      
      collectionLogger.info(`Successfully stored balance sheet data for ${symbol}`);
      return true;
    } catch (error) {
      collectionLogger.error(`Error collecting balance sheet for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * Collects RSI data for a given symbol and stores it in the database
   */
  async collectRSI(symbol: string, timePeriod: number = 14) {
    try {
      collectionLogger.info(`Collecting RSI for ${symbol} with time period ${timePeriod}`);
      
      // Fetch data from Alpha Vantage
      const data = await alphaVantageService.getRSI(symbol, 'daily', timePeriod);
      
      if (!data || !data.technicalIndicator) {
        throw new Error(`No RSI data returned for ${symbol}`);
      }
      
      // Process each data point
      const entries = Object.entries(data.technicalIndicator);
      
      for (const [date, values] of entries) {
        const rsiValue = parseFloat((values as any).RSI);
        
        // Store in database
        await db.insert(technicalIndicators).values({
          symbol,
          indicatorType: "RSI",
          date,
          value: rsiValue,
          parameters: { timePeriod },
          dataSource: "alpha_vantage",
          metaData: values
        }).onConflictDoUpdate({
          target: [technicalIndicators.symbol, technicalIndicators.indicatorType, technicalIndicators.date],
          set: {
            value: rsiValue,
            parameters: { timePeriod },
            timestamp: new Date(),
            metaData: values
          }
        });
      }
      
      collectionLogger.info(`Successfully stored RSI data for ${symbol}`);
      return true;
    } catch (error) {
      collectionLogger.error(`Error collecting RSI for ${symbol}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * Collects all available data for a given symbol
   */
  async collectAllDataForSymbol(symbol: string) {
    const results = {
      quote: { success: false, error: null },
      company: { success: false, error: null },
      balanceSheet: { success: false, error: null },
      rsi: { success: false, error: null }
    };
    
    try {
      // Collect stock quote
      await this.collectStockQuote(symbol);
      results.quote.success = true;
    } catch (error) {
      results.quote.error = error instanceof Error ? error.message : String(error);
      collectionLogger.error(`Failed to collect quote for ${symbol}`, { error: results.quote.error });
    }
    
    try {
      // Collect company info
      await this.collectCompanyInfo(symbol);
      results.company.success = true;
    } catch (error) {
      results.company.error = error instanceof Error ? error.message : String(error);
      collectionLogger.error(`Failed to collect company info for ${symbol}`, { error: results.company.error });
    }
    
    try {
      // Collect balance sheet
      await this.collectBalanceSheet(symbol);
      results.balanceSheet.success = true;
    } catch (error) {
      results.balanceSheet.error = error instanceof Error ? error.message : String(error);
      collectionLogger.error(`Failed to collect balance sheet for ${symbol}`, { error: results.balanceSheet.error });
    }
    
    try {
      // Collect RSI
      await this.collectRSI(symbol);
      results.rsi.success = true;
    } catch (error) {
      results.rsi.error = error instanceof Error ? error.message : String(error);
      collectionLogger.error(`Failed to collect RSI for ${symbol}`, { error: results.rsi.error });
    }
    
    return results;
  }
  
  /**
   * Collects data for all symbols in a watchlist
   */
  async collectDataForWatchlist() {
    try {
      collectionLogger.info('Starting data collection for watchlist symbols');
      
      // Query user watchlist for unique symbols
      const watchlistItems = await db
        .select({ symbol: userWatchlist.symbol })
        .from(userWatchlist)
        .where(userWatchlist.isActive);
      
      if (!watchlistItems || watchlistItems.length === 0) {
        collectionLogger.info('No watchlist items found');
        return [];
      }
      
      // Get unique symbols
      const symbols = [...new Set(watchlistItems.map(item => item.symbol))];
      collectionLogger.info(`Found ${symbols.length} unique symbols in watchlists`);
      
      // Process each symbol
      const results = [];
      
      for (const symbol of symbols) {
        try {
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1200)); // Alpha Vantage free tier: max 5 requests per minute
          
          const result = await this.collectAllDataForSymbol(symbol as string);
          results.push({ symbol, ...result });
          
          collectionLogger.info(`Completed data collection for ${symbol}`);
        } catch (error) {
          collectionLogger.error(`Error processing symbol ${symbol}`, { 
            error: error instanceof Error ? error.message : String(error) 
          });
          
          results.push({ 
            symbol, 
            error: error instanceof Error ? error.message : String(error),
            success: false 
          });
        }
      }
      
      collectionLogger.info(`Completed data collection for ${results.length} symbols`);
      return results;
    } catch (error) {
      collectionLogger.error('Error collecting data for watchlist', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
}

// Export a singleton instance
export const dataCollectionService = new DataCollectionService(); 
import { Router } from "express";
import { db } from "../../lib/db";
import { logger } from "../../lib/logger";
import { z } from "zod";
import axios from 'axios';

const router = Router();

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const dateRangeSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const symbolsSchema = z.object({
  symbols: z.string().optional(),
});

// Validation middleware
const validatePagination = (req, res, next) => {
  try {
    const { page, limit } = paginationSchema.parse({
      page: req.query.page,
      limit: req.query.limit,
    });
    req.pagination = { page, limit };
    next();
  } catch (error) {
    logger.error("Pagination validation error", error);
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
      errors: error.errors,
    });
  }
};

const validateDateRange = (req, res, next) => {
  try {
    const { start_date, end_date } = dateRangeSchema.parse({
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    });
    req.dateRange = { start_date, end_date };
    next();
  } catch (error) {
    logger.error("Date range validation error", error);
    return res.status(400).json({
      success: false,
      message: "Invalid date range parameters",
      errors: error.errors,
    });
  }
};

const validateSymbols = (req, res, next) => {
  try {
    const { symbols } = symbolsSchema.parse({
      symbols: req.query.symbols,
    });
    req.symbols = symbols ? symbols.split(",") : [];
    next();
  } catch (error) {
    logger.error("Symbols validation error", error);
    return res.status(400).json({
      success: false,
      message: "Invalid symbols parameter",
      errors: error.errors,
    });
  }
};

// Helper function to add date range filters to a query
const addDateRangeFilters = (query, { start_date, end_date }, dateField) => {
  if (start_date) {
    query = query.gte(dateField, start_date);
  }
  if (end_date) {
    query = query.lte(dateField, end_date);
  }
  return query;
};

// Routes

// Get bank reports
router.get(
  "/bank-reports",
  validatePagination,
  validateDateRange,
  async (req, res) => {
    try {
      const { page, limit } = req.pagination;
      const { start_date, end_date } = req.dateRange;
      const bank_name = req.query.bank_name;
      const report_type = req.query.report_type;
      
      // Count total for pagination
      let countQuery = db.from("bank_reports").select("*", { count: "exact", head: true });
      
      // Apply filters
      if (bank_name && bank_name !== "all") {
        countQuery = countQuery.eq("bank_name", bank_name);
      }
      
      if (report_type && report_type !== "all") {
        countQuery = countQuery.eq("report_type", report_type);
      }
      
      countQuery = addDateRangeFilters(countQuery, { start_date, end_date }, "report_date");
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error("Error counting bank reports", countError);
        return res.status(500).json({
          success: false,
          message: "Error fetching bank reports count",
        });
      }
      
      // Main query with pagination
      let query = db
        .from("bank_reports")
        .select("*")
        .order("report_date", { ascending: false });
      
      // Apply filters
      if (bank_name && bank_name !== "all") {
        query = query.eq("bank_name", bank_name);
      }
      
      if (report_type && report_type !== "all") {
        query = query.eq("report_type", report_type);
      }
      
      query = addDateRangeFilters(query, { start_date, end_date }, "report_date");
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching bank reports", error);
        return res.status(500).json({
          success: false,
          message: "Error fetching bank reports",
        });
      }
      
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: totalPages,
        },
      });
    } catch (error) {
      logger.error("Error in bank reports endpoint", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching bank reports",
      });
    }
  }
);

// Get YouTube videos
router.get(
  "/youtube-videos",
  validatePagination,
  validateDateRange,
  async (req, res) => {
    try {
      const { page, limit } = req.pagination;
      const { start_date, end_date } = req.dateRange;
      const channel = req.query.channel;
      
      // Count total for pagination
      let countQuery = db.from("youtube_videos").select("*", { count: "exact", head: true });
      
      // Apply filters
      if (channel && channel !== "all") {
        countQuery = countQuery.eq("channel", channel);
      }
      
      countQuery = addDateRangeFilters(countQuery, { start_date, end_date }, "publish_date");
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error("Error counting YouTube videos", countError);
        return res.status(500).json({
          success: false,
          message: "Error fetching YouTube videos count",
        });
      }
      
      // Main query with pagination
      let query = db
        .from("youtube_videos")
        .select("*")
        .order("publish_date", { ascending: false });
      
      // Apply filters
      if (channel && channel !== "all") {
        query = query.eq("channel", channel);
      }
      
      query = addDateRangeFilters(query, { start_date, end_date }, "publish_date");
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching YouTube videos", error);
        return res.status(500).json({
          success: false,
          message: "Error fetching YouTube videos",
        });
      }
      
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: totalPages,
        },
      });
    } catch (error) {
      logger.error("Error in YouTube videos endpoint", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching YouTube videos",
      });
    }
  }
);

// Get insider trades
router.get(
  "/insider-trades",
  validatePagination,
  validateDateRange,
  validateSymbols,
  async (req, res) => {
    try {
      const { page, limit } = req.pagination;
      const { start_date, end_date } = req.dateRange;
      const symbols = req.symbols;
      const transaction_type = req.query.transaction_type;
      
      // Count total for pagination
      let countQuery = db.from("insider_trades").select("*", { count: "exact", head: true });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        countQuery = countQuery.in("symbol", symbols);
      }
      
      if (transaction_type && transaction_type !== "all") {
        countQuery = countQuery.eq("transaction_type", transaction_type);
      }
      
      countQuery = addDateRangeFilters(countQuery, { start_date, end_date }, "transaction_date");
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error("Error counting insider trades", countError);
        return res.status(500).json({
          success: false,
          message: "Error fetching insider trades count",
        });
      }
      
      // Main query with pagination
      let query = db
        .from("insider_trades")
        .select("*")
        .order("transaction_date", { ascending: false });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        query = query.in("symbol", symbols);
      }
      
      if (transaction_type && transaction_type !== "all") {
        query = query.eq("transaction_type", transaction_type);
      }
      
      query = addDateRangeFilters(query, { start_date, end_date }, "transaction_date");
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching insider trades", error);
        return res.status(500).json({
          success: false,
          message: "Error fetching insider trades",
        });
      }
      
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: totalPages,
        },
      });
    } catch (error) {
      logger.error("Error in insider trades endpoint", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching insider trades",
      });
    }
  }
);

// Get political trades
router.get(
  "/political-trades",
  validatePagination,
  validateDateRange,
  validateSymbols,
  async (req, res) => {
    try {
      const { page, limit } = req.pagination;
      const { start_date, end_date } = req.dateRange;
      const symbols = req.symbols;
      const party = req.query.party;
      
      // Count total for pagination
      let countQuery = db.from("political_trades").select("*", { count: "exact", head: true });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        countQuery = countQuery.in("symbol", symbols);
      }
      
      if (party && party !== "all") {
        countQuery = countQuery.eq("party", party);
      }
      
      countQuery = addDateRangeFilters(countQuery, { start_date, end_date }, "transaction_date");
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error("Error counting political trades", countError);
        return res.status(500).json({
          success: false,
          message: "Error fetching political trades count",
        });
      }
      
      // Main query with pagination
      let query = db
        .from("political_trades")
        .select("*")
        .order("transaction_date", { ascending: false });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        query = query.in("symbol", symbols);
      }
      
      if (party && party !== "all") {
        query = query.eq("party", party);
      }
      
      query = addDateRangeFilters(query, { start_date, end_date }, "transaction_date");
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching political trades", error);
        return res.status(500).json({
          success: false,
          message: "Error fetching political trades",
        });
      }
      
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: totalPages,
        },
      });
    } catch (error) {
      logger.error("Error in political trades endpoint", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching political trades",
      });
    }
  }
);

// Get hedge fund trades
router.get(
  "/hedge-fund-trades",
  validatePagination,
  validateDateRange,
  validateSymbols,
  async (req, res) => {
    try {
      const { page, limit } = req.pagination;
      const { start_date, end_date } = req.dateRange;
      const symbols = req.symbols;
      const fund_name = req.query.fund_name;
      const change_type = req.query.change_type;
      
      // Count total for pagination
      let countQuery = db.from("hedge_fund_trades").select("*", { count: "exact", head: true });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        countQuery = countQuery.in("symbol", symbols);
      }
      
      if (fund_name && fund_name !== "all") {
        countQuery = countQuery.eq("fund_name", fund_name);
      }
      
      if (change_type && change_type !== "all") {
        countQuery = countQuery.eq("change_type", change_type);
      }
      
      countQuery = addDateRangeFilters(countQuery, { start_date, end_date }, "filing_date");
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error("Error counting hedge fund trades", countError);
        return res.status(500).json({
          success: false,
          message: "Error fetching hedge fund trades count",
        });
      }
      
      // Main query with pagination
      let query = db
        .from("hedge_fund_trades")
        .select("*")
        .order("filing_date", { ascending: false });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        query = query.in("symbol", symbols);
      }
      
      if (fund_name && fund_name !== "all") {
        query = query.eq("fund_name", fund_name);
      }
      
      if (change_type && change_type !== "all") {
        query = query.eq("change_type", change_type);
      }
      
      query = addDateRangeFilters(query, { start_date, end_date }, "filing_date");
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching hedge fund trades", error);
        return res.status(500).json({
          success: false,
          message: "Error fetching hedge fund trades",
        });
      }
      
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: totalPages,
        },
      });
    } catch (error) {
      logger.error("Error in hedge fund trades endpoint", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching hedge fund trades",
      });
    }
  }
);

// Get financial news
router.get(
  "/financial-news",
  validatePagination,
  validateDateRange,
  validateSymbols,
  async (req, res) => {
    try {
      const { page, limit } = req.pagination;
      const { start_date, end_date } = req.dateRange;
      const symbols = req.symbols;
      const source = req.query.source;
      const sentiment = req.query.sentiment;
      
      // Count total for pagination
      let countQuery = db.from("financial_news").select("*", { count: "exact", head: true });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        countQuery = countQuery.contains("symbols", symbols);
      }
      
      if (source && source !== "all") {
        countQuery = countQuery.eq("source", source);
      }
      
      if (sentiment) {
        if (sentiment === "positive") {
          countQuery = countQuery.gte("sentiment", 0.3);
        } else if (sentiment === "negative") {
          countQuery = countQuery.lte("sentiment", -0.3);
        } else if (sentiment === "neutral") {
          countQuery = countQuery.and(`sentiment.gte.-0.3,sentiment.lte.0.3`);
        }
      }
      
      countQuery = addDateRangeFilters(countQuery, { start_date, end_date }, "publish_date");
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error("Error counting financial news", countError);
        return res.status(500).json({
          success: false,
          message: "Error fetching financial news count",
        });
      }
      
      // Main query with pagination
      let query = db
        .from("financial_news")
        .select("*")
        .order("publish_date", { ascending: false });
      
      // Apply filters
      if (symbols && symbols.length > 0) {
        query = query.contains("symbols", symbols);
      }
      
      if (source && source !== "all") {
        query = query.eq("source", source);
      }
      
      if (sentiment) {
        if (sentiment === "positive") {
          query = query.gte("sentiment", 0.3);
        } else if (sentiment === "negative") {
          query = query.lte("sentiment", -0.3);
        } else if (sentiment === "neutral") {
          query = query.and(`sentiment.gte.-0.3,sentiment.lte.0.3`);
        }
      }
      
      query = addDateRangeFilters(query, { start_date, end_date }, "publish_date");
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching financial news", error);
        return res.status(500).json({
          success: false,
          message: "Error fetching financial news",
        });
      }
      
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: totalPages,
        },
      });
    } catch (error) {
      logger.error("Error in financial news endpoint", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching financial news",
      });
    }
  }
);

// Get dashboard summary with latest data from all sources
router.get("/dashboard-summary", async (req, res) => {
  try {
    // Get the latest bank reports
    const { data: bankReports, error: bankReportsError } = await db
      .from("bank_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(3);
    
    if (bankReportsError) {
      logger.error("Error fetching bank reports for dashboard", bankReportsError);
    }
    
    // Get the latest YouTube videos
    const { data: youtubeVideos, error: youtubeVideosError } = await db
      .from("youtube_videos")
      .select("*")
      .order("publish_date", { ascending: false })
      .limit(3);
    
    if (youtubeVideosError) {
      logger.error("Error fetching YouTube videos for dashboard", youtubeVideosError);
    }
    
    // Get the latest insider trades
    const { data: insiderTrades, error: insiderTradesError } = await db
      .from("insider_trades")
      .select("*")
      .order("transaction_date", { ascending: false })
      .limit(3);
    
    if (insiderTradesError) {
      logger.error("Error fetching insider trades for dashboard", insiderTradesError);
    }
    
    // Get the latest political trades
    const { data: politicalTrades, error: politicalTradesError } = await db
      .from("political_trades")
      .select("*")
      .order("transaction_date", { ascending: false })
      .limit(3);
    
    if (politicalTradesError) {
      logger.error("Error fetching political trades for dashboard", politicalTradesError);
    }
    
    // Get the latest hedge fund trades
    const { data: hedgeFundTrades, error: hedgeFundTradesError } = await db
      .from("hedge_fund_trades")
      .select("*")
      .order("filing_date", { ascending: false })
      .limit(3);
    
    if (hedgeFundTradesError) {
      logger.error("Error fetching hedge fund trades for dashboard", hedgeFundTradesError);
    }
    
    // Get the latest financial news
    const { data: financialNews, error: financialNewsError } = await db
      .from("financial_news")
      .select("*")
      .order("publish_date", { ascending: false })
      .limit(3);
    
    if (financialNewsError) {
      logger.error("Error fetching financial news for dashboard", financialNewsError);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        bankReports: bankReports || [],
        youtubeVideos: youtubeVideos || [],
        insiderTrades: insiderTrades || [],
        politicalTrades: politicalTrades || [],
        hedgeFundTrades: hedgeFundTrades || [],
        financialNews: financialNews || [],
      },
    });
  } catch (error) {
    logger.error("Error in dashboard summary endpoint", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard summary",
    });
  }
});

// Add this route to fetch analyst sentiment and earnings data
router.get("/analyst-sentiment", async (req, res) => {
  try {
    const symbol = req.query.symbol as string;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Symbol parameter is required"
      });
    }
    
    logger.info(`Fetching analyst sentiment data for ${symbol}`);
    
    // Fetch data from Unusual Whales API
    const unusualWhalesAPI = process.env.API_KEY_UNUSUAL_WHALES;
    if (!unusualWhalesAPI) {
      return res.status(500).json({
        success: false,
        message: "Unusual Whales API key not configured"
      });
    }
    
    // Parallel requests for analyst ratings and earnings data
    const [analystResponse, earningsResponse] = await Promise.all([
      axios.get(`https://api.unusualwhales.com/api/analyst-ratings/${symbol}`, {
        headers: { 'Authorization': `Bearer ${unusualWhalesAPI}` }
      }),
      axios.get(`https://api.unusualwhales.com/api/earnings/${symbol}`, {
        headers: { 'Authorization': `Bearer ${unusualWhalesAPI}` }
      })
    ]);
    
    const analystData = analystResponse.data;
    const earningsData = earningsResponse.data;
    
    // Transform analyst ratings for consistent structure
    const transformedRatings = analystData.ratings.map((rating: any) => ({
      firm: rating.firm,
      analyst: rating.analyst || 'Unknown',
      rating: rating.rating,
      priceTarget: rating.priceTarget,
      previousRating: rating.previousRating,
      previousPriceTarget: rating.previousPriceTarget,
      date: rating.date
    }));
    
    // Transform earnings data
    const transformedEarnings = earningsData.previousEarnings.map((earning: any) => ({
      reportDate: earning.reportDate,
      fiscalQuarter: earning.fiscalQuarter,
      epsEstimate: earning.epsEstimate,
      epsActual: earning.epsActual,
      revenueEstimate: earning.revenueEstimate / 1000000, // Convert to millions
      revenueActual: earning.revenueActual / 1000000, // Convert to millions
      surprise: earning.surprise
    }));
    
    // Combine the data
    const responseData = {
      symbol: symbol.toUpperCase(),
      companyName: analystData.companyName || earningsData.companyName || symbol,
      sector: analystData.sector || '',
      analystConsensus: analystData.consensus || 'N/A',
      averagePriceTarget: analystData.averagePriceTarget || 0,
      highPriceTarget: analystData.highPriceTarget || 0,
      lowPriceTarget: analystData.lowPriceTarget || 0,
      numberOfAnalysts: analystData.numberOfAnalysts || 0,
      upRevisions: analystData.upRevisions || 0,
      downRevisions: analystData.downRevisions || 0,
      lastRevisionDate: analystData.lastRevisionDate || '',
      analystRatings: transformedRatings,
      earnings: {
        nextEarningsDate: earningsData.nextEarningsDate,
        previousEarnings: transformedEarnings
      }
    };
    
    return res.json(responseData);
  } catch (error) {
    logger.error("Error fetching analyst sentiment data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analyst sentiment data",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 
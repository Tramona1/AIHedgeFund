import { pgTable, serial, timestamp, varchar, text, jsonb, numeric, boolean, index } from "drizzle-orm/pg-core";

// Stock data table for storing latest price and volume information
export const stockData = pgTable(
  "stock_data",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    price: numeric("price", { precision: 15, scale: 4 }),
    openPrice: numeric("open_price", { precision: 15, scale: 4 }),
    highPrice: numeric("high_price", { precision: 15, scale: 4 }),
    lowPrice: numeric("low_price", { precision: 15, scale: 4 }),
    previousClose: numeric("previous_close", { precision: 15, scale: 4 }),
    volume: numeric("volume", { precision: 20, scale: 0 }),
    change: numeric("change", { precision: 15, scale: 4 }),
    changePercent: numeric("change_percent", { precision: 10, scale: 4 }),
    timestamp: timestamp("timestamp").defaultNow(),
    dataSource: varchar("data_source", { length: 50 }).default("alpha_vantage"),
    metaData: jsonb("meta_data")
  },
  (table) => {
    return {
      symbolIdx: index("stock_data_symbol_idx").on(table.symbol),
      timestampIdx: index("stock_data_timestamp_idx").on(table.timestamp)
    };
  }
);

// Company information
export const companyInfo = pgTable(
  "company_info",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    name: varchar("name", { length: 255 }),
    description: text("description"),
    sector: varchar("sector", { length: 100 }),
    industry: varchar("industry", { length: 100 }),
    marketCap: numeric("market_cap", { precision: 30, scale: 2 }),
    peRatio: numeric("pe_ratio", { precision: 15, scale: 4 }),
    dividendYield: numeric("dividend_yield", { precision: 10, scale: 4 }),
    eps: numeric("eps", { precision: 15, scale: 4 }),
    beta: numeric("beta", { precision: 10, scale: 4 }),
    fiftyTwoWeekHigh: numeric("fifty_two_week_high", { precision: 15, scale: 4 }),
    fiftyTwoWeekLow: numeric("fifty_two_week_low", { precision: 15, scale: 4 }),
    sharesOutstanding: numeric("shares_outstanding", { precision: 20, scale: 0 }),
    lastUpdated: timestamp("last_updated").defaultNow(),
    dataSource: varchar("data_source", { length: 50 }).default("alpha_vantage"),
    metaData: jsonb("meta_data")
  },
  (table) => {
    return {
      symbolIdx: index("company_info_symbol_idx").on(table.symbol),
      sectorIdx: index("company_info_sector_idx").on(table.sector)
    };
  }
);

// Balance sheet data
export const balanceSheet = pgTable(
  "balance_sheet",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    fiscalDateEnding: varchar("fiscal_date_ending", { length: 20 }).notNull(),
    reportedCurrency: varchar("reported_currency", { length: 10 }),
    totalAssets: numeric("total_assets", { precision: 30, scale: 2 }),
    totalCurrentAssets: numeric("total_current_assets", { precision: 30, scale: 2 }),
    cashAndCashEquivalents: numeric("cash_and_cash_equivalents", { precision: 30, scale: 2 }),
    inventory: numeric("inventory", { precision: 30, scale: 2 }),
    totalLiabilities: numeric("total_liabilities", { precision: 30, scale: 2 }),
    totalCurrentLiabilities: numeric("total_current_liabilities", { precision: 30, scale: 2 }),
    totalShareholderEquity: numeric("total_shareholder_equity", { precision: 30, scale: 2 }),
    retainedEarnings: numeric("retained_earnings", { precision: 30, scale: 2 }),
    commonStock: numeric("common_stock", { precision: 30, scale: 2 }),
    isQuarterly: boolean("is_quarterly").default(false),
    lastUpdated: timestamp("last_updated").defaultNow(),
    dataSource: varchar("data_source", { length: 50 }).default("alpha_vantage"),
    fullData: jsonb("full_data")
  },
  (table) => {
    return {
      symbolIdx: index("balance_sheet_symbol_idx").on(table.symbol),
      dateIdx: index("balance_sheet_date_idx").on(table.fiscalDateEnding)
    };
  }
);

// Income statement data
export const incomeStatement = pgTable(
  "income_statement",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    fiscalDateEnding: varchar("fiscal_date_ending", { length: 20 }).notNull(),
    reportedCurrency: varchar("reported_currency", { length: 10 }),
    totalRevenue: numeric("total_revenue", { precision: 30, scale: 2 }),
    costOfRevenue: numeric("cost_of_revenue", { precision: 30, scale: 2 }),
    grossProfit: numeric("gross_profit", { precision: 30, scale: 2 }),
    operatingExpenses: numeric("operating_expenses", { precision: 30, scale: 2 }),
    operatingIncome: numeric("operating_income", { precision: 30, scale: 2 }),
    incomeBeforeTax: numeric("income_before_tax", { precision: 30, scale: 2 }),
    netIncome: numeric("net_income", { precision: 30, scale: 2 }),
    eps: numeric("eps", { precision: 15, scale: 4 }),
    isQuarterly: boolean("is_quarterly").default(false),
    lastUpdated: timestamp("last_updated").defaultNow(),
    dataSource: varchar("data_source", { length: 50 }).default("alpha_vantage"),
    fullData: jsonb("full_data")
  },
  (table) => {
    return {
      symbolIdx: index("income_statement_symbol_idx").on(table.symbol),
      dateIdx: index("income_statement_date_idx").on(table.fiscalDateEnding)
    };
  }
);

// Technical indicators
export const technicalIndicators = pgTable(
  "technical_indicators",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    indicatorType: varchar("indicator_type", { length: 20 }).notNull(), // RSI, MACD, etc.
    date: varchar("date", { length: 20 }).notNull(),
    value: numeric("value", { precision: 15, scale: 6 }),
    parameters: jsonb("parameters"), // Store parameters used to generate the indicator
    timestamp: timestamp("timestamp").defaultNow(),
    dataSource: varchar("data_source", { length: 50 }).default("alpha_vantage"),
    metaData: jsonb("meta_data")
  },
  (table) => {
    return {
      symbolIdx: index("technical_indicators_symbol_idx").on(table.symbol),
      typeIdx: index("technical_indicators_type_idx").on(table.indicatorType),
      dateIdx: index("technical_indicators_date_idx").on(table.date)
    };
  }
);

// User watchlists
export const userWatchlist = pgTable(
  "user_watchlist",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    addedAt: timestamp("added_at").defaultNow(),
    notes: text("notes"),
    isActive: boolean("is_active").default(true)
  },
  (table) => {
    return {
      userIdIdx: index("user_watchlist_user_id_idx").on(table.userId),
      symbolIdx: index("user_watchlist_symbol_idx").on(table.symbol),
      userSymbolIdx: index("user_watchlist_user_symbol_idx").on(table.userId, table.symbol)
    };
  }
); 
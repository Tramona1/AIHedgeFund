declare module '@repo/db/schema/market-data' {
  import { AnyPgColumn } from 'drizzle-orm/pg-core';
  import { z } from 'zod';

  // Tables are defined as any to allow the service code to reference fields directly
  export const stockData: {
    symbol: AnyPgColumn;
    price: AnyPgColumn;
    openPrice: AnyPgColumn;
    highPrice: AnyPgColumn;
    lowPrice: AnyPgColumn;
    previousClose: AnyPgColumn;
    volume: AnyPgColumn;
    change: AnyPgColumn;
    changePercent: AnyPgColumn;
    timestamp: AnyPgColumn;
    dataSource: AnyPgColumn;
    metaData: AnyPgColumn;
    id: AnyPgColumn;
    [key: string]: any;
  };

  export const companyInfo: {
    id: AnyPgColumn;
    symbol: AnyPgColumn;
    name: AnyPgColumn;
    description: AnyPgColumn;
    sector: AnyPgColumn;
    industry: AnyPgColumn;
    marketCap: AnyPgColumn;
    peRatio: AnyPgColumn;
    dividendYield: AnyPgColumn;
    eps: AnyPgColumn;
    beta: AnyPgColumn;
    fiftyTwoWeekHigh: AnyPgColumn;
    fiftyTwoWeekLow: AnyPgColumn;
    sharesOutstanding: AnyPgColumn;
    lastUpdated: AnyPgColumn;
    dataSource: AnyPgColumn;
    metaData: AnyPgColumn;
    [key: string]: any;
  };
  
  // Balance sheet table
  export const balanceSheet: {
    id: AnyPgColumn;
    symbol: AnyPgColumn;
    fiscalDateEnding: AnyPgColumn;
    reportedCurrency: AnyPgColumn;
    totalAssets: AnyPgColumn;
    totalCurrentAssets: AnyPgColumn;
    cashAndCashEquivalents: AnyPgColumn;
    inventory: AnyPgColumn;
    totalLiabilities: AnyPgColumn;
    totalCurrentLiabilities: AnyPgColumn;
    totalShareholderEquity: AnyPgColumn;
    retainedEarnings: AnyPgColumn;
    commonStock: AnyPgColumn;
    isQuarterly: AnyPgColumn;
    lastUpdated: AnyPgColumn;
    dataSource: AnyPgColumn;
    fullData: AnyPgColumn;
    [key: string]: any;
  };
  
  // Income statement table
  export const incomeStatement: {
    id: AnyPgColumn;
    symbol: AnyPgColumn;
    fiscalDateEnding: AnyPgColumn;
    reportedCurrency: AnyPgColumn;
    totalRevenue: AnyPgColumn;
    costOfRevenue: AnyPgColumn;
    grossProfit: AnyPgColumn;
    operatingExpenses: AnyPgColumn;
    operatingIncome: AnyPgColumn;
    incomeBeforeTax: AnyPgColumn;
    netIncome: AnyPgColumn;
    eps: AnyPgColumn;
    isQuarterly: AnyPgColumn;
    lastUpdated: AnyPgColumn;
    dataSource: AnyPgColumn;
    fullData: AnyPgColumn;
    [key: string]: any;
  };
  
  // Technical indicators table
  export const technicalIndicators: {
    id: AnyPgColumn;
    symbol: AnyPgColumn;
    indicatorType: AnyPgColumn;
    date: AnyPgColumn;
    value: AnyPgColumn;
    parameters: AnyPgColumn;
    timestamp: AnyPgColumn;
    dataSource: AnyPgColumn;
    metaData: AnyPgColumn;
    [key: string]: any;
  };
  
  // User watchlist table
  export const userWatchlist: {
    id: AnyPgColumn;
    userId: AnyPgColumn;
    symbol: AnyPgColumn;
    addedAt: AnyPgColumn;
    notes: AnyPgColumn;
    isActive: AnyPgColumn;
    [key: string]: any;
  };

  // Types
  export type StockData = any;
  export type NewStockData = any;
  export type CompanyInfo = any;
  export type NewCompanyInfo = any;
  export type BalanceSheet = any;
  export type NewBalanceSheet = any;
  export type IncomeStatement = any;
  export type NewIncomeStatement = any;
  export type TechnicalIndicator = any;
  export type NewTechnicalIndicator = any;
  export type UserWatchlist = any;
  export type NewUserWatchlist = any;
} 
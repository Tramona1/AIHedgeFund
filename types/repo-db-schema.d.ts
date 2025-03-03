declare module '@repo/db/schema' {
  // Export all schema tables
  export const stockData: any;
  export const companyInfo: any;
  export const userWatchlist: any; 
  export const optionsFlow: any;
  export const darkPoolData: any;
  export const newsletterPreferences: any;
  export const unusualWhales: any;
  // Add other tables as needed
}

declare module '@repo/db/schema/index.js' {
  export * from '@repo/db/schema';
}

declare module '@repo/db/schema/unusual-whales.js' {
  export * from '@repo/db/schema';
} 
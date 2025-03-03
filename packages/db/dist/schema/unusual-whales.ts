import { pgTable, text, timestamp, integer, numeric, index } from 'drizzle-orm/pg-core';

/**
 * Options Flow data from Unusual Whales API
 */
export const optionsFlow = pgTable('options_flow', {
  id: text('id').notNull().primaryKey(),
  ticker: text('ticker').notNull(),
  strike: numeric('strike').notNull(),
  contractType: text('contract_type', { enum: ['call', 'put'] }).notNull(),
  expiration: timestamp('expiration').notNull(),
  sentiment: text('sentiment', { enum: ['bullish', 'bearish', 'neutral'] }).notNull(),
  volume: integer('volume').notNull(),
  openInterest: integer('open_interest').notNull(),
  premium: numeric('premium').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  volatility: numeric('volatility').notNull(),
  underlyingPrice: numeric('underlying_price').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tickerIdx: index('options_flow_ticker_idx').on(table.ticker),
    timestampIdx: index('options_flow_timestamp_idx').on(table.timestamp),
    sentimentIdx: index('options_flow_sentiment_idx').on(table.sentiment),
    expirationIdx: index('options_flow_expiration_idx').on(table.expiration),
  };
});

/**
 * Dark Pool data from Unusual Whales API
 */
export const darkPoolData = pgTable('dark_pool_data', {
  id: text('id').notNull().primaryKey(),
  ticker: text('ticker').notNull(),
  volume: integer('volume').notNull(),
  price: numeric('price').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  blocksCount: integer('blocks_count').notNull(),
  percentOfVolume: numeric('percent_of_volume').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tickerIdx: index('dark_pool_ticker_idx').on(table.ticker),
    timestampIdx: index('dark_pool_timestamp_idx').on(table.timestamp),
    volumeIdx: index('dark_pool_volume_idx').on(table.volume),
  };
}); 
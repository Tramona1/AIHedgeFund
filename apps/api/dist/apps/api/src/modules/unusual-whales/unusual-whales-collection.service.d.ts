import { optionsFlow, darkPoolData } from "@repo/db/schema/unusual-whales.js";
interface OptionsFlowFilter {
    minVolume?: number;
    ticker?: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    dateFrom?: string;
    dateTo?: string;
}
interface DarkPoolFilter {
    minVolume?: number;
    ticker?: string;
    dateFrom?: string;
    dateTo?: string;
}
interface PaginatedResponse<T> {
    data: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}
/**
 * Service for accessing stored Unusual Whales data
 */
declare class UnusualWhalesCollectionService {
    /**
     * Get options flow data with pagination and filtering
     */
    getOptionsFlow(page?: number, pageSize?: number, filter?: OptionsFlowFilter): Promise<PaginatedResponse<typeof optionsFlow.$inferSelect>>;
    /**
     * Get dark pool data with pagination and filtering
     */
    getDarkPoolData(page?: number, pageSize?: number, filter?: DarkPoolFilter): Promise<PaginatedResponse<typeof darkPoolData.$inferSelect>>;
}
export declare const unusualWhalesCollectionService: UnusualWhalesCollectionService;
export {};

interface OptionsFlowItem {
    id: string;
    ticker: string;
    strike: number;
    contractType: 'call' | 'put';
    expiration: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    volume: number;
    openInterest: number;
    premium: number;
    timestamp: string;
    volatility: number;
    underlyingPrice: number;
}
interface DarkPoolItem {
    id: string;
    ticker: string;
    volume: number;
    price: number;
    timestamp: string;
    blocksCount: number;
    percentOfVolume: number;
}
/**
 * Service for interacting with the Unusual Whales API
 */
declare class UnusualWhalesService {
    private apiKey;
    private cacheTTL;
    constructor();
    /**
     * Fetch options flow data from Unusual Whales API
     */
    getLatestOptionsFlow(): Promise<OptionsFlowItem[]>;
    /**
     * Fetch dark pool data from Unusual Whales API
     */
    getLatestDarkPoolData(): Promise<DarkPoolItem[]>;
    /**
     * Store options flow data in the database
     */
    private storeOptionsFlowData;
    /**
     * Store dark pool data in the database
     */
    private storeDarkPoolData;
}
export declare const unusualWhalesService: UnusualWhalesService;
export {};

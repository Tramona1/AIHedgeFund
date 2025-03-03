/**
 * Function to collect options flow data from Unusual Whales API
 */
export declare function collectOptionsFlowData(): Promise<boolean>;
/**
 * Function to collect dark pool data from Unusual Whales API
 */
export declare function collectDarkPoolData(): Promise<boolean>;
/**
 * Function to run all Unusual Whales data collection jobs
 */
export declare function runUnusualWhalesCollectionJobs(): Promise<{
    optionsFlowSuccess: boolean;
    darkPoolSuccess: boolean;
}>;

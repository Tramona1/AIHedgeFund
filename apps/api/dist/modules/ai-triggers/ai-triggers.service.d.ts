import { AITriggerPayload } from "@repo/db";
export declare const aiTriggersService: {
    /**
     * Process an AI trigger event
     */
    processAITrigger(payload: AITriggerPayload, retries?: number): Promise<void>;
    /**
     * Get AI triggers by ticker
     */
    getAITriggersByTicker(ticker: string): Promise<any>;
};

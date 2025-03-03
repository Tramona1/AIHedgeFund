export interface AiTrigger {
  id: string;
  ticker: string;
  eventType: string;
  details?: Record<string, any>;
  source?: string;
  timestamp: string;
  processed: string;
  processedAt?: string;
}

export interface AiTriggersService {
  /**
   * Register an AI trigger event
   */
  registerTrigger(data: { 
    ticker: string; 
    event_type: string; 
    details?: any 
  }): Promise<{ id: string }>;

  /**
   * Get recent AI triggers by ticker
   */
  getRecentTriggers(ticker: string): Promise<AiTrigger[]>;

  /**
   * Get all AI triggers
   */
  getAllTriggers(): Promise<AiTrigger[]>;
}

export const aiTriggersService: AiTriggersService; 
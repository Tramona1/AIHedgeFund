// AI Chat service for interacting with various AI providers

import { fetchAPI } from './api-utils';
import { geminiService, AIChatResponse } from './gemini-service';

/**
 * AI Chat service that provides a unified interface for AI capabilities
 * Prioritizes backend API endpoints, with fallbacks to direct API calls
 */
export const aiChatService = {
  /**
   * Send a message to the AI and get a response
   */
  sendMessage: async (message: string, context?: string): Promise<AIChatResponse> => {
    try {
      // First try to use the backend API
      try {
        const response = await fetchAPI<AIChatResponse>('/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            message,
            context
          }),
        });
        return response;
      } catch (apiError) {
        console.warn('Backend AI API unavailable, falling back to direct Gemini API:', apiError);
        
        // Fall back to direct Gemini API if backend is unavailable
        return await geminiService.sendMessage(message, context);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      return {
        text: "I'm sorry, I couldn't process your request at this time. Please try again later.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  /**
   * Generate insights for specific market data, stocks, or indicators
   */
  generateInsights: async (
    topic: string, 
    data: Record<string, any>
  ): Promise<AIChatResponse> => {
    try {
      // First try to use the backend API
      try {
        const response = await fetchAPI<AIChatResponse>('/api/ai/insights', {
          method: 'POST',
          body: JSON.stringify({
            topic,
            data
          }),
        });
        return response;
      } catch (apiError) {
        console.warn('Backend AI API unavailable, falling back to direct Gemini API:', apiError);
        
        // Fall back to direct Gemini API
        return await geminiService.generateInsights(topic, data);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        text: "I'm sorry, I couldn't generate insights at this time. Please try again later.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}; 
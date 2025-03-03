// Gemini AI service for interacting with Google's Gemini API

/**
 * Interface for AI chat responses
 */
export interface AIChatResponse {
  text: string;
  sources?: Array<{
    title: string;
    url?: string;
    content?: string;
  }>;
  error?: string;
}

/**
 * Direct Gemini API integration for client-side use
 * This would typically be proxied through your backend for security
 */
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

/**
 * AI Chat service for interacting with Gemini
 */
export const geminiService = {
  /**
   * Send a message to the AI and get a response
   */
  sendMessage: async (message: string, context?: string): Promise<AIChatResponse> => {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY) {
        return {
          text: "Gemini API key is not configured. Please add it to your environment variables.",
          error: "API key missing"
        };
      }
      
      // Background system prompt that guides AI behavior but isn't shown to users
      const systemPrompt = `You are an AI Financial Analyst assistant for the AI Hedge Fund dashboard.
Your role is to help users understand market data, stock movements, financial indicators, and investment strategies.

- Be concise but informative in your explanations
- When discussing stocks, provide balanced perspectives on risks and opportunities
- Use professional financial terminology but explain complex concepts simply
- If asked about specific financial advice, remind users you're providing information, not financial advice
- When appropriate, mention data sources or limitations
- Focus on being helpful for investment research and analysis
- If you don't know something, admit it rather than speculating

IMPORTANT: You are limited to 800 tokens in your response. To ensure your responses are complete:
1. Be concise and prioritize the most important information
2. Structure longer explanations with bullet points or numbered lists
3. Conclude your thoughts properly without cutting off mid-sentence
4. If you're answering a complex question, focus on the key points and offer to provide more details if needed`;
      
      // Prepare the prompt with context if available
      const userPrompt = context 
        ? `Context: ${context}\n\nQuestion: ${message}` 
        : message;
        
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            topK: 32,
            maxOutputTokens: 800,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.candidates && responseData.candidates.length > 0) {
        let text = '';
        for (const part of responseData.candidates[0].content.parts) {
          if (part.text) {
            text += part.text;
          }
        }
        return { text };
      } else {
        throw new Error('No response from Gemini API');
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
      // Check if API key is available
      if (!GEMINI_API_KEY) {
        return {
          text: "Gemini API key is not configured. Please add it to your environment variables.",
          error: "API key missing"
        };
      }
      
      // Create a prompt based on the topic and data
      const prompt = `
      I need insights about ${topic}. 
      
      Here is the relevant data:
      ${JSON.stringify(data, null, 2)}
      
      Please provide:
      1. A concise analysis of this data
      2. Key takeaways for investors
      3. Potential market implications
      4. Any notable patterns or anomalies
      
      IMPORTANT: You are limited to 800 tokens in your response. Be concise, prioritize key insights, and ensure your response is complete without cutting off mid-thought.
      `;
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            topK: 32,
            maxOutputTokens: 800,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const insightData = await response.json();
      
      if (insightData.candidates && insightData.candidates.length > 0) {
        let text = '';
        for (const part of insightData.candidates[0].content.parts) {
          if (part.text) {
            text += part.text;
          }
        }
        return { text };
      } else {
        throw new Error('No response from Gemini API');
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
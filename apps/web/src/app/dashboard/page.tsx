"use client";

import { motion } from "framer-motion"
import { LineChart, Plus, ArrowUp, ArrowDown, X, AlertCircle, Bot, Sparkles, Loader2 } from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { AddTickerDialog } from "../../components/dashboard/AddTickerDialog"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MarketIndicatorsSection } from "@/components/dashboard/MarketIndicatorsSection"
import { MarketIntelligenceSection } from "@/components/dashboard/MarketIntelligenceSection"
import { useUser } from "@clerk/nextjs"
import { userPreferencesAPI, UserPreferences, marketDataAPI, StockData } from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { LineChartIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { aiChatService } from "@/lib/ai-service"
import { AIChatResponse } from "@/lib/gemini-service"
import { Input } from "@/components/ui/input"

// Custom Alert component for error messages
const ErrorAlert = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-destructive/15 border border-destructive text-destructive rounded-md p-4 mb-4 flex items-start gap-2">
    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
    <div className="text-sm">{children}</div>
  </div>
);

// Stock ticker data types
export interface Ticker {
  symbol: string;
  price?: number;
  change?: number;
  volume?: string;
  lastUpdated?: Date;
}

export interface UserState {
  tickers: Ticker[];
}

// Dynamic cache for ticker data - will be populated with real data from API
const TICKER_PRICE_CACHE: Record<string, { price: number; change: number; lastUpdated: Date }> = {};

export default function DashboardPage() {
  const { user } = useUser();
  const [userState, setUserState] = useState<UserState>({ tickers: [] });
  const [addTickerOpen, setAddTickerOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshingData, setRefreshingData] = useState(false);
  
  // AI Research Assistant states
  const [aiQuery, setAiQuery] = useState("is apple a good stock to buy");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiContexts, setAiContexts] = useState<string[]>([]);
  const [aiQueryLoading, setAiQueryLoading] = useState(false);
  
  // Initialize with a typed empty object that includes all properties
  const [currentPreferences, setCurrentPreferences] = useState<Partial<UserPreferences>>({
    tickers: [],
    sectors: [],
    tradingStyle: "",
    updateFrequency: "weekly",
    customTriggers: {}
  });
  
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Helper to get ticker data (from cache or API)
  const getTickerData = async (symbol: string): Promise<{
    price: number;
    change: number;
    lastUpdated: Date;
  }> => {
    const upperSymbol = symbol.toUpperCase();
    
    // Use cached data if available and recent (< 5 minutes old)
    const now = new Date();
    if (TICKER_PRICE_CACHE[upperSymbol] && 
        (now.getTime() - TICKER_PRICE_CACHE[upperSymbol].lastUpdated.getTime() < 5 * 60 * 1000)) {
      return {
        price: TICKER_PRICE_CACHE[upperSymbol].price,
        change: TICKER_PRICE_CACHE[upperSymbol].change,
        lastUpdated: TICKER_PRICE_CACHE[upperSymbol].lastUpdated
      };
    }
    
    // Otherwise fetch from API
    try {
      const stockData = await marketDataAPI.getStockData(upperSymbol);
      
      // Check for structured error response
      const response = stockData as any;
      if (response && response.error) {
        console.error(`API error for ${upperSymbol}:`, response.error, response.message);
        // Continue to fallback logic below
      }
      else if (stockData) {
        // Update cache with real data
        TICKER_PRICE_CACHE[upperSymbol] = {
          price: stockData.price,
          change: stockData.change,
          lastUpdated: stockData.lastUpdated
        };
        
        return {
          price: stockData.price,
          change: stockData.change,
          lastUpdated: stockData.lastUpdated
        };
      }
    } catch (error) {
      console.error(`Error fetching stock data for ${upperSymbol}:`, error);
    }
    
    // If API failed or returned no data, use existing cache if available
    if (TICKER_PRICE_CACHE[upperSymbol]) {
      console.warn(`Using cached data for ${upperSymbol} due to API error`);
      return {
        price: TICKER_PRICE_CACHE[upperSymbol].price,
        change: TICKER_PRICE_CACHE[upperSymbol].change,
        lastUpdated: TICKER_PRICE_CACHE[upperSymbol].lastUpdated
      };
    }
    
    // No data available - show a console error
    console.error(`Could not fetch market data for ${upperSymbol}. Please try again later.`);
    
    // Return zeros as fallback (will be clearly visible as an issue in the UI)
    return {
      price: 0,
      change: 0,
      lastUpdated: now
    };
  };
  
  // Load ticker data on component mount
  useEffect(() => {
    const loadTickerData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        // Always load from localStorage first for instant UI
        const savedState = localStorage.getItem('userState');
        let localTickers: Ticker[] = [];
        
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            localTickers = parsed.tickers || [];
            
            // Immediately set state with localStorage data
            setUserState({ tickers: localTickers });
          } catch (e) {
            console.error('Error parsing localStorage:', e);
            localTickers = [];
          }
        }
        
        // Then load from API if user is logged in (and update if necessary)
        if (user?.id) {
          try {
            const { userPreferences } = await userPreferencesAPI.get(user.id);
            
            if (userPreferences) {
              // Store in state for reference
              setCurrentPreferences(userPreferences);
              
              // Get tickers from API
              const apiTickers = userPreferences.tickers || [];
              
              // Merge tickers from API and localStorage
              // Use Set to deduplicate
              const symbolSet = new Set([
                ...apiTickers,
                ...localTickers.map(t => t.symbol)
              ]);
              
              // Convert back to array of symbols
              const mergedSymbols = Array.from(symbolSet);
              
              // Try to get batch data for all tickers at once
              const tickerDataBatch = mergedSymbols.length > 0 ? 
                await marketDataAPI.getBatchStockData(mergedSymbols) : {};
              
              // Create ticker objects using batch data or existing data
              const mergedTickers = await Promise.all(mergedSymbols.map(async (symbol) => {
                // First check if we have data from the batch request
                if (tickerDataBatch[symbol]) {
                  const data = tickerDataBatch[symbol];
                  
                  // Update cache with the batch data
                  TICKER_PRICE_CACHE[symbol] = {
                    price: data.price,
                    change: data.change,
                    lastUpdated: data.lastUpdated
                  };
                  
                  return {
                    symbol,
                    price: data.price,
                    change: data.change,
                    volume: data.volume.toLocaleString(),
                    lastUpdated: data.lastUpdated
                  };
                }
                
                // Use existing ticker data from localStorage if available
                const existingTicker = localTickers.find(t => t.symbol === symbol);
                if (existingTicker) {
                  return existingTicker;
                }
                
                // Fetch individual ticker data as last resort
                const tickerData = await getTickerData(symbol);
                return {
                  symbol,
                  price: tickerData.price,
                  change: tickerData.change,
                  lastUpdated: tickerData.lastUpdated
                };
              }));
              
              // Update state
              setUserState({ tickers: mergedTickers });
              
              // Save merged tickers back to localStorage
              localStorage.setItem('userState', JSON.stringify({ 
                tickers: mergedTickers 
              }));
            }
          } catch (error) {
            console.error('Error fetching user preferences:', error);
            setLoadError('Failed to load preferences from server. Using cached data.');
            // Already using localStorage data, so no need to load again
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setLoadError('An error occurred while loading your watchlist.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTickerData();
  }, [user?.id]);
  
  // Refresh ticker data periodically
  const refreshTickerData = async () => {
    if (refreshingData || userState.tickers.length === 0) return;
    
    setRefreshingData(true);
    try {
      // Get all symbols
      const symbols = userState.tickers.map(t => t.symbol);
      
      // Fetch batch data
      const tickerDataBatch = await marketDataAPI.getBatchStockData(symbols);
      
      // Update tickers with new data
      const updatedTickers = userState.tickers.map(ticker => {
        const symbol = ticker.symbol;
        
        // If we have new data, use it
        if (tickerDataBatch[symbol]) {
          const data = tickerDataBatch[symbol];
          
          // Update cache
          TICKER_PRICE_CACHE[symbol] = {
            price: data.price,
            change: data.change,
            lastUpdated: data.lastUpdated
          };
          
          return {
            ...ticker,
            price: data.price,
            change: data.change,
            volume: data.volume.toLocaleString(),
            lastUpdated: data.lastUpdated
          };
        }
        
        // Otherwise keep the existing data
        return ticker;
      });
      
      // Update state
      setUserState({ tickers: updatedTickers });
      
      // Save to localStorage
      localStorage.setItem('userState', JSON.stringify({ 
        tickers: updatedTickers 
      }));
    } catch (error) {
      console.error('Error refreshing ticker data:', error);
      console.warn("Could not refresh ticker data. Using cached values.");
    } finally {
      setRefreshingData(false);
    }
  };
  
  // Set up periodic refresh (every 60 seconds)
  useEffect(() => {
    // Track consecutive failures to implement backoff
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    let refreshInterval = 60 * 1000; // Start with 60 seconds
    let timeoutId: NodeJS.Timeout;
    
    const performRefresh = async () => {
      if (refreshingData || userState.tickers.length === 0) {
        // Schedule next refresh without resetting counters
        timeoutId = setTimeout(performRefresh, refreshInterval);
        return;
      }
      
      try {
        setRefreshingData(true);
        await refreshTickerData();
        // Reset on success
        consecutiveFailures = 0;
        refreshInterval = 60 * 1000; // Reset to normal interval after success
      } catch (error) {
        console.error('Error during periodic refresh:', error);
        // Implement exponential backoff on failures
        consecutiveFailures++;
        if (consecutiveFailures >= maxConsecutiveFailures) {
          // Exponential backoff: 2 minutes, then 4, then 8, etc. up to 15 minutes max
          refreshInterval = Math.min(120 * 1000 * Math.pow(2, consecutiveFailures - maxConsecutiveFailures), 15 * 60 * 1000);
          console.warn(`Multiple API failures detected. Reducing refresh frequency to ${refreshInterval/1000} seconds.`);
        }
      } finally {
        setRefreshingData(false);
        // Schedule next refresh
        timeoutId = setTimeout(performRefresh, refreshInterval);
      }
    };
    
    // Initial refresh with a short delay
    timeoutId = setTimeout(performRefresh, 5000);
    
    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userState.tickers]);
  
  // Add ticker to watchlist
  const addTicker = async (symbol: string) => {
    if (!symbol || userState.tickers.some(ticker => ticker.symbol === symbol.toUpperCase())) {
      console.warn(`${symbol.toUpperCase()} is already in your watchlist.`);
      return;
    }
    
    const upperSymbol = symbol.toUpperCase();
    
    // Show loading message
    console.log(`Adding ticker: Fetching data for ${upperSymbol}...`);
    
    // Fetch real data for the new ticker
    try {
      // Get ticker data from API
      const tickerData = await getTickerData(upperSymbol);
      
      // Create new ticker object
      const newTicker: Ticker = {
        symbol: upperSymbol,
        price: tickerData.price,
        change: tickerData.change,
        lastUpdated: tickerData.lastUpdated
      };
      
      // Update local state immediately
      const updatedTickers = [...userState.tickers, newTicker];
      setUserState({ ...userState, tickers: updatedTickers });
      
      // Save to localStorage
      localStorage.setItem('userState', JSON.stringify({
        ...userState,
        tickers: updatedTickers
      }));
      
      // Save to API if user is logged in
      if (user?.id) {
        try {
          // Get current preferences first
          let currentPrefs = { ...currentPreferences };
          
          // Create updated preferences object
          const updatedPreferences: Partial<UserPreferences> = {
            userId: user.id,
            email: user.emailAddresses[0]?.emailAddress || "",
            tickers: [...(currentPrefs.tickers || []), upperSymbol],
            sectors: currentPrefs.sectors || [],
            tradingStyle: currentPrefs.tradingStyle || "Growth",
            updateFrequency: currentPrefs.updateFrequency || "weekly",
            customTriggers: currentPrefs.customTriggers || {}
          };
          
          // Save to API
          await userPreferencesAPI.update(updatedPreferences);
          
          // Update current preferences state
          setCurrentPreferences(updatedPreferences);
          
          console.log(`Ticker added: ${upperSymbol} has been added to your watchlist.`);
        } catch (error) {
          console.error("Error updating user preferences:", error);
          console.warn("The ticker was added locally but could not be saved to your account.");
          // Continue with local state updates even if API update fails
        }
      } else {
        console.log(`Ticker added: ${upperSymbol} has been added to your watchlist.`);
      }
    } catch (error) {
      console.error(`Error adding ticker ${upperSymbol}:`, error);
      console.error(`Could not fetch data for ${upperSymbol}. Please try again later.`);
    }
  };
  
  // Remove ticker from watchlist
  const removeTicker = async (symbol: string) => {
    // Update local state
    const updatedTickers = userState.tickers.filter(
      ticker => ticker.symbol !== symbol
    );
    setUserState({ ...userState, tickers: updatedTickers });
    
    // Save to localStorage
    localStorage.setItem('userState', JSON.stringify({
      ...userState,
      tickers: updatedTickers
    }));
    
    // Save to API if user is logged in
    if (user?.id) {
      try {
        // Create updated preferences object
        const updatedPreferences: Partial<UserPreferences> = {
          userId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          tickers: (currentPreferences.tickers || []).filter(t => t !== symbol),
          sectors: currentPreferences.sectors || [],
          tradingStyle: currentPreferences.tradingStyle || "Growth",
          updateFrequency: currentPreferences.updateFrequency || "weekly",
          customTriggers: currentPreferences.customTriggers || {}
        };
        
        // Save to API
        await userPreferencesAPI.update(updatedPreferences);
        
        // Update current preferences state
        setCurrentPreferences(updatedPreferences);
        
        console.log(`Ticker removed: ${symbol} has been removed from your watchlist.`);
      } catch (error) {
        console.error("Error updating user preferences:", error);
        console.warn("The ticker was removed locally but could not be updated in your account.");
      }
    } else {
      console.log(`Ticker removed: ${symbol} has been removed from your watchlist.`);
    }
  };
  
  // Open AI Chat with context
  const openAiChat = (context: string) => {
    setCurrentContext(context);
    // Reset the message history when opening a new chat with context
    setAiMessages([
      { role: 'assistant', content: 'How can I help you with your analysis?' }
    ]);
    setAiChatOpen(true);
  };

  // Send message to AI
  const sendAiMessage = async () => {
    if (!aiInput.trim() && !currentContext) return;
    
    // Use context if no input but context is available
    const messageToSend = aiInput.trim() || currentContext;
    
    // Update UI immediately with user message
    setAiMessages([...aiMessages, { role: 'user', content: messageToSend }]);
    setAiInput("");
    setIsAiLoading(true);
    
    try {
      // Send to AI service
      const response = await aiChatService.sendMessage(messageToSend, currentContext);
      
      // Add AI response to messages
      setAiMessages(prev => [
        ...prev, 
        { role: 'assistant', content: response.text }
      ]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setAiMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error while processing your request. Please try again later."
        }
      ]);
    } finally {
      setIsAiLoading(false);
      // Clear context after first use
      if (currentContext) setCurrentContext("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col space-y-2 py-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your financial command center</p>
      </div>
      
      {!isLoading && loadError && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {loadError}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      )}

      {/* AI Research Assistant Section */}
      <Container>
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h3 className="text-xl font-semibold">AI Research Assistant</h3>
            </div>
            <p className="text-muted-foreground mt-1">
              Ask me about any stock, market trend, or trading strategy
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask about a stock or market trend..."
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={() => {
                    setAiQueryLoading(true);
                    // Construct the query with selected contexts
                    const contextString = aiContexts.length > 0 
                      ? `Please analyze this query using the following data sources: ${aiContexts.join(', ')}. `
                      : '';
                    
                    // Call the AI service
                    aiChatService.sendMessage(contextString + aiQuery)
                      .then((response) => {
                        setAiResponse(response.text);
                        // Add this interaction to the AI message history
                        setAiMessages([
                          ...aiMessages,
                          { role: 'user', content: aiQuery },
                          { role: 'assistant', content: response.text }
                        ]);
                      })
                      .catch((error) => {
                        setAiResponse("Sorry, I couldn't process your request at this time. Please try again later.");
                        console.error("AI service error:", error);
                      })
                      .finally(() => {
                        setAiQueryLoading(false);
                      });
                  }}
                  disabled={aiQueryLoading || !aiQuery.trim()}
                >
                  {aiQueryLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>Ask AI</>
                  )}
                </Button>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Add context (select data types to search through):</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Hedge Fund Filings", 
                    "Current Positions", 
                    "Insider Trading", 
                    "Technical Analysis", 
                    "Market Sentiment",
                    "Earnings Reports"
                  ].map((context) => (
                    <Badge 
                      key={context}
                      variant={aiContexts.includes(context) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setAiContexts(prev => 
                          prev.includes(context) 
                            ? prev.filter(c => c !== context) 
                            : [...prev, context]
                        );
                      }}
                    >
                      {context}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {aiResponse && (
                <div className="mt-2 p-4 bg-muted/50 rounded-md">
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium mb-1">AI Analysis</p>
                      <p className="text-sm">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Container>

      <MarketIndicatorsSection 
        openAiChatAction={openAiChat}
      />

      <Container className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => setAddTickerOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Ticker
          </Button>
        </div>

        {/* Watchlist */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Your Watchlist</CardTitle>
            <CardDescription>Track the stocks you're interested in</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Progress value={80} className="w-48 mb-4" />
                <p className="text-muted-foreground">Loading your watchlist...</p>
              </div>
            ) : userState.tickers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userState.tickers.map((ticker) => (
                  <Card key={ticker.symbol} className="bg-card border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{ticker.symbol}</h3>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openAiChat(`Analyze the current stock price and recent performance of ${ticker.symbol}, which is currently trading at $${ticker.price?.toFixed(2)} with a ${(ticker.change || 0) >= 0 ? "gain" : "loss"} of ${Math.abs(ticker.change || 0).toFixed(2)}%.`)}
                          >
                            <Bot className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => removeTicker(ticker.symbol)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xl font-medium">
                          ${ticker.price?.toFixed(2)}
                        </span>
                        <Badge
                          className={`${
                            (ticker.change || 0) >= 0
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {(ticker.change || 0) >= 0 ? "+" : ""}
                          {ticker.change?.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Last updated: {ticker.lastUpdated ? new Date(ticker.lastUpdated).toLocaleTimeString() : 'Unknown'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={LineChartIcon}
                title="No stocks in your watchlist"
                description="Add stocks to your watchlist to track their performance"
                actionLabel="Add Stock"
                onAction={() => setAddTickerOpen(true)}
              />
            )}
          </CardContent>
        </Card>

        {/* Market Intelligence */}
        <MarketIntelligenceSection openAiChatAction={openAiChat} />
      </Container>

      {/* Add Ticker Dialog */}
      <AddTickerDialog
        open={addTickerOpen}
        onOpenChangeAction={setAddTickerOpen}
        onAddTickerAction={addTicker}
      />

      {/* AI Chat Dialog */}
      <Dialog open={aiChatOpen} onOpenChange={setAiChatOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Market Analyst</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[60vh]">
            {currentContext && (
              <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded-md">
                Context: {currentContext}
              </div>
            )}
            <div className="border rounded-md p-4 flex-1 overflow-y-auto mb-4">
              {aiMessages.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {aiMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                        <div className="flex gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse"></div>
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-150"></div>
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-300"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full justify-center items-center text-center">
                  <p className="text-muted-foreground">
                    Ask me anything about the market, stocks, or technical indicators.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-md"
                disabled={isAiLoading}
              />
              <Button 
                onClick={sendAiMessage} 
                disabled={isAiLoading || (!aiInput.trim() && !currentContext)}
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Floating AI Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          size="lg" 
          className="rounded-full h-12 w-12 p-0 shadow-lg" 
          onClick={() => {
            // Set a welcome message from the assistant
            setAiMessages([
              { role: 'assistant', content: 'How can I help you with your financial analysis today?' }
            ]);
            
            // Open the chat dialog
            setAiChatOpen(true);
            
            // Automatically send a message to get started
            setTimeout(() => {
              const initialMessage = "Explain to me what this AI assistant can help me with";
              
              // Update UI with user message
              setAiMessages(prev => [...prev, { role: 'user', content: initialMessage }]);
              setIsAiLoading(true);
              
              // Send request to AI service
              aiChatService.sendMessage(initialMessage)
                .then(response => {
                  // Add AI response to messages
                  setAiMessages(prev => [
                    ...prev, 
                    { role: 'assistant', content: response.text }
                  ]);
                })
                .catch(error => {
                  console.error("Error getting AI response:", error);
                  setAiMessages(prev => [
                    ...prev, 
                    { 
                      role: 'assistant', 
                      content: "I'm sorry, I encountered an error while processing your request. Please try again later."
                    }
                  ]);
                })
                .finally(() => {
                  setIsAiLoading(false);
                });
            }, 500); // Small delay to allow dialog to open smoothly
          }}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { ArrowUpDown } from "lucide-react"
import { stockUpdatesAPI, StockUpdate, userPreferencesAPI } from "@/lib/api"

// Import the same interfaces used in the dashboard
interface Ticker {
  symbol: string;
  price?: number;
  change?: number;
  volume?: string;
}

interface UserState {
  tickers: Ticker[];
}

export function OptionsFlowContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [optionsFlow, setOptionsFlow] = useState<StockUpdate[]>([])
  const [error, setError] = useState<string | null>(null)
  const { isLoaded, user } = useUser()
  
  // User state for tickers from localStorage
  const [userState, setUserState] = useState<UserState>({
    tickers: []
  })

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }
  
  // Load user tickers from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('user_tickers')
    if (savedState) {
      setUserState(JSON.parse(savedState))
    }
  }, [])

  // Fetch options flow
  const fetchOptionsFlow = async () => {
    if (!isLoaded || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get local user tickers
      const userTickers = userState.tickers.map(ticker => ticker.symbol);
      
      // Fetch stock updates
      const stockUpdatesData = await stockUpdatesAPI.getAll();
      let updates = stockUpdatesData.updates || [];
      
      // Filter only options flow related updates
      updates = updates.filter(update => 
        update.eventType === 'option_flow' ||
        update.eventType.includes('option_')
      );
      
      // Filter based on user tickers from localStorage
      if (userTickers.length > 0) {
        updates = updates.filter(update => 
          userTickers.includes(update.ticker)
        );
      }
      
      // Sort by date, newest first
      updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setOptionsFlow(updates);
    } catch (error) {
      console.error("Error fetching options flow:", error);
      setError("Failed to load options flow. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchOptionsFlow();
    }
  }, [isLoaded, user, userState.tickers.length]); // Added dependency on tickers

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border rounded-lg">
            <CardContent className="p-6">
              <div className="h-24 animate-pulse bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading options flow"
        description={error}
        icon={ArrowUpDown}
        actionLabel="Try Again"
        onAction={fetchOptionsFlow}
      />
    );
  }

  if (!optionsFlow.length) {
    return (
      <EmptyState
        title="No options flow"
        description={userState.tickers.length === 0 
          ? "Add tickers to your watchlist to see options flow" 
          : "No recent options flow for your watched tickers"}
        icon={ArrowUpDown}
      />
    );
  }

  return (
    <div className="space-y-4">
      {optionsFlow.map((flow) => (
        <Card key={flow.id} className="border rounded-lg">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    ${flow.ticker}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    Options Flow
                  </Badge>
                  {flow.details?.type && (
                    <Badge variant={flow.details.type === 'CALL' ? 'default' : 'destructive'}>
                      {flow.details.type}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(flow.createdAt)}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{flow.title}</h3>
              <p className="text-muted-foreground">{flow.content}</p>
              {flow.details && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between border-t pt-2">
                    <span>Contract: </span>
                    <span className="font-medium">
                      {flow.details.strike && `$${flow.details.strike} `}
                      {flow.details.expiry && new Date(flow.details.expiry).toLocaleDateString()}
                    </span>
                  </div>
                  {flow.details.premium && (
                    <div className="flex justify-between">
                      <span>Premium: </span>
                      <span className="font-medium">
                        ${Number(flow.details.premium).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {flow.details.volume && (
                    <div className="flex justify-between">
                      <span>Volume: </span>
                      <span className="font-medium">
                        {Number(flow.details.volume).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {flow.details.open_interest && (
                    <div className="flex justify-between">
                      <span>Open Interest: </span>
                      <span className="font-medium">
                        {Number(flow.details.open_interest).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {flow.details.sentiment && (
                    <div className="flex justify-between">
                      <span>Sentiment: </span>
                      <span className={`font-medium ${
                        flow.details.sentiment === 'Bullish' 
                          ? 'text-green-600' 
                          : flow.details.sentiment === 'Bearish' 
                            ? 'text-red-600' 
                            : ''
                      }`}>
                        {flow.details.sentiment}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {flow.source && (
                <div className="text-xs text-muted-foreground mt-2">
                  Source: {flow.source}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { BarChart2 } from "lucide-react"
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

export function TechnicalContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [technicalSignals, setTechnicalSignals] = useState<StockUpdate[]>([])
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

  // Get appropriate badge color for signal strength
  const getStrengthBadgeColor = (strength: string) => {
    const lowerStrength = strength.toLowerCase();
    if (lowerStrength.includes('buy') || lowerStrength.includes('bullish')) {
      return 'bg-green-100 text-green-800';
    } else if (lowerStrength.includes('sell') || lowerStrength.includes('bearish')) {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Load user tickers from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('user_tickers')
    if (savedState) {
      setUserState(JSON.parse(savedState))
    }
  }, [])

  // Fetch technical signals
  const fetchTechnicalSignals = async () => {
    if (!isLoaded || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get local user tickers
      const userTickers = userState.tickers.map(ticker => ticker.symbol);
      
      // Fetch stock updates
      const stockUpdatesData = await stockUpdatesAPI.getAll();
      let updates = stockUpdatesData.updates || [];
      
      // Filter only technical signals related updates
      updates = updates.filter(update => 
        update.eventType === 'technical_signal' || 
        update.eventType.includes('technical_')
      );
      
      // Filter based on user tickers from localStorage
      if (userTickers.length > 0) {
        updates = updates.filter(update => 
          userTickers.includes(update.ticker)
        );
      }
      
      // Sort by date, newest first
      updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTechnicalSignals(updates);
    } catch (error) {
      console.error("Error fetching technical signals:", error);
      setError("Failed to load technical signals. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchTechnicalSignals();
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
        title="Error loading technical signals"
        description={error}
        icon={BarChart2}
        actionLabel="Try Again"
        onAction={fetchTechnicalSignals}
      />
    );
  }

  if (!technicalSignals.length) {
    return (
      <EmptyState
        title="No technical signals"
        description={userState.tickers.length === 0 
          ? "Add tickers to your watchlist to see technical signals" 
          : "No recent technical signals for your watched tickers"}
        icon={BarChart2}
      />
    );
  }

  return (
    <div className="space-y-4">
      {technicalSignals.map((signal) => (
        <Card key={signal.id} className="border rounded-lg">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    ${signal.ticker}
                  </Badge>
                  {signal.details?.signal && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {signal.details.signal}
                    </Badge>
                  )}
                  {signal.details?.strength && (
                    <Badge className={getStrengthBadgeColor(signal.details.strength)}>
                      {signal.details.strength}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(signal.createdAt)}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{signal.title}</h3>
              <p className="text-muted-foreground">{signal.content}</p>
              {signal.details && (
                <div className="mt-2 text-sm">
                  {signal.details.timeframe && (
                    <div className="flex justify-between border-t pt-2">
                      <span>Timeframe: </span>
                      <span className="font-medium">{signal.details.timeframe}</span>
                    </div>
                  )}
                  {signal.details.indicator && (
                    <div className="flex justify-between">
                      <span>Indicator: </span>
                      <span className="font-medium">{signal.details.indicator}</span>
                    </div>
                  )}
                  {signal.details.current_price && (
                    <div className="flex justify-between">
                      <span>Current Price: </span>
                      <span className="font-medium">
                        ${Number(signal.details.current_price).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {signal.details.target_price && (
                    <div className="flex justify-between">
                      <span>Target Price: </span>
                      <span className="font-medium">
                        ${Number(signal.details.target_price).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {signal.details.stop_loss && (
                    <div className="flex justify-between">
                      <span>Stop Loss: </span>
                      <span className="font-medium">
                        ${Number(signal.details.stop_loss).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {signal.details.risk_reward && (
                    <div className="flex justify-between">
                      <span>Risk/Reward: </span>
                      <span className="font-medium">
                        {signal.details.risk_reward}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {signal.source && (
                <div className="text-xs text-muted-foreground mt-2">
                  Source: {signal.source}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
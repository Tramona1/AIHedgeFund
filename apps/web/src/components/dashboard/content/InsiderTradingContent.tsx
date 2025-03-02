"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { User, ArrowUp, ArrowDown } from "lucide-react"
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

export function InsiderTradingContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [insiderActivities, setInsiderActivities] = useState<StockUpdate[]>([])
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

  // Fetch insider trading activities
  const fetchInsiderActivities = async () => {
    if (!isLoaded || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get local user tickers
      const userTickers = userState.tickers.map(ticker => ticker.symbol);
      
      // Fetch stock updates
      const stockUpdatesData = await stockUpdatesAPI.getAll();
      let updates = stockUpdatesData.updates || [];
      
      // Filter only insider trading related updates
      updates = updates.filter(update => 
        update.eventType === 'insider_buy' || 
        update.eventType === 'insider_sell' ||
        update.eventType.includes('insider_')
      );
      
      // Filter based on user tickers from localStorage
      if (userTickers.length > 0) {
        updates = updates.filter(update => 
          userTickers.includes(update.ticker)
        );
      }
      
      // Sort by date, newest first
      updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setInsiderActivities(updates);
    } catch (error) {
      console.error("Error fetching insider activities:", error);
      setError("Failed to load insider trading activities. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchInsiderActivities();
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
        title="Error loading insider trading activities"
        description={error}
        icon={User}
        actionLabel="Try Again"
        onAction={fetchInsiderActivities}
      />
    );
  }

  if (!insiderActivities.length) {
    return (
      <EmptyState
        title="No insider trading activities"
        description={userState.tickers.length === 0 
          ? "Add tickers to your watchlist to see insider trading activities" 
          : "No recent insider trading activities for your watched tickers"}
        icon={User}
      />
    );
  }

  return (
    <div className="space-y-4">
      {insiderActivities.map((activity) => (
        <Card key={activity.id} className="border rounded-lg">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    ${activity.ticker}
                  </Badge>
                  <Badge 
                    variant={activity.eventType === 'insider_buy' ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {activity.eventType === 'insider_buy' ? (
                      <><ArrowUp className="h-3 w-3" /> Buy</>
                    ) : (
                      <><ArrowDown className="h-3 w-3" /> Sell</>
                    )}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{activity.title}</h3>
              <p className="text-muted-foreground">{activity.content}</p>
              {activity.details && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between border-t pt-2">
                    <span>Insider: </span>
                    <span className="font-medium">{activity.details.insider || 'Unknown'}</span>
                  </div>
                  {activity.details.role && (
                    <div className="flex justify-between">
                      <span>Role: </span>
                      <span className="font-medium">{activity.details.role}</span>
                    </div>
                  )}
                  {activity.details.shares && (
                    <div className="flex justify-between">
                      <span>Shares: </span>
                      <span className="font-medium">{Number(activity.details.shares).toLocaleString()}</span>
                    </div>
                  )}
                  {activity.details.value && (
                    <div className="flex justify-between">
                      <span>Value: </span>
                      <span className="font-medium">
                        ${Number(activity.details.value).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {activity.details.filing_date && (
                    <div className="flex justify-between">
                      <span>Filing Date: </span>
                      <span className="font-medium">
                        {new Date(activity.details.filing_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {activity.source && (
                <div className="text-xs text-muted-foreground mt-2">
                  Source: {activity.source}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
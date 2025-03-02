"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { BellRing, ArrowUp, ArrowDown, DollarSign, BarChart2, Eye, Briefcase } from "lucide-react"
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

export function AlertsContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<StockUpdate[]>([])
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

  // Get icon based on event type
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('hedge_fund')) {
      return <Briefcase className="h-4 w-4" />;
    } else if (eventType.includes('insider')) {
      return <Eye className="h-4 w-4" />;
    } else if (eventType.includes('option')) {
      return <DollarSign className="h-4 w-4" />;
    } else if (eventType.includes('technical')) {
      return <BarChart2 className="h-4 w-4" />;
    } else {
      return <BellRing className="h-4 w-4" />;
    }
  };

  // Format event type for display
  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Get badge color based on alert type
  const getAlertBadgeColor = (type: string) => {
    if (type.includes('buy') || type.includes('bullish')) {
      return 'bg-green-100 text-green-800';
    } else if (type.includes('sell') || type.includes('bearish')) {
      return 'bg-red-100 text-red-800';
    } else if (type.includes('hedge_fund')) {
      return 'bg-purple-100 text-purple-800';
    } else if (type.includes('insider')) {
      return 'bg-blue-100 text-blue-800';
    } else if (type.includes('option')) {
      return 'bg-amber-100 text-amber-800';
    } else if (type.includes('technical')) {
      return 'bg-sky-100 text-sky-800';
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

  // Fetch alerts
  const fetchAlerts = async () => {
    if (!isLoaded || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get local user tickers
      const userTickers = userState.tickers.map(ticker => ticker.symbol);
      
      // Fetch stock updates
      const stockUpdatesData = await stockUpdatesAPI.getAll();
      let updates = stockUpdatesData.updates || [];
      
      // Filter based on user tickers from localStorage
      if (userTickers.length > 0) {
        updates = updates.filter(update => 
          userTickers.includes(update.ticker)
        );
      }
      
      // Sort by date, newest first
      updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAlerts(updates);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setError("Failed to load alerts. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchAlerts();
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
        title="Error loading alerts"
        description={error}
        icon={BellRing}
        actionLabel="Try Again"
        onAction={fetchAlerts}
      />
    );
  }

  if (!alerts.length) {
    return (
      <EmptyState
        title="No alerts"
        description={userState.tickers.length === 0 
          ? "Add tickers to your watchlist to see alerts" 
          : "No recent alerts for your watched tickers"}
        icon={BellRing}
      />
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card key={alert.id} className="border rounded-lg">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    ${alert.ticker}
                  </Badge>
                  <Badge className={getAlertBadgeColor(alert.eventType)}>
                    {getEventIcon(alert.eventType)}
                    <span className="ml-1">{formatEventType(alert.eventType)}</span>
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(alert.createdAt)}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{alert.title}</h3>
              <p className="text-muted-foreground">{alert.content}</p>
              {alert.source && (
                <div className="text-xs text-muted-foreground">
                  Source: {alert.source}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
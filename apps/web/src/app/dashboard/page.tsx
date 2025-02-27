"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { 
  stockUpdatesAPI, 
  StockUpdate, 
  userPreferencesAPI, 
  UserPreferences, 
  aiTriggersAPI,
  economicReportsAPI,
  interviewsAPI
} from "@/lib/api";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EconomicReports } from "@/components/dashboard/EconomicReports";
import { Interviews } from "@/components/dashboard/Interviews";

interface Alert {
  id: string;
  ticker: string;
  eventType: string;
  message: string;
  date: string;
}

// Component to create test triggers
function TestTriggerCreator({ tickers }: { tickers?: string[] }) {
  const [selectedTicker, setSelectedTicker] = useState<string>("");
  const [eventType, setEventType] = useState<string>("hedge_fund_buy");
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Set initial ticker if available
  useEffect(() => {
    if (tickers && tickers.length > 0 && !selectedTicker) {
      setSelectedTicker(tickers[0]);
    }
  }, [tickers, selectedTicker]);

  // Event type options
  const eventTypes = [
    { value: "hedge_fund_buy", label: "Hedge Fund Buy" },
    { value: "hedge_fund_sell", label: "Hedge Fund Sell" },
    { value: "investor_mention", label: "Investor Mention" },
    { value: "dark_pool_buy", label: "Dark Pool Activity" },
    { value: "option_flow", label: "Options Flow" },
  ];

  const handleCreateTrigger = async () => {
    if (!selectedTicker) return;
    
    try {
      setIsCreating(true);
      setResult(null);
      
      // Call the API to create a test trigger
      const response = await aiTriggersAPI.createTestTrigger({
        ticker: selectedTicker,
        eventType: eventType,
      });
      
      setResult({ 
        success: true, 
        message: `Created test alert for ${selectedTicker}. Check your email or refresh the dashboard.`
      });
    } catch (error) {
      console.error("Error creating test trigger:", error);
      setResult({ 
        success: false, 
        message: "Failed to create test alert. Please try again."
      });
    } finally {
      setIsCreating(false);
    }
  };

  // If no tickers available, show a message
  if (!tickers || tickers.length === 0) {
    return (
      <Card className="shadow-md mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Create Test Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">You need to add tickers to your watchlist before creating test alerts.</p>
          <Button asChild>
            <Link href="/preferences">Add Tickers</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md mb-6">
      <CardHeader className="pb-2">
        <CardTitle>Create Test Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ticker</label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
              disabled={isCreating}
            >
              {tickers.map((ticker) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
              disabled={isCreating}
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={handleCreateTrigger} 
            disabled={isCreating || !selectedTicker}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create Test Alert"}
          </Button>
          
          {result && (
            <div className={`p-3 rounded-md ${
              result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {result.message}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            This will create a simulated stock event for your selected ticker and send a notification
            based on your preferences. Use this to test how the system works.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isLoaded, user } = useUser();
  
  // Format the event type for display
  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Get the badge color based on event type
  const getEventBadgeColor = (type: string) => {
    switch(type) {
      case 'hedge_fund_buy':
        return 'bg-green-100 text-green-800';
      case 'hedge_fund_sell':
        return 'bg-red-100 text-red-800';
      case 'investor_mention':
        return 'bg-blue-100 text-blue-800';
      case 'option_flow':
        return 'bg-purple-100 text-purple-800';
      case 'dark_pool_buy':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to refresh data
  const refreshData = async () => {
    try {
      if (!isLoaded || !user) {
        return; // Wait until user is loaded
      }
      
      setIsLoading(true);
      
      // First fetch user preferences to get their tickers
      const userPrefsData = await userPreferencesAPI.get(user.id);
      const prefs = userPrefsData.userPreferences;
      setUserPreferences(prefs);
      
      // Fetch stock updates from API
      const stockUpdatesData = await stockUpdatesAPI.getAll();
      let updates = stockUpdatesData.updates || [];
      
      // Filter updates based on user preferences
      if (prefs && prefs.tickers && prefs.tickers.length > 0) {
        // Only show updates for tickers in user preferences
        updates = updates.filter(update => 
          prefs.tickers?.includes(update.ticker)
        );
      }
      
      setStockUpdates(updates);
      
      // Generate alerts based on the most recent updates
      if (updates.length > 0) {
        const sortedUpdates = [...updates].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const recentUpdateAlerts = sortedUpdates.slice(0, 3).map(update => ({
          id: update.id,
          ticker: update.ticker,
          eventType: update.eventType,
          message: update.title,
          date: update.createdAt
        }));
        
        setRecentAlerts(recentUpdateAlerts);
      } else {
        // If no real updates available, use sample data
        setRecentAlerts([
          {
            id: "al_1",
            ticker: "AAPL",
            eventType: "dark_pool_buy",
            message: "Significant dark pool buying detected in AAPL",
            date: new Date().toISOString()
          },
          {
            id: "al_2",
            ticker: "MSFT",
            eventType: "option_flow",
            message: "Unusual options activity in MSFT $400 calls",
            date: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [isLoaded, user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6 flex justify-end">
        <Button onClick={refreshData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border-b pb-4">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-3/4 mt-2" />
                      <Skeleton className="h-20 w-full mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between p-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Stock Updates */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Recent Stock Updates</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/updates">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {stockUpdates.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                    {userPreferences?.tickers?.length ? (
                      <p className="text-gray-500">We'll notify you when there are updates for your tickers.</p>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-4">You haven't added any stock tickers to your watchlist.</p>
                        <Button asChild>
                          <Link href="/preferences">Add Tickers</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {stockUpdates.map((update) => (
                      <div key={update.id} className="border-b pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <span className="font-bold text-lg mr-2">{update.ticker}</span>
                            <Badge variant={
                              update.eventType === 'hedge_fund_buy' ? 'success' :
                              update.eventType === 'hedge_fund_sell' ? 'destructive' :
                              'secondary'
                            }>
                              {formatEventType(update.eventType)}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{update.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{update.content}</p>
                        {update.source && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <span>Source: {update.source}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Test Trigger Creator */}
            <TestTriggerCreator tickers={userPreferences?.tickers} />
            
            {/* Economic Reports */}
            <div className="mb-6">
              <EconomicReports limit={3} />
            </div>
            
            {/* Interviews */}
            <div className="mb-6">
              <Interviews limit={2} />
            </div>
            
            {/* Alerts */}
            <Card className="shadow-md mb-6">
              <CardHeader className="pb-2">
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAlerts.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No alerts available</p>
                ) : (
                  <div className="space-y-4">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{alert.ticker}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/alerts">View All Alerts</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Watchlist */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle>Your Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                {!userPreferences?.tickers?.length ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-3">No tickers in your watchlist</p>
                    <Button size="sm" asChild>
                      <Link href="/preferences">Add Tickers</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userPreferences.tickers.map((ticker) => (
                      <div key={ticker} className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <span className="font-medium">{ticker}</span>
                        <Link href={`/updates/ticker/${ticker}`} className="text-blue-600 hover:underline text-sm">
                          View Updates
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/preferences">Edit Watchlist</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 
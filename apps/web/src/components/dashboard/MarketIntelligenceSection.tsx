"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Bot, Briefcase, DollarSign, Eye, LineChart, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { stockUpdatesAPI, StockUpdate } from "@/lib/api"
import { useUser } from "@clerk/nextjs"

// Define interfaces for our data types
interface HedgeFundActivity {
  id: string;
  ticker: string;
  eventType: string;
  title: string;
  content: string;
  createdAt: string;
}

interface InsiderTrading {
  id: string;
  ticker: string;
  eventType: string;
  title: string;
  content: string;
  createdAt: string;
}

interface OptionsFlow {
  id: string;
  ticker: string;
  eventType: string;
  title: string;
  content: string;
  createdAt: string;
  details?: Record<string, any>;
}

interface TechnicalSignal {
  id: string;
  ticker: string;
  eventType: string;
  title: string;
  content: string;
  createdAt: string;
  details?: Record<string, any>;
}

interface MarketData {
  hedgeFundActivity: HedgeFundActivity[];
  insiderTrading: InsiderTrading[];
  optionsFlow: OptionsFlow[];
  technicalSignals: TechnicalSignal[];
}

interface MarketIntelligenceSectionProps {
  openAiChatAction: (context: string) => void
}

export function MarketIntelligenceSection({ openAiChatAction }: MarketIntelligenceSectionProps) {
  const [activeTab, setActiveTab] = useState("hedge-fund")
  const [feedMode, setFeedMode] = useState<"general" | "user-tickers">("general")
  const [userTickers, setUserTickers] = useState<string[]>([])
  const [marketData, setMarketData] = useState<MarketData>({
    hedgeFundActivity: [],
    insiderTrading: [],
    optionsFlow: [],
    technicalSignals: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoaded } = useUser()

  // Load user tickers from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('userState')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        if (parsedState.tickers && Array.isArray(parsedState.tickers)) {
          setUserTickers(parsedState.tickers.map((t: any) => t.symbol))
        }
      } catch (e) {
        console.error('Error parsing localStorage:', e)
      }
    }
  }, [])

  // Fetch market data from API
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!isLoaded) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch stock updates from API
        const stockUpdatesData = await stockUpdatesAPI.getAll()
        
        // Check if we got a structured error response (type assertion needed since our API types don't include error fields)
        const response = stockUpdatesData as any
        if (response.error) {
          console.error('API error:', response.error, response.message)
          setError(response.message || 'Failed to load market intelligence. Please try again later.')
          return
        }
        
        const updates = stockUpdatesData.updates || []
        
        // Categorize updates by event type
        const hedgeFundUpdates = updates.filter(update => 
          update.eventType === 'hedge_fund_buy' || 
          update.eventType === 'hedge_fund_sell'
        )
        
        const insiderUpdates = updates.filter(update => 
          update.eventType === 'insider_buy' || 
          update.eventType === 'insider_sell' ||
          update.eventType.includes('insider_')
        )
        
        const optionsUpdates = updates.filter(update => 
          update.eventType === 'option_flow' ||
          update.eventType.includes('option_')
        )
        
        const technicalUpdates = updates.filter(update => 
          update.eventType === 'technical_signal' || 
          update.eventType.includes('technical_')
        )
        
        // Update state with categorized data
        setMarketData({
          hedgeFundActivity: hedgeFundUpdates,
          insiderTrading: insiderUpdates,
          optionsFlow: optionsUpdates,
          technicalSignals: technicalUpdates
        })
      } catch (error) {
        console.error('Error fetching market data:', error)
        setError('Failed to load market intelligence. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMarketData()
  }, [isLoaded])

  // Filter data based on the selected feed mode
  const getFilteredData = <T extends { ticker: string }>(dataArray: T[]): T[] => {
    if (feedMode === "general") {
      return dataArray
    }
    
    // If in user-tickers mode and no tickers are selected, return empty array
    if (feedMode === "user-tickers" && userTickers.length === 0) {
      return []
    }
    
    // Filter to only include user's tickers
    return dataArray.filter(item => userTickers.includes(item.ticker))
  }

  // Get appropriate empty state message based on feed mode
  const getEmptyStateMessage = () => {
    if (feedMode === "user-tickers" && userTickers.length === 0) {
      return "Add tickers to your watchlist to see personalized updates"
    }
    
    if (isLoading) {
      return "Loading market intelligence..."
    }
    
    if (error) {
      return error
    }
    
    return "No market intelligence available at this time"
  }

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHrs = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHrs / 24)
      
      if (diffMins < 60) {
        return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
      } else if (diffHrs < 24) {
        return diffHrs === 1 ? '1 hour ago' : `${diffHrs} hours ago`
      } else if (diffDays < 7) {
        return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`
      } else {
        return date.toLocaleDateString()
      }
    } catch (e) {
      return timestamp
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Market Intelligence</CardTitle>
          <div className="flex items-center gap-2">
            {userTickers.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant={feedMode === "general" ? "outline" : "default"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setFeedMode("user-tickers")}
                >
                  My Tickers
                </Button>
                <Button
                  variant={feedMode === "general" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setFeedMode("general")}
                >
                  All Updates
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="hedge-fund" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-4 gap-4">
            <TabsTrigger value="hedge-fund" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Hedge Funds</span>
            </TabsTrigger>
            <TabsTrigger value="insider" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Insider</span>
            </TabsTrigger>
            <TabsTrigger value="options" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Options</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Technical</span>
            </TabsTrigger>
          </TabsList>

          {/* Hedge Fund Activity */}
          <TabsContent value="hedge-fund" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading hedge fund activity...</p>
              </div>
            ) : getFilteredData(marketData.hedgeFundActivity).length > 0 ? (
              getFilteredData(marketData.hedgeFundActivity).map((activity) => (
                <motion.div 
                  key={activity.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Hedge Fund Activity</Badge>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              ${activity.ticker}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{activity.title}</h3>
                          <p className="text-sm text-muted-foreground">{activity.content}</p>
                          <div className="text-xs text-muted-foreground">{formatTimestamp(activity.createdAt)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAiChatAction(
                                `This hedge fund activity is relevant because it shows significant institutional movement that could impact the stock price of ${activity.ticker}. ${activity.content}`
                              )
                            }}
                          >
                            <Bot className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState message={getEmptyStateMessage()} />
            )}
          </TabsContent>

          {/* Insider Trading */}
          <TabsContent value="insider" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading insider trading data...</p>
              </div>
            ) : getFilteredData(marketData.insiderTrading).length > 0 ? (
              getFilteredData(marketData.insiderTrading).map((trade) => (
                <motion.div 
                  key={trade.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Insider Trading</Badge>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              ${trade.ticker}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{trade.title}</h3>
                          <p className="text-sm text-muted-foreground">{trade.content}</p>
                          <div className="text-xs text-muted-foreground">{formatTimestamp(trade.createdAt)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAiChatAction(
                                `Insider trading activity is significant for ${trade.ticker}. ${trade.content}`
                              )
                            }}
                          >
                            <Bot className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState message={getEmptyStateMessage()} />
            )}
          </TabsContent>

          {/* Options Flow */}
          <TabsContent value="options" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading options flow data...</p>
              </div>
            ) : getFilteredData(marketData.optionsFlow).length > 0 ? (
              getFilteredData(marketData.optionsFlow).map((flow) => (
                <motion.div 
                  key={flow.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Options Flow</Badge>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              ${flow.ticker}
                            </Badge>
                            <Badge>{flow.details?.type || 'FLOW'}</Badge>
                          </div>
                          <h3 className="font-semibold">{flow.title}</h3>
                          <p className="text-sm text-muted-foreground">{flow.content}</p>
                          <div className="text-xs text-muted-foreground">
                            {flow.details?.premium && `Premium: ${flow.details.premium} • `}
                            {formatTimestamp(flow.createdAt)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAiChatAction(
                                `This options activity for ${flow.ticker} is notable. ${flow.content}`
                              )
                            }}
                          >
                            <Bot className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState message={getEmptyStateMessage()} />
            )}
          </TabsContent>

          {/* Technical Signals */}
          <TabsContent value="technical" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading technical signals...</p>
              </div>
            ) : getFilteredData(marketData.technicalSignals).length > 0 ? (
              getFilteredData(marketData.technicalSignals).map((signal) => (
                <motion.div 
                  key={signal.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Technical Signal</Badge>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              ${signal.ticker}
                            </Badge>
                            <Badge 
                              className={`${
                                signal.details?.strength === 'Strong Buy' || signal.details?.strength === 'Buy'
                                  ? 'bg-green-500'
                                  : signal.details?.strength === 'Strong Sell' || signal.details?.strength === 'Sell'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                              }`}
                            >
                              {signal.details?.strength || 'SIGNAL'}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{signal.title}</h3>
                          <p className="text-sm text-muted-foreground">{signal.content}</p>
                          <div className="text-xs text-muted-foreground">{formatTimestamp(signal.createdAt)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAiChatAction(
                                `This technical signal for ${signal.ticker} is important to consider. ${signal.content}`
                              )
                            }}
                          >
                            <Bot className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <EmptyState message={getEmptyStateMessage()} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
} 
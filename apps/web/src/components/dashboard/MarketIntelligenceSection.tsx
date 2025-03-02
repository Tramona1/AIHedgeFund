"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Bot, Briefcase, DollarSign, Eye, LineChart, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define interfaces for our data types
interface HedgeFundActivity {
  id: number;
  fund: string;
  action: string;
  ticker: string;
  details: string;
  timestamp: string;
}

interface InsiderTrading {
  id: number;
  insider: string;
  role: string;
  ticker: string;
  action: string;
  details: string;
  timestamp: string;
}

interface OptionsFlow {
  id: number;
  ticker: string;
  type: string;
  details: string;
  premium: string;
  timestamp: string;
}

interface TechnicalSignal {
  id: number;
  ticker: string;
  signal: string;
  details: string;
  strength: string;
  timestamp: string;
}

interface MarketData {
  hedgeFundActivity: HedgeFundActivity[];
  insiderTrading: InsiderTrading[];
  optionsFlow: OptionsFlow[];
  technicalSignals: TechnicalSignal[];
}

// Sample market intelligence data (this would come from an API in a real application)
const sampleData: MarketData = {
  hedgeFundActivity: [
    {
      id: 1,
      fund: "Renaissance Technologies",
      action: "Increases Position",
      ticker: "NVDA",
      details: "Added 1.2M shares worth approximately $580M",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      fund: "Citadel",
      action: "New Position",
      ticker: "AAPL",
      details: "Purchased 2.5M shares worth $450M",
      timestamp: "4 hours ago",
    },
    {
      id: 3,
      fund: "BlackRock",
      action: "Decreases Position",
      ticker: "MSFT",
      details: "Reduced position by 800K shares worth $290M",
      timestamp: "6 hours ago",
    },
    {
      id: 4,
      fund: "D.E. Shaw",
      action: "Closes Position",
      ticker: "TSLA",
      details: "Exited entire position worth $720M",
      timestamp: "1 day ago",
    },
  ],
  insiderTrading: [
    {
      id: 1,
      insider: "Tim Cook",
      role: "CEO",
      ticker: "AAPL",
      action: "Sold",
      details: "100,000 shares worth $18M following vesting schedule",
      timestamp: "4 hours ago",
    },
    {
      id: 2,
      insider: "Lisa Su",
      role: "CEO",
      ticker: "AMD",
      action: "Purchased",
      details: "25,000 shares worth $2.8M",
      timestamp: "1 day ago",
    },
    {
      id: 3,
      insider: "Satya Nadella",
      role: "CEO",
      ticker: "MSFT",
      action: "Sold",
      details: "50,000 shares worth $17.5M",
      timestamp: "2 days ago",
    },
  ],
  optionsFlow: [
    {
      id: 1,
      ticker: "TSLA",
      type: "PUT",
      details: "$5M in June 2024 puts purchased at $200 strike",
      premium: "$2.1M",
      timestamp: "1 hour ago",
    },
    {
      id: 2,
      ticker: "NVDA",
      type: "CALL",
      details: "$3.2M in July 2024 calls purchased at $500 strike",
      premium: "$1.8M",
      timestamp: "3 hours ago",
    },
    {
      id: 3,
      ticker: "AMZN",
      type: "CALL",
      details: "$4.5M in August 2024 calls purchased at $180 strike",
      premium: "$3.2M",
      timestamp: "5 hours ago",
    },
  ],
  technicalSignals: [
    {
      id: 1,
      ticker: "AAPL",
      signal: "Golden Cross",
      details: "50-day MA crosses above 200-day MA",
      strength: "Strong Buy",
      timestamp: "Today",
    },
    {
      id: 2,
      ticker: "MSFT",
      signal: "RSI Oversold",
      details: "RSI drops below 30 on 4H timeframe",
      strength: "Buy",
      timestamp: "Today",
    },
    {
      id: 3,
      ticker: "AMZN",
      signal: "MACD Bullish",
      details: "MACD line crosses above signal line",
      strength: "Buy",
      timestamp: "Yesterday",
    },
  ],
}

interface MarketIntelligenceSectionProps {
  openAiChatAction: (context: string) => void
}

export function MarketIntelligenceSection({ openAiChatAction }: MarketIntelligenceSectionProps) {
  const [activeTab, setActiveTab] = useState("hedge-fund")
  const [feedMode, setFeedMode] = useState<"general" | "user-tickers">("general")
  const [userTickers, setUserTickers] = useState<string[]>([])

  // Load user tickers from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('user_tickers')
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      if (parsedState.tickers && Array.isArray(parsedState.tickers)) {
        setUserTickers(parsedState.tickers.map((t: any) => t.symbol))
      }
    }
  }, [])

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
    if (feedMode === "general") {
      return "No market intelligence data available at the moment"
    } else {
      return userTickers.length === 0 
        ? "No tickers selected. Add tickers to your watchlist to see relevant intelligence." 
        : "No market intelligence available for your selected tickers"
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle>Market Intelligence</CardTitle>
          <div className="flex space-x-4">
            <Button 
              variant={feedMode === "general" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFeedMode("general")}
            >
              General Market
            </Button>
            <Button 
              variant={feedMode === "user-tickers" ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedMode("user-tickers")}
            >
              Your Tickers
            </Button>
          </div>
        </div>
        {feedMode === "user-tickers" && userTickers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-muted-foreground mr-1">Filtering for:</span>
            {userTickers.map(ticker => (
              <Badge key={ticker} variant="outline" className="bg-primary/10 text-primary text-xs">
                ${ticker}
              </Badge>
            ))}
          </div>
        )}
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
            {getFilteredData(sampleData.hedgeFundActivity).length > 0 ? (
              getFilteredData(sampleData.hedgeFundActivity).map((activity) => (
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
                          <h3 className="font-semibold">
                            {activity.fund} {activity.action}
                          </h3>
                          <p className="text-sm text-muted-foreground">{activity.details}</p>
                          <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
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
                                `This hedge fund activity is relevant because it shows significant institutional movement that could impact the stock price. When large funds make moves of this size (${activity.details}), it often signals a strong conviction about the company's future prospects.`,
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
            {getFilteredData(sampleData.insiderTrading).length > 0 ? (
              getFilteredData(sampleData.insiderTrading).map((trade) => (
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
                          <h3 className="font-semibold">
                            {trade.insider} ({trade.role}) {trade.action}
                          </h3>
                          <p className="text-sm text-muted-foreground">{trade.details}</p>
                          <div className="text-xs text-muted-foreground">{trade.timestamp}</div>
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
                                `Insider trading activity is significant because ${trade.insider}, as ${trade.role}, has direct knowledge of the company's operations. Their decision to ${trade.action.toLowerCase()} shares could indicate their perspective on the company's future performance.`,
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
            {getFilteredData(sampleData.optionsFlow).length > 0 ? (
              getFilteredData(sampleData.optionsFlow).map((flow) => (
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
                            <Badge>{flow.type}</Badge>
                          </div>
                          <h3 className="font-semibold">Large Options Activity</h3>
                          <p className="text-sm text-muted-foreground">{flow.details}</p>
                          <div className="text-xs text-muted-foreground">
                            Premium: {flow.premium} • {flow.timestamp}
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
                                `This options activity is notable because the size of the premium (${flow.premium}) suggests strong directional conviction from institutional traders. The ${flow.type.toLowerCase()} position could indicate expectations of ${
                                  flow.type === "CALL" ? "upward" : "downward"
                                } price movement.`,
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
            {getFilteredData(sampleData.technicalSignals).length > 0 ? (
              getFilteredData(sampleData.technicalSignals).map((signal) => (
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
                            <Badge>{signal.strength}</Badge>
                          </div>
                          <h3 className="font-semibold">{signal.signal}</h3>
                          <p className="text-sm text-muted-foreground">{signal.details}</p>
                          <div className="text-xs text-muted-foreground">{signal.timestamp}</div>
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
                                `This technical signal (${signal.signal}) is important because it suggests a potential ${
                                  signal.strength === "Buy" || signal.strength === "Strong Buy"
                                    ? "bullish"
                                    : "bearish"
                                } price movement based on historical price patterns and momentum indicators.`,
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

// Empty state component for when no data is available
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No Data Available</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        {message}
      </p>
    </div>
  )
} 
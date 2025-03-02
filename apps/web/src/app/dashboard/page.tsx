"use client";

import { motion } from "framer-motion"
import { ArrowDown, ArrowUp, Bell, LineChart, DollarSign, Briefcase, Eye, Bot, Plus } from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/progress"
import { AddTickerDialog } from "@/components/dashboard/AddTickerDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Stock ticker data types
export interface Ticker {
  symbol: string;
  price?: number;
  change?: number;
  volume?: string;
}

export interface UserState {
  tickers: Ticker[];
}

// Sample market intelligence data (this would come from an API in a real application)
const hedgeFundActivity = [
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
]

const insiderTrading = [
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
]

const optionsFlow = [
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
]

const technicalSignals = [
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
]

export default function DashboardPage() {
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [currentContext, setCurrentContext] = useState<string>("")
  const [addTickerOpen, setAddTickerOpen] = useState(false)
  
  // User state for tickers
  const [userState, setUserState] = useState<UserState>({
    tickers: []
  })

  // Mock ticker prices (in a real app this would be fetched from an API)
  const getRandomPrice = () => Math.floor(Math.random() * 1000) / 10 + 50
  const getRandomChange = () => Math.floor(Math.random() * 60) / 10 - 3

  // Load user tickers from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('user_tickers')
    if (savedState) {
      setUserState(JSON.parse(savedState))
    }
  }, [])

  // Save user tickers when they change
  useEffect(() => {
    localStorage.setItem('user_tickers', JSON.stringify(userState))
  }, [userState])

  // Add a new ticker
  const addTicker = (symbol: string) => {
    if (!userState.tickers.some(ticker => ticker.symbol === symbol)) {
      const newTicker: Ticker = {
        symbol,
        price: getRandomPrice(),
        change: getRandomChange(),
        volume: `${Math.floor(Math.random() * 20) + 1}.${Math.floor(Math.random() * 9)}M`
      }
      
      setUserState(prev => ({
        ...prev,
        tickers: [...prev.tickers, newTicker]
      }))
    }
  }

  // Remove a ticker
  const removeTicker = (symbol: string) => {
    setUserState(prev => ({
      ...prev,
      tickers: prev.tickers.filter(ticker => ticker.symbol !== symbol)
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Market Indicators */}
      <div className="border-b bg-card">
        <Container>
          <div className="grid gap-4 py-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Buffett Indicator</span>
                <span className="text-sm text-muted-foreground">150%</span>
              </div>
              <Progress value={75} className="h-2" />
              <span className="text-xs text-muted-foreground">Market Overvalued</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fear & Greed Index</span>
                <span className="text-sm text-muted-foreground">75</span>
              </div>
              <Progress value={75} className="h-2" />
              <span className="text-xs text-muted-foreground">Extreme Greed</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">S&P 500 RSI</span>
                <span className="text-sm text-muted-foreground">65</span>
              </div>
              <Progress value={65} className="h-2" />
              <span className="text-xs text-muted-foreground">Slightly Overbought</span>
            </div>
          </div>
        </Container>
      </div>

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

        <div className="grid gap-6">
          {/* User Watchlist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <span>Your Watchlist</span>
                {userState.tickers.length === 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setAddTickerOpen(true)}
                    className="text-sm text-muted-foreground"
                  >
                    Add your first ticker
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userState.tickers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {userState.tickers.map((stock) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center p-4 rounded-lg bg-card border relative group"
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                        onClick={() => removeTicker(stock.symbol)}
                      >
                        <ArrowDown className="h-3 w-3 rotate-45" />
                      </Button>
                      <div className="text-lg font-semibold">{stock.symbol}</div>
                      <div className="flex items-center gap-1">
                        {stock.change && stock.change >= 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`${stock.change && stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {stock.change ? Math.abs(stock.change) : 0}%
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">${stock.price || 0}</div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tickers in your watchlist</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">
                    Add stock tickers to your watchlist to track their performance and get the latest updates
                  </p>
                  <Button onClick={() => setAddTickerOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ticker
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle>Market Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hedge-fund" className="space-y-4">
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

                <TabsContent value="hedge-fund" className="space-y-4">
                  {hedgeFundActivity.map((activity) => (
                    <motion.div key={activity.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                                  setCurrentContext(
                                    `This hedge fund activity is relevant because it shows significant institutional movement that could impact the stock price. When large funds make moves of this size (${activity.details}), it often signals a strong conviction about the company's future prospects.`,
                                  )
                                  setAiChatOpen(true)
                                }}
                              >
                                <Bot className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="insider" className="space-y-4">
                  {insiderTrading.map((trade) => (
                    <motion.div key={trade.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                                  setCurrentContext(
                                    `Insider trading activity is significant because ${trade.insider}, as ${trade.role}, has direct knowledge of the company's operations. Their decision to ${trade.action.toLowerCase()} shares could indicate their perspective on the company's future performance.`,
                                  )
                                  setAiChatOpen(true)
                                }}
                              >
                                <Bot className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="options" className="space-y-4">
                  {optionsFlow.map((flow) => (
                    <motion.div key={flow.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                                  setCurrentContext(
                                    `This options activity is notable because the size of the premium (${flow.premium}) suggests strong directional conviction from institutional traders. The ${flow.type.toLowerCase()} position could indicate expectations of ${
                                      flow.type === "CALL" ? "upward" : "downward"
                                    } price movement.`,
                                  )
                                  setAiChatOpen(true)
                                }}
                              >
                                <Bot className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  {technicalSignals.map((signal) => (
                    <motion.div key={signal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                                  setCurrentContext(
                                    `This technical signal (${signal.signal}) is important because it suggests a potential ${
                                      signal.strength === "Buy" || signal.strength === "Strong Buy"
                                        ? "bullish"
                                        : "bearish"
                                    } price movement based on historical price patterns and momentum indicators.`,
                                  )
                                  setAiChatOpen(true)
                                }}
                              >
                                <Bot className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </Container>
      
      {/* AI Chat Dialog */}
      <Dialog open={aiChatOpen} onOpenChange={setAiChatOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Bot className="h-4 w-4 mt-1 shrink-0" />
                  <p className="text-sm">{currentContext}</p>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Input placeholder="Ask a follow-up question..." />
              <Button size="sm">Send</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Ticker Dialog */}
      <AddTickerDialog 
        open={addTickerOpen} 
        onOpenChange={setAddTickerOpen}
        onAddTicker={addTicker}
      />
    </div>
  )
} 
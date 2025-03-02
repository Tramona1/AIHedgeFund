"use client";

import { motion } from "framer-motion"
import { LineChart, Plus, ArrowUp, ArrowDown, X } from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { AddTickerDialog } from "../../components/dashboard/AddTickerDialog"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MarketIndicatorsSection } from "@/components/dashboard/MarketIndicatorsSection"
import { MarketIntelligenceSection } from "@/components/dashboard/MarketIntelligenceSection"

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

  // Open AI Chat with context
  const openAiChat = (context: string) => {
    setCurrentContext(context)
    setAiChatOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Market Indicators (Enhanced with charts) */}
      <MarketIndicatorsSection />

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

          {/* Market Intelligence (Enhanced with dual feed) */}
          <MarketIntelligenceSection openAiChatAction={openAiChat} />
        </div>
      </Container>
      
      {/* AI Chat Dialog */}
      <Dialog open={aiChatOpen} onOpenChange={setAiChatOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "loop", ease: "linear" }}
              >
                ✨
              </motion.div>
              AI Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            <p className="mb-2 text-sm text-muted-foreground">Context:</p>
            <p className="text-sm">{currentContext}</p>
          </div>

          <div className="mt-4 p-4 border rounded-md">
            <p className="text-sm opacity-70 mb-4">
              Your AI assistant would analyze the market intelligence based on the provided context and provide
              insights. In the complete application, this would connect to an AI service.
            </p>
            <Button className="w-full" onClick={() => setAiChatOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Ticker Dialog */}
      <AddTickerDialog
        open={addTickerOpen}
        onOpenChangeAction={setAddTickerOpen}
        onAddTickerAction={addTicker}
      />
    </div>
  )
} 
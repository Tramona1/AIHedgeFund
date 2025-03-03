"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Loader2, X, Plus, BarChart, DollarSign, TrendingUp, ChevronUp, ChevronDown, RefreshCw, BellRing } from 'lucide-react'
import Link from 'next/link'

interface WatchlistItem {
  id: number
  userId: string
  symbol: string
  addedAt: string
  notes?: string
  isActive: boolean
}

export default function WatchlistPage() {
  const { user, isLoading } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [stockData, setStockData] = useState<Record<string, any>>({})
  const [newSymbol, setNewSymbol] = useState('')
  const [loadingSymbol, setLoadingSymbol] = useState('')
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch watchlist on component mount
  useEffect(() => {
    if (user?.id) {
      fetchWatchlist(user.id)
    }
  }, [user])

  // Fetch stock data for watchlist items
  useEffect(() => {
    if (watchlist.length > 0) {
      fetchStockData()
    }
  }, [watchlist])

  const fetchWatchlist = async (userId: string) => {
    setIsLoadingWatchlist(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/market-data/watchlist/user/${userId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch watchlist: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setWatchlist(data.watchlist)
      } else {
        setError(data.message || 'Failed to fetch watchlist')
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err)
      setError('Failed to load your watchlist. Please try again later.')
    } finally {
      setIsLoadingWatchlist(false)
    }
  }

  const fetchStockData = async () => {
    const symbols = watchlist.map(item => item.symbol)
    
    // Fetch data for each symbol in the watchlist
    for (const symbol of symbols) {
      if (!stockData[symbol]) {
        try {
          const response = await fetch(`/api/market-data/quotes/${symbol}`)
          
          if (response.ok) {
            const data = await response.json()
            
            if (data.success) {
              setStockData(prevData => ({
                ...prevData,
                [symbol]: data.data
              }))
            }
          }
        } catch (err) {
          console.error(`Error fetching data for ${symbol}:`, err)
        }
      }
    }
  }

  const addSymbol = async () => {
    if (!newSymbol || !user?.id) return
    
    setLoadingSymbol(newSymbol)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch('/api/market-data/watchlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          symbol: newSymbol.toUpperCase()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccessMessage(`Added ${newSymbol.toUpperCase()} to your watchlist`)
        setWatchlist(prev => [...prev, data.watchlistItem])
        setNewSymbol('')
        
        // Fetch the stock data for the new symbol
        try {
          const quoteResponse = await fetch(`/api/market-data/quotes/${newSymbol.toUpperCase()}`)
          
          if (quoteResponse.ok) {
            const quoteData = await quoteResponse.json()
            
            if (quoteData.success) {
              setStockData(prevData => ({
                ...prevData,
                [newSymbol.toUpperCase()]: quoteData.data
              }))
            }
          }
        } catch (err) {
          console.error(`Error fetching data for ${newSymbol}:`, err)
        }
      } else {
        setError(data.message || 'Failed to add symbol to watchlist')
      }
    } catch (err) {
      console.error('Error adding symbol:', err)
      setError('Failed to add symbol to your watchlist. Please try again.')
    } finally {
      setLoadingSymbol('')
    }
  }

  const removeSymbol = async (symbol: string) => {
    if (!user?.id) return
    
    setLoadingSymbol(symbol)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch(`/api/market-data/watchlist/user/${user.id}/symbol/${symbol}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccessMessage(`Removed ${symbol} from your watchlist`)
        setWatchlist(prev => prev.filter(item => item.symbol !== symbol))
        
        // Remove stock data for this symbol
        setStockData(prevData => {
          const newData = { ...prevData }
          delete newData[symbol]
          return newData
        })
      } else {
        setError(data.message || 'Failed to remove symbol from watchlist')
      }
    } catch (err) {
      console.error('Error removing symbol:', err)
      setError('Failed to remove symbol from your watchlist. Please try again.')
    } finally {
      setLoadingSymbol('')
    }
  }

  const refreshStockData = async () => {
    setStockData({})
    await fetchStockData()
  }

  // Format price change display
  const formatPriceChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span className="mr-1">{Math.abs(change).toFixed(2)}</span>
        <span>({Math.abs(changePercent).toFixed(2)}%)</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center bg-blue-50 rounded-lg p-8 border border-blue-100">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="mb-6">Please sign in to view and manage your watchlist.</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <div className="flex gap-2">
          <Link href="/watchlist/alerts">
            <Button variant="outline" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Alerts
            </Button>
          </Link>
          <Button 
            onClick={() => document.getElementById('watchlist-new-symbol-input')?.focus()} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Symbol
          </Button>
        </div>
      </div>
      
      {/* Add new symbol */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-8">
        <h2 className="text-xl font-semibold mb-3">Add Symbol</h2>
        <div className="flex gap-2">
          <Input
            id="watchlist-new-symbol-input"
            type="text"
            placeholder="Enter stock symbol (e.g. AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            maxLength={10}
            className="max-w-xs"
          />
          <Button 
            onClick={addSymbol} 
            disabled={!newSymbol || loadingSymbol === newSymbol}
          >
            {loadingSymbol === newSymbol ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Adding...
              </>
            ) : 'Add to Watchlist'}
          </Button>
        </div>
        
        {error && (
          <div className="mt-3 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mt-3 text-green-600 text-sm">
            {successMessage}
          </div>
        )}
      </div>
      
      {/* Watchlist */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Your Stocks</h2>
          <Button variant="outline" size="sm" onClick={refreshStockData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
        
        {isLoadingWatchlist ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin mr-2" size={24} />
            <span>Loading your watchlist...</span>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">Your watchlist is empty. Add some stocks to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Symbol</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Change</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Volume</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => {
                  const stockInfo = stockData[item.symbol]
                  
                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{item.symbol}</div>
                        <div className="text-sm text-gray-500">
                          {item.notes || 'No notes'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {stockInfo ? (
                          <div className="font-mono font-medium">
                            ${parseFloat(stockInfo["05. price"]).toFixed(2)}
                          </div>
                        ) : (
                          <div className="text-gray-400">Loading...</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {stockInfo ? (
                          formatPriceChange(
                            parseFloat(stockInfo["09. change"]), 
                            parseFloat(stockInfo["10. change percent"].replace('%', ''))
                          )
                        ) : (
                          <div className="text-gray-400">Loading...</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {stockInfo ? (
                          <div className="font-mono">
                            {parseInt(stockInfo["06. volume"]).toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-gray-400">Loading...</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSymbol(item.symbol)}
                          disabled={loadingSymbol === item.symbol}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {loadingSymbol === item.symbol ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <X size={16} />
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Market data dashboard preview */}
      {watchlist.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Market Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg border shadow-sm">
              <div className="flex items-center mb-4">
                <BarChart className="text-blue-500 mr-2" size={20} />
                <h3 className="font-semibold">Market Summary</h3>
              </div>
              <p className="text-gray-600 text-sm">
                View comprehensive market data and trends for your watchlist stocks.
              </p>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>
            
            <div className="bg-white p-5 rounded-lg border shadow-sm">
              <div className="flex items-center mb-4">
                <DollarSign className="text-green-500 mr-2" size={20} />
                <h3 className="font-semibold">Financial Analysis</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Explore fundamental data and financial statements for deeper insights.
              </p>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/financials">View Financials</Link>
              </Button>
            </div>
            
            <div className="bg-white p-5 rounded-lg border shadow-sm">
              <div className="flex items-center mb-4">
                <TrendingUp className="text-purple-500 mr-2" size={20} />
                <h3 className="font-semibold">Technical Indicators</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Review technical indicators and patterns for your watchlist stocks.
              </p>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/technical">View Indicators</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
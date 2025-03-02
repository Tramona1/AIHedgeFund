"use client"

import * as React from "react"
import { X } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/input"

// Sample data - in production, this would come from an API
const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Discretionary",
  "Industrials",
  "Energy",
  "Materials",
  "Real Estate",
  "Utilities",
  "Consumer Staples",
]

const REITS = [
  { symbol: "VNQ", name: "Vanguard Real Estate ETF" },
  { symbol: "SPG", name: "Simon Property Group" },
  { symbol: "PLD", name: "Prologis" },
  { symbol: "AMT", name: "American Tower" },
]

const TRENDING_TICKERS = [
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "META", name: "Meta Platforms, Inc." },
]

const CRYPTO = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOGE", name: "Dogecoin" },
]

const SAMPLE_TICKERS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "WMT", name: "Walmart Inc." },
]

interface Interest {
  type: "ticker" | "sector" | "crypto" | "reit"
  value: string
  label: string
}

export function InterestForm() {
  const [interests, setInterests] = React.useState<Interest[]>([])
  const [search, setSearch] = React.useState("")
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<string[]>([])

  const addInterest = (type: "ticker" | "sector" | "crypto" | "reit", value: string, label: string) => {
    if (!interests.some((i) => i.value === value)) {
      setInterests([...interests, { type, value, label }])
    }
  }

  const removeInterest = (value: string) => {
    setInterests(interests.filter((i) => i.value !== value))
  }

  const handleSuggestionClick = (value: string, type: "ticker" | "sector" | "crypto" | "reit", name?: string) => {
    let newSelected: string[]
    if (selectedSuggestions.includes(value)) {
      newSelected = selectedSuggestions.filter((s) => s !== value)
    } else {
      newSelected = [...selectedSuggestions, value]
    }
    setSelectedSuggestions(newSelected)

    // Update search bar with all selected items
    setSearch(newSelected.join(", "))

    // Add to interests if not already added
    if (!interests.some((i) => i.value === value)) {
      addInterest(type, value, name ? `${value} - ${name}` : value)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Split the search input by commas and process each item
    const items = search
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    items.forEach((item) => {
      if (item) {
        // Check if it matches any known ticker/crypto/sector/reit
        const ticker = [...SAMPLE_TICKERS, ...TRENDING_TICKERS].find(
          (t) => t.symbol.toLowerCase() === item.toLowerCase(),
        )
        const crypto = CRYPTO.find((c) => c.symbol.toLowerCase() === item.toLowerCase())
        const reit = REITS.find((r) => r.symbol.toLowerCase() === item.toLowerCase())
        const sector = SECTORS.find((s) => s.toLowerCase() === item.toLowerCase())

        if (ticker) {
          addInterest("ticker", ticker.symbol, `${ticker.symbol} - ${ticker.name}`)
          if (!selectedSuggestions.includes(ticker.symbol)) {
            setSelectedSuggestions([...selectedSuggestions, ticker.symbol])
          }
        } else if (crypto) {
          addInterest("crypto", crypto.symbol, `${crypto.symbol} - ${crypto.name}`)
          if (!selectedSuggestions.includes(crypto.symbol)) {
            setSelectedSuggestions([...selectedSuggestions, crypto.symbol])
          }
        } else if (reit) {
          addInterest("reit", reit.symbol, `${reit.symbol} - ${reit.name}`)
          if (!selectedSuggestions.includes(reit.symbol)) {
            setSelectedSuggestions([...selectedSuggestions, reit.symbol])
          }
        } else if (sector) {
          addInterest("sector", sector, sector)
          if (!selectedSuggestions.includes(sector)) {
            setSelectedSuggestions([...selectedSuggestions, sector])
          }
        } else {
          // Could be a custom input - add as ticker
          const value = item.toUpperCase()
          addInterest("ticker", value, value)
          if (!selectedSuggestions.includes(value)) {
            setSelectedSuggestions([...selectedSuggestions, value])
          }
        }
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="w-full max-w-md"
    >
      <Card className="relative shadow-xl border-blue-100">
        <CardHeader>
          <CardTitle className="text-xl text-blue-900">Track What Matters to You</CardTitle>
          <CardDescription className="text-blue-700/70">
            Enter stocks, crypto, REITs, or sectors you want to monitor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter multiple items separated by commas..."
                className="flex-1"
              />
              <Button type="submit">Add</Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest.value}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 flex items-center gap-1"
                >
                  {interest.label}
                  <button
                    onClick={() => {
                      removeInterest(interest.value)
                      setSelectedSuggestions(selectedSuggestions.filter((s) => s !== interest.value))
                      setSearch(selectedSuggestions.filter((s) => s !== interest.value).join(", "))
                    }}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {interests.length > 0 && (
              <div className="pt-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Tracking ({interests.length})</Button>
              </div>
            )}

            <div className="rounded-lg border border-blue-100 p-4 mt-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Suggested Starting Points:</h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-blue-600 w-full">Popular Stocks:</span>
                  {TRENDING_TICKERS.map((ticker) => (
                    <Badge
                      key={ticker.symbol}
                      variant="outline"
                      className={`cursor-pointer transition-colors ${
                        selectedSuggestions.includes(ticker.symbol) ? "bg-blue-100 border-blue-200" : "hover:bg-blue-50"
                      }`}
                      onClick={() => handleSuggestionClick(ticker.symbol, "ticker", ticker.name)}
                    >
                      {ticker.symbol}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-blue-600 w-full">Crypto:</span>
                  {CRYPTO.map((crypto) => (
                    <Badge
                      key={crypto.symbol}
                      variant="outline"
                      className={`cursor-pointer transition-colors ${
                        selectedSuggestions.includes(crypto.symbol) ? "bg-blue-100 border-blue-200" : "hover:bg-blue-50"
                      }`}
                      onClick={() => handleSuggestionClick(crypto.symbol, "crypto", crypto.name)}
                    >
                      {crypto.symbol}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-blue-600 w-full">Real Estate:</span>
                  {REITS.map((reit) => (
                    <Badge
                      key={reit.symbol}
                      variant="outline"
                      className={`cursor-pointer transition-colors ${
                        selectedSuggestions.includes(reit.symbol) ? "bg-blue-100 border-blue-200" : "hover:bg-blue-50"
                      }`}
                      onClick={() => handleSuggestionClick(reit.symbol, "reit", reit.name)}
                    >
                      {reit.symbol}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-blue-600 w-full">Popular Sectors:</span>
                  {SECTORS.slice(0, 3).map((sector) => (
                    <Badge
                      key={sector}
                      variant="outline"
                      className={`cursor-pointer transition-colors ${
                        selectedSuggestions.includes(sector) ? "bg-blue-100 border-blue-200" : "hover:bg-blue-50"
                      }`}
                      onClick={() => handleSuggestionClick(sector, "sector")}
                    >
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
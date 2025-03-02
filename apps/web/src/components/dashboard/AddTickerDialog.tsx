"use client"

import * as React from "react"
import { X, Plus } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

// Sample data - in production, this would come from an API
const TRENDING_TICKERS = [
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "META", name: "Meta Platforms, Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
]

interface AddTickerDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onAddTickerAction: (symbol: string) => void
}

export function AddTickerDialog({ open, onOpenChangeAction, onAddTickerAction }: AddTickerDialogProps) {
  const [search, setSearch] = React.useState("")
  const [selectedTickers, setSelectedTickers] = React.useState<string[]>([])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedTickers([])
    }
  }, [open])

  const handleSuggestionClick = (symbol: string) => {
    if (selectedTickers.includes(symbol)) {
      setSelectedTickers(selectedTickers.filter(t => t !== symbol))
    } else {
      setSelectedTickers([...selectedTickers, symbol])
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Split the search input by commas and process each item
    const symbols = search
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
    
    setSelectedTickers([...new Set([...selectedTickers, ...symbols])])
    setSearch("")
  }

  const handleAddSelectedTickers = () => {
    selectedTickers.forEach(symbol => {
      onAddTickerAction(symbol)
    })
    onOpenChangeAction(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tickers to Your Watchlist</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter ticker symbols separated by commas..."
              className="flex-1"
            />
            <Button type="submit" size="sm">Add</Button>
          </form>

          {selectedTickers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Tickers:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTickers.map((symbol) => (
                  <Badge
                    key={symbol}
                    variant="secondary"
                    className="px-3 py-1 flex items-center gap-1"
                  >
                    {symbol}
                    <button
                      onClick={() => handleSuggestionClick(symbol)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4 mt-4">
            <h4 className="text-sm font-medium mb-2">Popular Stocks:</h4>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TICKERS.map((ticker) => (
                <Badge
                  key={ticker.symbol}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    selectedTickers.includes(ticker.symbol) ? "bg-primary/10 border-primary/20" : "hover:bg-primary/5"
                  }`}
                  onClick={() => handleSuggestionClick(ticker.symbol)}
                >
                  {ticker.symbol}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChangeAction(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddSelectedTickers}
            disabled={selectedTickers.length === 0}
          >
            Add to Watchlist
            {selectedTickers.length > 0 && ` (${selectedTickers.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
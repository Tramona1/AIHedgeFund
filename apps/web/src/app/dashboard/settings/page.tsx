"use client"

import { useState, useEffect } from "react"
import { Settings, Trash2 } from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/Badge"

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

export default function SettingsPage() {
  // Added user state for tickers, matching dashboard implementation
  const [userState, setUserState] = useState<UserState>({
    tickers: []
  })

  const [emailPreferences, setEmailPreferences] = useState({
    dailyDigest: true,
    weeklyReport: true,
    priceAlerts: true,
    insiderTrading: true,
    hedgeFundActivity: true,
  })

  // Load user tickers from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('user_tickers')
    if (savedState) {
      setUserState(JSON.parse(savedState))
    }
  }, [])

  // Remove a ticker
  const removeTicker = (symbol: string) => {
    setUserState(prev => ({
      ...prev,
      tickers: prev.tickers.filter(ticker => ticker.symbol !== symbol)
    }))
    
    // Save to localStorage after removing
    localStorage.setItem('user_tickers', JSON.stringify({
      ...userState,
      tickers: userState.tickers.filter(ticker => ticker.symbol !== symbol)
    }))
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="grid gap-6">
          {/* New card for tracked tickers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tracked Tickers</CardTitle>
              </div>
              <CardDescription>These are the stocks you're currently tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {userState.tickers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userState.tickers.map((ticker) => (
                    <div key={ticker.symbol} className="flex items-center bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span className="font-medium">{ticker.symbol}</span>
                      <button 
                        onClick={() => removeTicker(ticker.symbol)}
                        className="ml-2 text-blue-600 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm p-2 bg-gray-50 rounded">
                  You are not tracking any tickers. Add some from the dashboard page.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Preferences</CardTitle>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Choose how and when you want to receive updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-digest">Daily Market Digest</Label>
                  <Switch
                    id="daily-digest"
                    checked={emailPreferences.dailyDigest}
                    onCheckedChange={(checked: boolean) =>
                      setEmailPreferences({
                        ...emailPreferences,
                        dailyDigest: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-report">Weekly Performance Report</Label>
                  <Switch
                    id="weekly-report"
                    checked={emailPreferences.weeklyReport}
                    onCheckedChange={(checked: boolean) =>
                      setEmailPreferences({
                        ...emailPreferences,
                        weeklyReport: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-alerts">Price Movement Alerts</Label>
                  <Switch
                    id="price-alerts"
                    checked={emailPreferences.priceAlerts}
                    onCheckedChange={(checked: boolean) =>
                      setEmailPreferences({
                        ...emailPreferences,
                        priceAlerts: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="insider-trading">Insider Trading Alerts</Label>
                  <Switch
                    id="insider-trading"
                    checked={emailPreferences.insiderTrading}
                    onCheckedChange={(checked: boolean) =>
                      setEmailPreferences({
                        ...emailPreferences,
                        insiderTrading: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="hedge-fund">Hedge Fund Activity Alerts</Label>
                  <Switch
                    id="hedge-fund"
                    checked={emailPreferences.hedgeFundActivity}
                    onCheckedChange={(checked: boolean) =>
                      setEmailPreferences({
                        ...emailPreferences,
                        hedgeFundActivity: checked,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
} 
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
import { useUser } from "@clerk/nextjs"
import { userPreferencesAPI, UserPreferences } from "@/lib/api"

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
  const { isLoaded, user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)
  
  // User state for tickers, matching dashboard implementation
  const [userState, setUserState] = useState<UserState>({
    tickers: []
  })

  // State for preferences
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    tickers: [],
    customTriggers: {
      dailyDigest: true,
      weeklyReport: true, 
      priceAlerts: true,
      insiderTrading: true,
      hedgeFundActivity: true,
    }
  })

  // Load user preferences from API on component mount
  useEffect(() => {
    if (!isLoaded || !user) return
    
    const loadUserPreferences = async () => {
      try {
        setIsLoading(true)
        
        // Load from API
        const response = await userPreferencesAPI.get(user.id)
        
        if (response.userPreferences) {
          // Initialize custom triggers if they don't exist
          const customTriggers = response.userPreferences.customTriggers || {
            dailyDigest: true,
            weeklyReport: true,
            priceAlerts: true,
            insiderTrading: true,
            hedgeFundActivity: true,
          }
          
          setPreferences({
            ...response.userPreferences,
            customTriggers
          })
          
          // Also load tickers for display
          if (response.userPreferences.tickers) {
            const tickerObjects = response.userPreferences.tickers.map((symbol: string) => ({
              symbol,
              price: Math.floor(Math.random() * 1000) / 10 + 50,
              change: Math.floor(Math.random() * 60) / 10 - 3,
            }))
            
            setUserState({
              tickers: tickerObjects
            })
          }
        }
        
        // Also check localStorage for any tickers not yet saved to API
        const savedState = localStorage.getItem('user_tickers')
        if (savedState) {
          const localTickers = JSON.parse(savedState)
          
          // Check if there are tickers in localStorage not in the API response
          if (localTickers.tickers && localTickers.tickers.length > 0) {
            const apiTickerSymbols = preferences.tickers || []
            const newTickers = localTickers.tickers.filter(
              (ticker: Ticker) => !apiTickerSymbols.includes(ticker.symbol)
            )
            
            if (newTickers.length > 0) {
              // Add any new tickers to both state objects
              setUserState(prev => ({
                ...prev,
                tickers: [...prev.tickers, ...newTickers]
              }))
              
              setPreferences(prev => ({
                ...prev,
                tickers: [
                  ...(prev.tickers || []), 
                  ...newTickers.map((t: Ticker) => t.symbol)
                ]
              }))
            }
          }
        }
      } catch (error) {
        console.error("Error loading user preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserPreferences()
  }, [isLoaded, user])

  // Toggle email preference
  const toggleEmailPreference = (key: string, value: boolean) => {
    setPreferences({
      ...preferences,
      customTriggers: {
        ...(preferences.customTriggers || {}),
        [key]: value
      }
    })
  }

  // Remove a ticker
  const removeTicker = (symbol: string) => {
    // Update userState for UI
    setUserState(prev => ({
      ...prev,
      tickers: prev.tickers.filter(ticker => ticker.symbol !== symbol)
    }))
    
    // Update preferences for API
    setPreferences(prev => ({
      ...prev,
      tickers: (prev.tickers || []).filter(ticker => ticker !== symbol)
    }))
    
    // Also update localStorage to stay in sync
    const currentLocalStorage = localStorage.getItem('user_tickers')
    if (currentLocalStorage) {
      const parsedData = JSON.parse(currentLocalStorage)
      parsedData.tickers = parsedData.tickers.filter((ticker: Ticker) => ticker.symbol !== symbol)
      localStorage.setItem('user_tickers', JSON.stringify(parsedData))
    }
  }
  
  // Save all changes
  const saveChanges = async () => {
    if (!isLoaded || !user) return
    
    try {
      setIsSaving(true)
      setSaveMessage(null)
      
      // Prepare data for API
      const preferencesData = {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        tickers: preferences.tickers || [],
        sectors: preferences.sectors || [],
        tradingStyle: preferences.tradingStyle || "Growth",
        updateFrequency: preferences.updateFrequency || "weekly",
        customTriggers: preferences.customTriggers
      }
      
      // Call API to update preferences
      await userPreferencesAPI.update(preferencesData)
      
      setSaveMessage({
        type: "success",
        message: "Your settings have been saved successfully."
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      
      setSaveMessage({
        type: "error",
        message: "Failed to save settings. Please try again."
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <Container>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Container>
      </div>
    )
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
                    checked={preferences.customTriggers?.dailyDigest || false}
                    onCheckedChange={(checked: boolean) =>
                      toggleEmailPreference('dailyDigest', checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-report">Weekly Performance Report</Label>
                  <Switch
                    id="weekly-report"
                    checked={preferences.customTriggers?.weeklyReport || false}
                    onCheckedChange={(checked: boolean) =>
                      toggleEmailPreference('weeklyReport', checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-alerts">Price Movement Alerts</Label>
                  <Switch
                    id="price-alerts"
                    checked={preferences.customTriggers?.priceAlerts || false}
                    onCheckedChange={(checked: boolean) =>
                      toggleEmailPreference('priceAlerts', checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="insider-trading">Insider Trading Alerts</Label>
                  <Switch
                    id="insider-trading"
                    checked={preferences.customTriggers?.insiderTrading || false}
                    onCheckedChange={(checked: boolean) =>
                      toggleEmailPreference('insiderTrading', checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="hedge-fund">Hedge Fund Activity Alerts</Label>
                  <Switch
                    id="hedge-fund"
                    checked={preferences.customTriggers?.hedgeFundActivity || false}
                    onCheckedChange={(checked: boolean) =>
                      toggleEmailPreference('hedgeFundActivity', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {saveMessage && (
            <div className={`p-3 rounded ${saveMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {saveMessage.message}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={saveChanges} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
} 
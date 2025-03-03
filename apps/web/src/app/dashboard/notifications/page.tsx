"use client"

import { useState, useEffect } from "react"
import { Bot, Settings2, AlertCircle, Bell, Clock, Mail, MessageSquare, Plus, X, Newspaper } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUser } from "@clerk/nextjs"
import { userPreferencesAPI, UserPreferences } from "@/lib/api"

export default function NotificationsPage() {
  const [showAiChat, setShowAiChat] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [userQuery, setUserQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [newTicker, setNewTicker] = useState("")
  const { isLoaded, user } = useUser()
  
  // State for notification preferences
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    tickers: [],
    sectors: [],
    updateFrequency: "weekly",
    customTriggers: {
      hedgeFund: true,
      investor: true,
      market: true,
      technical: true,
      realtime: false,
      weekly: true,
      event: true,
      email: true,
      dashboard: true,
      newsletter: true,
      newsletterMarket: true,
      newsletterTickers: true,
      newsletterSectors: true,
      newsletterRecommendations: true
    }
  })

  // Load user preferences on component mount
  useEffect(() => {
    if (!isLoaded || !user) return
    
    const loadUserPreferences = async () => {
      try {
        setIsLoading(true)
        const response = await userPreferencesAPI.get(user.id)
        
        if (response.userPreferences) {
          // Initialize custom triggers if they don't exist
          const customTriggers = response.userPreferences.customTriggers || {
            hedgeFund: true,
            investor: true,
            market: true,
            technical: true,
            realtime: false,
            weekly: true,
            event: true,
            email: true,
            dashboard: true,
            newsletter: true,
          }
          
          setPreferences({
            ...response.userPreferences,
            customTriggers
          })
        }
      } catch (error) {
        console.error("Error loading user preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserPreferences()
  }, [isLoaded, user])

  const handleAiQuery = async () => {
    setAiLoading(true)
    // Simulate AI response - in production, this would call your AI endpoint
    setTimeout(() => {
      setAiResponse(
        "Based on your notification settings and portfolio, I recommend enabling real-time alerts for hedge fund activity in tech stocks, as there's been increased institutional interest in your holdings ($" + 
        (preferences.tickers && preferences.tickers.length > 0 ? preferences.tickers.join(", $") : "AAPL, NVDA") + 
        "). Also consider adding dark pool alerts for these tickers.",
      )
      setAiLoading(false)
    }, 1500)
  }
  
  const handleAddTicker = () => {
    if (newTicker && !preferences.tickers?.includes(newTicker)) {
      setPreferences({
        ...preferences,
        tickers: [...(preferences.tickers || []), newTicker]
      })
      setNewTicker("")
    }
  }
  
  const handleRemoveTicker = (ticker: string) => {
    setPreferences({
      ...preferences,
      tickers: preferences.tickers?.filter(t => t !== ticker) || []
    })
  }
  
  const handleToggleNotification = (key: string, value: boolean) => {
    setPreferences({
      ...preferences,
      customTriggers: {
        ...(preferences.customTriggers || {}),
        [key]: value
      }
    })
  }
  
  const handleSaveChanges = async () => {
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
        message: "Your notification settings have been saved successfully."
      })
    } catch (error) {
      console.error("Error saving notification settings:", error)
      
      setSaveMessage({
        type: "error",
        message: "Failed to save notification settings. Please try again."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateFrequency = (frequency: string) => {
    if (frequency === "daily" || frequency === "weekly" || frequency === "realtime") {
      setPreferences({
        ...preferences,
        updateFrequency: frequency
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notification Settings</h1>
            <p className="text-muted-foreground">Customize how you want to be notified about market events</p>
          </div>
          <Dialog open={showAiChat} onOpenChange={setShowAiChat}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Bot className="h-4 w-4" />
                Ask AI Assistant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Notification Assistant</DialogTitle>
                <DialogDescription>
                  Ask me about optimizing your notification settings or understanding market events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="E.g., What notifications should I set for tech stocks?"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                  />
                  <Button onClick={handleAiQuery} disabled={aiLoading}>
                    Ask
                  </Button>
                </div>
                {aiLoading && <div className="text-sm text-muted-foreground">AI is thinking...</div>}
                {aiResponse && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex gap-2">
                        <Bot className="h-4 w-4 shrink-0 mt-1" />
                        <p className="text-sm">{aiResponse}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="stocks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stocks" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Stocks & Assets
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Alert Types
            </TabsTrigger>
            <TabsTrigger value="timing" className="gap-2">
              <Clock className="h-4 w-4" />
              Timing & Delivery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stocks">
            <Card>
              <CardHeader>
                <CardTitle>Stocks & Assets</CardTitle>
                <CardDescription>Choose which assets you want to track</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Currently Tracking</Label>
                  <div className="flex flex-wrap gap-2">
                    {preferences.tickers && preferences.tickers.length > 0 ? (
                      preferences.tickers.map((ticker) => (
                        <Badge key={ticker} variant="secondary">
                          ${ticker}
                          <button 
                            className="ml-1 hover:text-destructive"
                            onClick={() => handleRemoveTicker(ticker)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No tickers added yet</div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Add ticker"
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value)}
                        className="w-24"
                      />
                      <Button variant="outline" size="sm" onClick={handleAddTicker}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="holdings">Holdings Notifications</Label>
                    <Switch 
                      id="holdings"
                      checked={preferences.customTriggers?.holdings || false}
                      onCheckedChange={(checked) => handleToggleNotification('holdings', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="watchlist">Watchlist Notifications</Label>
                    <Switch 
                      id="watchlist"
                      checked={preferences.customTriggers?.watchlist || true}
                      onCheckedChange={(checked) => handleToggleNotification('watchlist', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="potential">Potential Buys Notifications</Label>
                    <Switch 
                      id="potential"
                      checked={preferences.customTriggers?.potential || false}
                      onCheckedChange={(checked) => handleToggleNotification('potential', checked)}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Sectors</Label>
                  <div className="flex flex-wrap gap-2">
                    {preferences.sectors && preferences.sectors.length > 0 ? (
                      preferences.sectors.map((sector) => (
                        <Badge key={sector} variant="outline" className="cursor-pointer">
                          {sector}
                        </Badge>
                      ))
                    ) : (
                      <>
                        <Badge variant="outline" className="cursor-pointer">
                          Technology
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          Healthcare
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          Finance
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          Energy
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alert Types</CardTitle>
                <CardDescription>Select which types of alerts you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="hedge-fund">Hedge Fund Activity</Label>
                      <p className="text-sm text-muted-foreground">Alert when major funds make significant moves</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="hedge-fund"
                        checked={preferences.customTriggers?.hedgeFund || true}
                        onCheckedChange={(checked) => handleToggleNotification('hedgeFund', checked)}
                      />
                      <Button variant="outline" size="sm">
                        Customize
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="investor">Top Investor Actions</Label>
                      <p className="text-sm text-muted-foreground">Track moves by notable investors</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="investor"
                        checked={preferences.customTriggers?.investor || true}
                        onCheckedChange={(checked) => handleToggleNotification('investor', checked)}
                      />
                      <Button variant="outline" size="sm">
                        Customize
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="market">Market Shifts</Label>
                      <p className="text-sm text-muted-foreground">Alert on significant price or volume changes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="market"
                        checked={preferences.customTriggers?.market || true}
                        onCheckedChange={(checked) => handleToggleNotification('market', checked)}
                      />
                      <Button variant="outline" size="sm">
                        Customize
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="technical">Technical Indicators</Label>
                      <p className="text-sm text-muted-foreground">RSI, MACD, and other technical signals</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="technical"
                        checked={preferences.customTriggers?.technical || true}
                        onCheckedChange={(checked) => handleToggleNotification('technical', checked)}
                      />
                      <Button variant="outline" size="sm">
                        Customize
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timing">
            <Card>
              <CardHeader>
                <CardTitle>Timing & Delivery</CardTitle>
                <CardDescription>Set when and how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly">Weekly Summary</Label>
                      <p className="text-sm text-muted-foreground">Receive a weekly digest every Monday at 8 AM</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="weekly"
                        checked={preferences.customTriggers?.weekly || true}
                        onCheckedChange={(checked) => handleToggleNotification('weekly', checked)}
                      />
                      <Button variant="outline" size="sm">
                        Edit Time
                      </Button>
                    </div>
                  </div>
                  <Separator />

                  {/* Newsletter Section */}
                  <div className="rounded-lg border p-4 bg-blue-50">
                    <div className="flex items-start gap-3 mb-4">
                      <Newspaper className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-medium text-blue-900">Newsletter Subscription</h3>
                        <p className="text-sm text-blue-700">
                          Your personalized investment newsletter with insights based on your interests
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Switch 
                          id="newsletter"
                          checked={preferences.customTriggers?.newsletter || true}
                          onCheckedChange={(checked) => handleToggleNotification('newsletter', checked)}
                        />
                      </div>
                    </div>

                    {preferences.customTriggers?.newsletter && (
                      <div className="space-y-4 pl-8">
                        <div className="space-y-2">
                          <Label htmlFor="newsletter-frequency" className="text-blue-900">Frequency</Label>
                          <div className="flex gap-4 mt-2">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  id="freq-daily" 
                                  name="frequency"
                                  checked={preferences.updateFrequency === 'daily'}
                                  onChange={() => handleUpdateFrequency('daily')}
                                  className="mr-1"
                                />
                                <Label htmlFor="freq-daily" className="text-blue-800 flex items-center">
                                  <div>
                                    <span className="font-medium">Daily</span>
                                    <p className="text-xs text-blue-600 mt-1">Sent every morning at 8 AM</p>
                                  </div>
                                </Label>
                              </div>
                            </div>
                            
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  id="freq-weekly" 
                                  name="frequency"
                                  checked={preferences.updateFrequency === 'weekly'}
                                  onChange={() => handleUpdateFrequency('weekly')}
                                  className="mr-1"
                                />
                                <Label htmlFor="freq-weekly" className="text-blue-800 flex items-center">
                                  <div>
                                    <span className="font-medium">Weekly</span>
                                    <p className="text-xs text-blue-600 mt-1">Sent every Monday at 8 AM</p>
                                  </div>
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-blue-900">Newsletter Content</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                id="newsletter-market" 
                                className="mt-1"
                                checked={preferences.customTriggers?.newsletterMarket !== false}
                                onChange={(e) => handleToggleNotification('newsletterMarket', e.target.checked)}
                              />
                              <div>
                                <Label htmlFor="newsletter-market" className="text-blue-800">Market Summary</Label>
                                <p className="text-xs text-blue-600">Overall market trends and insights</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                id="newsletter-tickers" 
                                className="mt-1"
                                checked={preferences.customTriggers?.newsletterTickers !== false}
                                onChange={(e) => handleToggleNotification('newsletterTickers', e.target.checked)}
                              />
                              <div>
                                <Label htmlFor="newsletter-tickers" className="text-blue-800">Your Tickers</Label>
                                <p className="text-xs text-blue-600">Updates on your tracked stocks</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                id="newsletter-sectors" 
                                className="mt-1"
                                checked={preferences.customTriggers?.newsletterSectors !== false}
                                onChange={(e) => handleToggleNotification('newsletterSectors', e.target.checked)}
                              />
                              <div>
                                <Label htmlFor="newsletter-sectors" className="text-blue-800">Sector Insights</Label>
                                <p className="text-xs text-blue-600">Analysis of your followed sectors</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                id="newsletter-recommendations" 
                                className="mt-1"
                                checked={preferences.customTriggers?.newsletterRecommendations !== false}
                                onChange={(e) => handleToggleNotification('newsletterRecommendations', e.target.checked)}
                              />
                              <div>
                                <Label htmlFor="newsletter-recommendations" className="text-blue-800">Trading Recommendations</Label>
                                <p className="text-xs text-blue-600">AI-generated trade ideas</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 italic mt-2">
                            Newsletter content will be personalized based on your selected tickers, sectors, and trading style
                          </p>
                        </div>
                        
                        <div className="mt-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
                            onClick={() => handleSaveChanges()}
                          >
                            Update Newsletter Preferences
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="event">Event-Driven Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified within 1-2 hours of significant events
                      </p>
                    </div>
                    <Switch 
                      id="event"
                      checked={preferences.customTriggers?.event || true}
                      onCheckedChange={(checked) => handleToggleNotification('event', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="realtime">Real-Time Notifications</Label>
                      <p className="text-sm text-muted-foreground">Instant alerts for urgent market events</p>
                    </div>
                    <Switch 
                      id="realtime"
                      checked={preferences.customTriggers?.realtime || false}
                      onCheckedChange={(checked) => handleToggleNotification('realtime', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Delivery Channels</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="email"
                          checked={preferences.customTriggers?.email || true}
                          onCheckedChange={(checked) => handleToggleNotification('email', checked)}
                        />
                        <Label htmlFor="email">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="dashboard"
                          checked={preferences.customTriggers?.dashboard || true}
                          onCheckedChange={(checked) => handleToggleNotification('dashboard', checked)}
                        />
                        <Label htmlFor="dashboard">
                          <Bell className="h-4 w-4" />
                          Dashboard
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="push" disabled />
                        <Label htmlFor="push" className="text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          Push (Coming Soon)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {saveMessage && (
          <div className={`mt-4 p-3 rounded ${saveMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {saveMessage.message}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setPreferences({
                ...preferences,
                customTriggers: {
                  hedgeFund: true,
                  investor: true,
                  market: true,
                  technical: true,
                  realtime: false,
                  weekly: true,
                  event: true,
                  email: true,
                  dashboard: true,
                  newsletter: true,
                }
              })
            }}
          >
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Floating AI Chat Button */}
        <motion.div
          className="fixed bottom-6 right-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        >
          <Button size="lg" className="rounded-full h-12 w-12 p-0 shadow-lg" onClick={() => setShowAiChat(true)}>
            <Bot className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
} 
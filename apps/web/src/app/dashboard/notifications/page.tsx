"use client"

import { useState } from "react"
import { Bot, Settings2, AlertCircle, Bell, Clock, Mail, MessageSquare } from "lucide-react"
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

export default function NotificationsPage() {
  const [showAiChat, setShowAiChat] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [userQuery, setUserQuery] = useState("")

  const handleAiQuery = async () => {
    setAiLoading(true)
    // Simulate AI response - in production, this would call your AI endpoint
    setTimeout(() => {
      setAiResponse(
        "Based on your notification settings and portfolio, I recommend enabling real-time alerts for hedge fund activity in tech stocks, as there's been increased institutional interest in your holdings ($AAPL, $NVDA). Also consider adding dark pool alerts for these tickers.",
      )
      setAiLoading(false)
    }, 1500)
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
                    <Badge variant="secondary">
                      $AAPL
                      <button className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                    <Badge variant="secondary">
                      $NVDA
                      <button className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                    <Badge variant="secondary">
                      $TSLA
                      <button className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                    <Button variant="outline" size="sm">
                      Add Stock
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="holdings">Holdings Notifications</Label>
                    <Switch id="holdings" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="watchlist">Watchlist Notifications</Label>
                    <Switch id="watchlist" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="potential">Potential Buys Notifications</Label>
                    <Switch id="potential" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Sectors</Label>
                  <div className="flex flex-wrap gap-2">
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
                    <Button variant="outline" size="sm">
                      More Sectors
                    </Button>
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
                      <Switch id="hedge-fund" defaultChecked />
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
                      <Switch id="investor" defaultChecked />
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
                      <Switch id="market" defaultChecked />
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
                      <Switch id="technical" defaultChecked />
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
                      <Switch id="weekly" defaultChecked />
                      <Button variant="outline" size="sm">
                        Edit Time
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="event">Event-Driven Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified within 1-2 hours of significant events
                      </p>
                    </div>
                    <Switch id="event" defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="realtime">Real-Time Notifications</Label>
                      <p className="text-sm text-muted-foreground">Instant alerts for urgent market events</p>
                    </div>
                    <Switch id="realtime" />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Delivery Channels</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Switch id="email" defaultChecked />
                        <Label htmlFor="email">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="dashboard" defaultChecked />
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

        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Changes</Button>
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
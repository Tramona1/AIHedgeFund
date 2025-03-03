"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Import commented out as the component doesn't exist
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { BellRing, Percent, BarChart3, Activity, Settings } from "lucide-react";

export default function PriceAlertsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for price threshold alerts
  const [priceThresholds, setPriceThresholds] = useState([
    { id: 1, symbol: "AAPL", price: 190, direction: "above", enabled: true },
    { id: 2, symbol: "MSFT", price: 410, direction: "below", enabled: true },
    { id: 3, symbol: "NVDA", price: 950, direction: "below", enabled: false }
  ]);
  
  // State for percent change alerts
  const [percentChangeEnabled, setPercentChangeEnabled] = useState(true);
  const [percentThreshold, setPercentThreshold] = useState("5");
  
  // State for volume alerts
  const [volumeAlertEnabled, setVolumeAlertEnabled] = useState(true);
  const [volumeMultiple, setVolumeMultiple] = useState("2");
  
  // State for RSI alerts
  const [rsiAlertsEnabled, setRsiAlertsEnabled] = useState(true);
  const [rsiOverbought, setRsiOverbought] = useState("70");
  const [rsiOversold, setRsiOversold] = useState("30");
  
  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would save to the database via API
      // await saveAlertSettings({ ... });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Settings saved",
        description: "Your price alert settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const addPriceThreshold = () => {
    const newId = Math.max(0, ...priceThresholds.map(pt => pt.id)) + 1;
    setPriceThresholds([
      ...priceThresholds, 
      { id: newId, symbol: "", price: 0, direction: "above", enabled: true }
    ]);
  };
  
  const removePriceThreshold = (id: number) => {
    setPriceThresholds(priceThresholds.filter(pt => pt.id !== id));
  };
  
  const updatePriceThreshold = (id: number, field: string, value: any) => {
    setPriceThresholds(priceThresholds.map(pt => 
      pt.id === id ? { ...pt, [field]: value } : pt
    ));
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Price Alerts</h1>
      <p className="text-muted-foreground mb-8">
        Configure alerts to be notified when stocks in your watchlist meet certain conditions.
      </p>
      
      <Tabs defaultValue="thresholds">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="thresholds">Price Thresholds</TabsTrigger>
          <TabsTrigger value="percent">Percent Change</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
        </TabsList>
        
        {/* Price Threshold Alerts */}
        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellRing className="mr-2 h-5 w-5" />
                Price Threshold Alerts
              </CardTitle>
              <CardDescription>
                Get notified when stocks reach specific price levels.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {priceThresholds.map((threshold) => (
                  <div key={threshold.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <Label htmlFor={`symbol-${threshold.id}`}>Symbol</Label>
                      <Input 
                        id={`symbol-${threshold.id}`}
                        value={threshold.symbol}
                        onChange={(e) => updatePriceThreshold(threshold.id, 'symbol', e.target.value.toUpperCase())}
                        placeholder="AAPL"
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <Label htmlFor={`direction-${threshold.id}`}>Direction</Label>
                      <select
                        id={`direction-${threshold.id}`}
                        value={threshold.direction}
                        onChange={(e) => updatePriceThreshold(threshold.id, 'direction', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select direction</option>
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                      </select>
                    </div>
                    
                    <div className="col-span-3">
                      <Label htmlFor={`price-${threshold.id}`}>Price ($)</Label>
                      <Input 
                        id={`price-${threshold.id}`}
                        type="number"
                        value={threshold.price}
                        onChange={(e) => updatePriceThreshold(threshold.id, 'price', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor={`enabled-${threshold.id}`} className="block mb-2">Enabled</Label>
                      <Switch 
                        id={`enabled-${threshold.id}`}
                        checked={threshold.enabled}
                        onCheckedChange={(checked) => updatePriceThreshold(threshold.id, 'enabled', checked)}
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="mt-6"
                        onClick={() => removePriceThreshold(threshold.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addPriceThreshold}
                >
                  Add Price Threshold
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Percent Change Alerts */}
        <TabsContent value="percent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Percent className="mr-2 h-5 w-5" />
                Percent Change Alerts
              </CardTitle>
              <CardDescription>
                Get notified when stocks move by a significant percentage.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <Label htmlFor="percent-change-enabled" className="text-base">
                  Enable percent change alerts
                </Label>
                <Switch 
                  id="percent-change-enabled"
                  checked={percentChangeEnabled}
                  onCheckedChange={setPercentChangeEnabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="percent-threshold">Threshold percentage</Label>
                  <div className="flex items-center">
                    <Input 
                      id="percent-threshold"
                      value={percentThreshold}
                      onChange={(e) => setPercentThreshold(e.target.value)}
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      disabled={!percentChangeEnabled}
                      className="mr-2"
                    />
                    <span>%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll be notified when stocks move up or down by this percentage or more.
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">How it works</h4>
                  <p className="text-sm">
                    Percent change alerts monitor daily stock price movements and notify you
                    when stocks in your watchlist experience significant price changes in either direction.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Volume Alerts */}
        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Volume Alerts
              </CardTitle>
              <CardDescription>
                Get notified when trading volume spikes above normal levels.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <Label htmlFor="volume-alert-enabled" className="text-base">
                  Enable volume spike alerts
                </Label>
                <Switch 
                  id="volume-alert-enabled"
                  checked={volumeAlertEnabled}
                  onCheckedChange={setVolumeAlertEnabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="volume-multiple">Volume multiple</Label>
                  <div className="flex items-center">
                    <Input 
                      id="volume-multiple"
                      value={volumeMultiple}
                      onChange={(e) => setVolumeMultiple(e.target.value)}
                      type="number"
                      min="1.5"
                      max="5"
                      step="0.5"
                      disabled={!volumeAlertEnabled}
                      className="mr-2"
                    />
                    <span>× average</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll be notified when volume exceeds this multiple of the average daily volume.
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Why volume matters</h4>
                  <p className="text-sm">
                    Unusual volume often precedes significant price movements and can indicate increased
                    investor interest. Volume spikes may signal important news or institutional activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Technical Indicator Alerts */}
        <TabsContent value="indicators">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Technical Indicator Alerts
              </CardTitle>
              <CardDescription>
                Get notified when technical indicators signal potential trading opportunities.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <Label htmlFor="rsi-alerts-enabled" className="text-base">
                  Enable RSI alerts
                </Label>
                <Switch 
                  id="rsi-alerts-enabled"
                  checked={rsiAlertsEnabled}
                  onCheckedChange={setRsiAlertsEnabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rsi-overbought">RSI Overbought level</Label>
                    <div className="flex items-center">
                      <Input 
                        id="rsi-overbought"
                        value={rsiOverbought}
                        onChange={(e) => setRsiOverbought(e.target.value)}
                        type="number"
                        min="60"
                        max="90"
                        disabled={!rsiAlertsEnabled}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Alert when RSI rises above this level (potentially overbought).
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rsi-oversold">RSI Oversold level</Label>
                    <div className="flex items-center">
                      <Input 
                        id="rsi-oversold"
                        value={rsiOversold}
                        onChange={(e) => setRsiOversold(e.target.value)}
                        type="number"
                        min="10"
                        max="40"
                        disabled={!rsiAlertsEnabled}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Alert when RSI falls below this level (potentially oversold).
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">About RSI</h4>
                  <p className="text-sm">
                    The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and
                    change of price movements. RSI oscillates between 0 and 100, with readings above 70
                    typically considered overbought and readings below 30 considered oversold.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 flex justify-end">
        <Button onClick={saveSettings} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Alert Settings"}
        </Button>
      </div>
    </div>
  );
} 